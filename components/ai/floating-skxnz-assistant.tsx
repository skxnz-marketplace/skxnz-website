"use client";

import Link from "next/link";
import {
  type FormEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { SafeImage } from "@/components/shared/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { getProductHref } from "@/lib/catalog/product-links";
import { cn } from "@/lib/cn";
import {
  featuredProducts,
  formatProductPrice,
  products as demoProducts,
} from "@/lib/data/products";
import { getDemoUserProfile } from "@/lib/data/user";
import { skxnzFallbackAssets } from "@/src/lib/assets";
import {
  skxnzAssistantLimits,
  type SkxnzAssistantIntent,
  type SkxnzAssistantProductRecommendation,
  type SkxnzAssistantResponse,
  type SkxnzAssistantSuggestedLink,
} from "@/src/lib/skxnzAssistant";

type AssistantMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  intent?: SkxnzAssistantIntent;
  blocked?: boolean;
  products?: SkxnzAssistantProductRecommendation[];
  suggestedLinks?: SkxnzAssistantSuggestedLink[];
  followUpQuestion?: string;
};

type AssistantPosition = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  moved: boolean;
};

type AssistantEventName =
  | "assistant_opened"
  | "assistant_closed"
  | "assistant_dragged"
  | "assistant_message_sent"
  | "assistant_recommendation_shown"
  | "assistant_product_clicked"
  | "assistant_blocked_query"
  | "assistant_add_to_cart_clicked";

const buttonSize = 64;
const positionStorageKey = "skxnz-floating-ai-position-v4";

const starterPrompts = [
  "Style me for a beach party",
  "Find a t-shirt under my budget",
  "Show streetwear picks",
  "Compare two products",
  "Help me choose a gift",
  "What should I wear for college?",
  "Show limited edition picks",
];

const openingMessage: AssistantMessage = {
  id: "assistant-welcome",
  role: "assistant",
  content:
    "I’ll keep this inside SKXNZ. Ask for a product, outfit, budget, category, or styling brief.",
};

const assistantPreviewProducts = (featuredProducts.length ? featuredProducts : demoProducts)
  .slice(0, 3)
  .map((product) => ({
    id: `assistant-preview-${product.id}`,
    name: product.name,
    price: formatProductPrice(product.salePrice ?? product.price),
    image: product.image,
    href: getProductHref(product),
  }));

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("h-6 w-6", className)}
      fill="none"
    >
      <path
        d="M12 2.8 14.35 9.65 21.2 12l-6.85 2.35L12 21.2l-2.35-6.85L2.8 12l6.85-2.35L12 2.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m18.3 3.9.65 1.8 1.75.6-1.75.62-.65 1.78-.62-1.78-1.78-.62 1.78-.6.62-1.8Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M4 10h10.6m0 0-4.2-4.2m4.2 4.2-4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function clampPosition(position: AssistantPosition): AssistantPosition {
  if (typeof window === "undefined") {
    return position;
  }

  const margin = 14;
  const topSafeArea = 82;
  const maxX = Math.max(margin, window.innerWidth - buttonSize - margin);
  const maxY = Math.max(topSafeArea, window.innerHeight - buttonSize - margin);

  return {
    x: Math.min(Math.max(position.x, margin), maxX),
    y: Math.min(Math.max(position.y, topSafeArea), maxY),
  };
}

function getDefaultPosition(): AssistantPosition {
  if (typeof window === "undefined") {
    return { x: 24, y: 24 };
  }

  return clampPosition({
    x: window.innerWidth - buttonSize - 24,
    y: window.innerHeight - buttonSize - 28,
  });
}

function readStoredPosition() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(positionStorageKey);

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue) as Partial<AssistantPosition>;

    if (typeof parsedValue.x !== "number" || typeof parsedValue.y !== "number") {
      return null;
    }

    return clampPosition({ x: parsedValue.x, y: parsedValue.y });
  } catch {
    return null;
  }
}

function storePosition(position: AssistantPosition) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(positionStorageKey, JSON.stringify(position));
}

function trackAssistantEvent(name: AssistantEventName, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("skxnz:assistant", {
      detail: {
        name,
        payload: payload ?? {},
      },
    }),
  );
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function ProductRecommendationCard({
  product,
  onAddToCart,
  onSave,
  isSaved,
}: {
  product: SkxnzAssistantProductRecommendation;
  onAddToCart: (product: SkxnzAssistantProductRecommendation) => void;
  onSave: (product: SkxnzAssistantProductRecommendation) => void;
  isSaved: boolean;
}) {
  return (
    <article className="grid min-w-0 grid-cols-[74px_minmax(0,1fr)] gap-3 rounded-[20px] border border-sandstone/80 bg-pearlcream p-2.5 text-midnightbrown shadow-[0_16px_32px_rgba(17,17,17,0.18)]">
      <Link
        href={product.href}
        onClick={() =>
          trackAssistantEvent("assistant_product_clicked", {
            productId: product.id,
            source: "recommendation_card",
          })
        }
        className="relative h-[86px] w-[74px] shrink-0 overflow-hidden rounded-[16px] border border-sandstone bg-white"
      >
        <SafeImage
          src={product.image}
          fallbackSrc={skxnzFallbackAssets.product}
          alt={product.name}
          fill
          sizes="76px"
          className="object-cover object-center"
        />
      </Link>

      <div className="flex min-w-0 flex-col">
        <p className="line-clamp-1 min-w-0 break-words text-[0.6rem] font-bold uppercase tracking-[0.18em] text-teal">
          {product.brandName || "SKXNZ"} · {product.category || "Product"}
        </p>
        <Link
          href={product.href}
          onClick={() =>
            trackAssistantEvent("assistant_product_clicked", {
              productId: product.id,
              source: "recommendation_title",
            })
          }
          className="product-title mt-1 line-clamp-2 min-w-0 break-words text-sm font-semibold leading-snug tracking-[0.01em] text-sangria transition hover:text-obsidian"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-xs font-bold text-midnightbrown">
          {product.formattedPrice || "Price shown on product page"}
        </p>
        {product.colors.length > 0 ? (
          <p className="mt-1 line-clamp-1 min-w-0 break-words text-[0.66rem] uppercase tracking-[0.16em] text-stone">
            Color: {product.matchedColor ?? product.colors.slice(0, 2).join(", ")}
          </p>
        ) : null}
        <p className="mt-2 line-clamp-2 min-w-0 break-words text-[0.72rem] leading-5 text-stone">
          {product.reason}
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link
            href={product.href}
            onClick={() =>
              trackAssistantEvent("assistant_product_clicked", {
                productId: product.id,
                source: "view_product_button",
              })
            }
            className={buttonVariants({
              variant: "primary",
              size: "sm",
              className: "w-full px-2 text-[0.62rem]",
            })}
          >
            View Product
          </Link>
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className={buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "w-full px-2 text-[0.62rem]",
            })}
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={() => onSave(product)}
            className={buttonVariants({
              variant: isSaved ? "primary" : "ghost",
              size: "sm",
              className: "w-full px-2 text-[0.62rem]",
            })}
          >
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </article>
  );
}

function AssistantPreviewCard({
  product,
}: {
  product: (typeof assistantPreviewProducts)[number];
}) {
  return (
    <Link
      href={product.href}
      className="group min-w-0 rounded-[16px] bg-pearlcream p-1.5 text-midnightbrown shadow-[0_12px_24px_rgba(17,17,17,0.18)] transition hover:-translate-y-0.5 hover:bg-white"
    >
      <span className="relative block aspect-square overflow-hidden rounded-[12px] bg-white">
        <SafeImage
          src={product.image}
          fallbackSrc={skxnzFallbackAssets.product}
          alt={product.name}
          fill
          sizes="96px"
          className="object-cover object-center transition duration-300 group-hover:scale-105"
        />
      </span>
      <span className="mt-2 block line-clamp-2 min-w-0 break-words text-[0.58rem] font-bold uppercase leading-tight tracking-[0.08em]">
        {product.name}
      </span>
      <span className="mt-1 block text-[0.62rem] font-bold text-sangria">
        {product.price}
      </span>
    </Link>
  );
}

export function FloatingSkxnzAssistant() {
  const {
    addToCart,
    addToWishlist,
    cartItems,
    wishlistProducts,
    isInWishlist,
  } = useMarketplace();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<AssistantPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([openingMessage]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeDragRef = useRef<DragState | null>(null);
  const pendingPositionRef = useRef<AssistantPosition | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousUserSelectRef = useRef("");
  const previousCursorRef = useRef("");

  const buttonStyle = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
      }
    : {
        right: "24px",
        bottom: "24px",
      };

  const canSend = useMemo(
    () =>
      inputValue.trim().length > 0 &&
      inputValue.trim().length <= skxnzAssistantLimits.maxMessageLength &&
      !isLoading,
    [inputValue, isLoading],
  );

  useEffect(() => {
    setIsMounted(true);
    setPosition(readStoredPosition() ?? getDefaultPosition());

    const handleResize = () => {
      setPosition((current) => {
        const nextPosition = clampPosition(current ?? getDefaultPosition());
        storePosition(nextPosition);
        return nextPosition;
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      activeDragRef.current = null;
      pendingPositionRef.current = null;
      restoreDragBodyState();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading, notice]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        trackAssistantEvent("assistant_closed", { method: "escape" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const toggleAssistantFromButton = () => {
    setIsOpen((current) => {
      const nextOpenState = !current;
      trackAssistantEvent(nextOpenState ? "assistant_opened" : "assistant_closed", {
        method: "floating_button",
      });
      return nextOpenState;
    });
  };

  const closeAssistant = () => {
    setIsOpen(false);
    trackAssistantEvent("assistant_closed", { method: "button" });
  };

  const resetChat = () => {
    setMessages([openingMessage]);
    setNotice("");
    setInputValue("");
    inputRef.current?.focus();
  };

  const schedulePositionUpdate = (nextPosition: AssistantPosition) => {
    pendingPositionRef.current = nextPosition;

    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;

      if (!pendingPositionRef.current) {
        return;
      }

      setPosition(pendingPositionRef.current);
    });
  };

  const restoreDragBodyState = () => {
    document.body.style.userSelect = previousUserSelectRef.current;
    document.body.style.cursor = previousCursorRef.current;
  };

  const finishDrag = (event: PointerEvent<HTMLButtonElement>, wasCancelled = false) => {
    const dragState = activeDragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const finalPosition = clampPosition({
      x: dragState.currentX,
      y: dragState.currentY,
    });

    activeDragRef.current = null;
    pendingPositionRef.current = null;
    setIsDragging(false);
    restoreDragBodyState();

    if (dragState.moved) {
      setPosition(finalPosition);
      storePosition(finalPosition);
      trackAssistantEvent("assistant_dragged", finalPosition);
      return;
    }

    if (!wasCancelled) {
      toggleAssistantFromButton();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const startPosition = position ?? getDefaultPosition();
    setPosition(startPosition);

    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    previousUserSelectRef.current = document.body.style.userSelect;
    previousCursorRef.current = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    activeDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: startPosition.x,
      originY: startPosition.y,
      currentX: startPosition.x,
      currentY: startPosition.y,
      moved: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const dragState = activeDragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.moved && Math.abs(deltaX) <= 5 && Math.abs(deltaY) <= 5) {
      return;
    }

    const nextPosition = clampPosition({
      x: dragState.originX + deltaX,
      y: dragState.originY + deltaY,
    });

    dragState.currentX = nextPosition.x;
    dragState.currentY = nextPosition.y;
    dragState.moved = true;
    activeDragRef.current = dragState;
    setIsDragging(true);
    schedulePositionUpdate(nextPosition);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    finishDrag(event);
  };

  const submitPrompt = async (message: string) => {
    const trimmedMessage = message.trim().replace(/\s+/g, " ");

    if (!trimmedMessage) {
      setNotice("Type a SKXNZ shopping question first.");
      return;
    }

    if (trimmedMessage.length > skxnzAssistantLimits.maxMessageLength) {
      setNotice(
        `Keep messages under ${skxnzAssistantLimits.maxMessageLength} characters so I can stay focused on SKXNZ shopping.`,
      );
      return;
    }

    setNotice("");
    setInputValue("");
    setIsLoading(true);
    setMessages((current) => [
      ...current,
      {
        id: createMessageId("user"),
        role: "user",
        content: trimmedMessage,
      },
    ]);
    trackAssistantEvent("assistant_message_sent", {
      length: trimmedMessage.length,
    });

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          context: {
            cartProductIds: cartItems.map((item) => item.productId),
            wishlistProductIds: wishlistProducts.map((product) => product.id),
            stylePreferences: getDemoUserProfile(),
          },
        }),
      });

      const payload = (await response.json()) as Partial<SkxnzAssistantResponse> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Assistant request failed.");
      }

      if (payload.blocked) {
        trackAssistantEvent("assistant_blocked_query", {
          intent: payload.intent,
        });
      }

      if (payload.recommendedProducts?.length) {
        trackAssistantEvent("assistant_recommendation_shown", {
          productIds: payload.recommendedProducts.map((product) => product.id),
          intent: payload.intent,
        });
      }

      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content:
            payload.reply ??
            "I can only help with SKXNZ shopping, styling, products, orders, and marketplace support.",
          intent: payload.intent,
          blocked: payload.blocked,
          products: payload.recommendedProducts ?? [],
          suggestedLinks: payload.suggestedLinks ?? [],
          followUpQuestion: payload.followUpQuestion,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant-error"),
          role: "assistant",
          content:
            "The SKXNZ assistant could not respond right now. Try again or browse the catalogue.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (canSend) {
      void submitPrompt(inputValue);
      return;
    }

    if (!inputValue.trim()) {
      setNotice("Type a SKXNZ shopping question first.");
      return;
    }

    if (inputValue.trim().length > skxnzAssistantLimits.maxMessageLength) {
      setNotice(
        `Keep messages under ${skxnzAssistantLimits.maxMessageLength} characters so I can stay focused on SKXNZ shopping.`,
      );
    }
  };

  const handleAddToCart = (product: SkxnzAssistantProductRecommendation) => {
    const result = addToCart({
      productId: product.id,
      size: product.sizes[0] ?? "One Size",
      color: product.colors[0] ?? "Pearl Cream",
      quantity: 1,
    });

    trackAssistantEvent("assistant_add_to_cart_clicked", {
      productId: product.id,
      ok: result.ok,
    });
    setNotice(result.message);
  };

  const handleSave = (product: SkxnzAssistantProductRecommendation) => {
    addToWishlist(product.id);
    setNotice(`${product.name} saved to your MVP wishlist.`);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {isOpen ? (
        <section
          aria-label="SKXNZ AI Assistant chat"
          className={cn(
            "fixed z-[120] flex max-h-[calc(100vh-1.25rem)] min-w-0 flex-col overflow-hidden border border-[rgba(255,248,234,0.14)] bg-[#1A030B]/[0.96] text-[#FFF8EA] shadow-[0_28px_76px_rgba(9,7,10,0.38)] backdrop-blur-2xl",
            "inset-x-3 bottom-3 rounded-[30px]",
            "md:inset-auto md:bottom-24 md:right-5 md:h-[min(650px,calc(100vh-8rem))] md:w-[min(430px,calc(100vw-2rem))] md:rounded-[34px]",
          )}
        >
          <header className="border-b border-pearlcream/[0.12] bg-pearlcream/[0.05] p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pearlcream/[0.18] bg-pearlcream/[0.08] text-pearlcream shadow-[0_0_24px_rgba(47,111,115,0.22)]">
                <SparkleIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 min-w-0 break-words text-sm font-bold uppercase tracking-[0.16em] text-pearlcream">
                  SKXNZ AI
                  <span className="ml-2 rounded-full bg-pearlcream/[0.1] px-2 py-0.5 text-[0.56rem] font-bold tracking-[0.16em] text-pearlcream/[0.82]">
                    BETA
                  </span>
                </p>
                <p className="mt-1 line-clamp-1 text-[0.66rem] uppercase tracking-[0.18em] text-pearlcream/[0.58]">
                  Shopping help for SKXNZ only.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={resetChat}
                  className="inline-flex h-8 items-center justify-center rounded-full border border-pearlcream/[0.12] bg-pearlcream/[0.08] px-3 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-pearlcream/[0.72] transition hover:bg-pearlcream/[0.14] hover:text-pearlcream"
                  aria-label="Reset SKXNZ AI Assistant chat"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={closeAssistant}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-pearlcream/[0.12] bg-pearlcream/[0.08] text-lg leading-none text-pearlcream/[0.72] transition hover:bg-pearlcream/[0.14] hover:text-pearlcream"
                  aria-label="Close SKXNZ AI Assistant"
                >
                  ×
                </button>
              </div>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-[#1A030B]/[0.88] p-4"
            aria-live="polite"
          >
            <div className="mb-4">
              <p className="text-xs font-semibold text-pearlcream/[0.72]">Picked for you.</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {assistantPreviewProducts.map((product) => (
                  <AssistantPreviewCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "min-w-0 max-w-full rounded-[22px] px-4 py-3 text-sm leading-6 shadow-[0_14px_30px_rgba(17,17,17,0.18)]",
                    message.role === "user"
                      ? "ml-auto max-w-[82%] border border-pearlcream/[0.18] bg-pearlcream text-sangria"
                      : "mr-auto max-w-full border border-pearlcream/[0.12] bg-pearlcream/[0.08] text-pearlcream",
                  )}
                >
                  <p className="min-w-0 whitespace-pre-wrap break-words">{message.content}</p>

                  {message.followUpQuestion ? (
                    <p className="mt-3 rounded-[18px] border border-pearlcream/[0.14] bg-pearlcream/[0.1] px-3 py-2 text-xs leading-5 text-pearlcream/[0.86]">
                      {message.followUpQuestion}
                    </p>
                  ) : null}

                  {message.suggestedLinks?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestedLinks.map((link) => (
                        <Link
                          key={link.id}
                          href={link.href}
                          className="inline-flex max-w-full items-center gap-1 rounded-full border border-pearlcream/[0.16] bg-pearlcream/[0.1] px-3 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-pearlcream/[0.82] transition hover:bg-pearlcream hover:text-sangria"
                          title={link.helperText}
                        >
                          <span className="truncate">
                            {link.type === "brand" ? "Brand" : "Category"}: {link.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {message.products?.length ? (
                    <div className="mt-4 grid gap-3">
                      {message.products.map((product) => (
                        <ProductRecommendationCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onSave={handleSave}
                          isSaved={isInWishlist(product.id)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {isLoading ? (
                <div className="mr-auto rounded-[22px] border border-pearlcream/[0.12] bg-pearlcream/[0.08] px-4 py-3 text-sm text-pearlcream/[0.72] shadow-[0_14px_30px_rgba(17,17,17,0.18)]">
                  Reading the SKXNZ catalogue...
                </div>
              ) : null}
            </div>
          </div>

          <footer className="border-t border-pearlcream/[0.12] bg-pearlcream/[0.05] p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void submitPrompt(prompt)}
                  disabled={isLoading}
                  className="shrink-0 rounded-full border border-pearlcream/[0.12] bg-pearlcream/[0.08] px-3 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-pearlcream/[0.74] transition hover:bg-pearlcream/[0.14] hover:text-pearlcream disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {notice ? (
              <p className="mb-3 rounded-[18px] border border-pearlcream/[0.12] bg-pearlcream/[0.08] px-3 py-2 text-xs leading-5 text-pearlcream/[0.78]">
                {notice}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="flex min-w-0 items-center gap-2">
              <label htmlFor="skxnz-ai-assistant-input" className="sr-only">
                Ask the SKXNZ AI Assistant
              </label>
              <input
                ref={inputRef}
                id="skxnz-ai-assistant-input"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask anything about style..."
                className="h-11 min-w-0 flex-1 rounded-full border border-pearlcream/[0.12] bg-pearlcream/[0.08] px-4 text-sm text-pearlcream outline-none transition placeholder:text-pearlcream/[0.42] focus:border-pearlcream/[0.26] focus:bg-pearlcream/[0.12] focus:ring-4 focus:ring-pearlcream/[0.06]"
                maxLength={skxnzAssistantLimits.maxMessageLength + 1}
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pearlcream text-sangria shadow-[0_12px_28px_rgba(17,17,17,0.22)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Send message to SKXNZ AI"
              >
                <SendArrowIcon />
              </button>
            </form>
          </footer>
        </section>
      ) : null}

      <button
        type="button"
        aria-label="Open SKXNZ AI Assistant"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={(event) => finishDrag(event, true)}
        onLostPointerCapture={(event) => {
          if (activeDragRef.current?.pointerId === event.pointerId) {
            finishDrag(event, true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleAssistantFromButton();
          }
        }}
        className={cn(
          "fixed z-[121] flex h-16 w-16 touch-none select-none items-center justify-center rounded-full border border-[rgba(255,248,234,0.62)] bg-[#1A030B]/[0.96] text-[#FFF8EA] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_14px_34px_rgba(58,8,24,0.30),0_0_0_5px_rgba(34,211,238,0.18),0_0_30px_rgba(139,92,246,0.30)] backdrop-blur-xl transition hover:border-[#FFF8EA] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_18px_42px_rgba(58,8,24,0.38),0_0_0_7px_rgba(34,211,238,0.22),0_0_38px_rgba(139,92,246,0.36)] focus:outline-none focus:ring-4 focus:ring-[rgba(34,211,238,0.24)]",
          isDragging ? "cursor-grabbing transition-none" : "cursor-grab",
        )}
        style={buttonStyle}
      >
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-pearlcream/[0.14] bg-pearlcream/[0.06]">
          <SparkleIcon className="h-8 w-8" />
          <span className="sr-only">Open SKXNZ AI Assistant</span>
        </span>
      </button>
    </>
  );
}
