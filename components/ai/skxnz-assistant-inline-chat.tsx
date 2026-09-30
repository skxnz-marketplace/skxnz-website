"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { SafeImage } from "@/components/shared/safe-image";
import { cn } from "@/lib/cn";
import { getDemoUserProfile } from "@/lib/data/user";
import { skxnzFallbackAssets } from "@/src/lib/assets";
import {
  skxnzAssistantLimits,
  type SkxnzAssistantProductRecommendation,
  type SkxnzAssistantResponse,
  type SkxnzAssistantSuggestedLink,
} from "@/src/lib/skxnzAssistant";

type AssistantMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  products?: SkxnzAssistantProductRecommendation[];
  suggestedLinks?: SkxnzAssistantSuggestedLink[];
  followUpQuestion?: string;
};

const starterPrompts = [
  "Style me for a night out",
  "Find something under ₹3,000",
  "Show streetwear picks",
  "What pairs with a chrome hoodie?",
];

const openingMessage: AssistantMessage = {
  id: "assistant-welcome",
  role: "assistant",
  content:
    "Ask me for a product, an outfit, a budget, or a styling brief — I'll keep it inside SKXNZ.",
};

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

function InlineProductCard({ product }: { product: SkxnzAssistantProductRecommendation }) {
  return (
    <Link
      href={product.href}
      className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/[0.06] p-2 transition hover:bg-white/[0.12]"
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
        <SafeImage
          src={product.image}
          fallbackSrc={skxnzFallbackAssets.product}
          alt={product.name}
          fill
          sizes="56px"
          className="object-cover object-center"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8rem] font-semibold text-pearlcream">
          {product.name}
        </span>
        <span className="block text-[0.78rem] text-pearlcream/70">{product.formattedPrice}</span>
      </span>
    </Link>
  );
}

export function SkxnzAssistantInlineChat({ className }: { className?: string }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([openingMessage]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const canSend =
    inputValue.trim().length > 0 &&
    inputValue.trim().length <= skxnzAssistantLimits.maxMessageLength &&
    !isLoading;

  const submitPrompt = async (message: string) => {
    const trimmed = message.trim().replace(/\s+/g, " ");

    if (!trimmed) {
      setNotice("Type a SKXNZ shopping question first.");
      return;
    }

    if (trimmed.length > skxnzAssistantLimits.maxMessageLength) {
      setNotice(`Keep messages under ${skxnzAssistantLimits.maxMessageLength} characters.`);
      return;
    }

    setNotice("");
    setInputValue("");
    setIsLoading(true);
    setMessages((current) => [
      ...current,
      { id: createMessageId("user"), role: "user", content: trimmed },
    ]);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          context: {
            cartProductIds: [],
            wishlistProductIds: [],
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

      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content:
            payload.reply ??
            "I can only help with SKXNZ shopping, styling, products, orders, and marketplace support.",
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
          content: "The SKXNZ assistant could not respond right now. Try again in a moment.",
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
    }
  };

  return (
    // SKXNZ: no card, no border — a thin glass wash whose edges are masked
    // out to a soft radial fade, plus a faint noise layer matching the
    // Prism's own grain, so the whole thing dissolves into the scene instead
    // of reading as a box sitting on top of it.
    <div
      className={cn("relative flex w-full flex-col overflow-hidden", className)}
      style={{
        // Near-transparent glass, not a tinted panel.
        background: "rgba(255,255,255,0.035)",
        backdropFilter: "blur(34px) saturate(120%)",
        WebkitBackdropFilter: "blur(34px) saturate(120%)",
        // Glossy edge catch-light, not a flat/matte fill.
        boxShadow:
          "0 25px 80px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 40px rgba(255,255,255,0.05)",
        // RECTANGULAR fade, not a radial blob: two straight-edge gradients
        // (one per axis), intersected. A radial-gradient ellipse always
        // draws an oval regardless of the box's own shape — this instead
        // fades each of the four straight edges in place, so the panel
        // stays rectangular and only its border dissolves. Each gradient
        // reaches full opacity by ~9%, comfortably past the inner padding
        // where actual text sits, then holds solid until it starts fading
        // out again near the opposite edge.
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 3%, rgba(0,0,0,0.9) 6%, #000 9%, #000 91%, rgba(0,0,0,0.9) 94%, rgba(0,0,0,0.55) 97%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 4%, rgba(0,0,0,0.9) 8%, #000 12%, #000 88%, rgba(0,0,0,0.9) 92%, rgba(0,0,0,0.55) 96%, transparent 100%)",
        maskImage:
          "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 3%, rgba(0,0,0,0.9) 6%, #000 9%, #000 91%, rgba(0,0,0,0.9) 94%, rgba(0,0,0,0.55) 97%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 4%, rgba(0,0,0,0.9) 8%, #000 12%, #000 88%, rgba(0,0,0,0.9) 92%, rgba(0,0,0,0.55) 96%, transparent 100%)",
        WebkitMaskComposite: "source-in",
        maskComposite: "intersect",
      }}
    >
      {/* Diagonal gloss sheen — the thing that makes this read as glass, not a flat tinted panel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(122deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 22%, transparent 40%, transparent 72%, rgba(255,255,255,0.07) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "140px 140px",
        }}
      />

      <div
        ref={scrollRef}
        className="no-scrollbar max-h-[30vh] min-h-[110px] flex-1 overflow-y-auto px-5 pt-5 sm:px-7"
        aria-live="polite"
      >
        <div className="grid gap-2.5 pb-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "min-w-0 max-w-full rounded-2xl px-3.5 py-2 text-[0.86rem] leading-6 backdrop-blur-md",
                message.role === "user"
                  ? "ml-auto max-w-[80%] bg-pearlcream/90 text-sangria"
                  : "mr-auto max-w-full bg-white/[0.07] text-pearlcream",
              )}
            >
              <p className="min-w-0 whitespace-pre-wrap break-words">{message.content}</p>

              {message.followUpQuestion ? (
                <p className="mt-2 text-[0.8rem] leading-5 text-pearlcream/70">
                  {message.followUpQuestion}
                </p>
              ) : null}

              {message.suggestedLinks?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestedLinks.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      className="inline-flex max-w-full items-center gap-1 rounded-full bg-white/[0.1] px-3 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-pearlcream/80 transition hover:bg-pearlcream hover:text-sangria"
                      title={link.helperText}
                    >
                      <span className="truncate">{link.label}</span>
                    </Link>
                  ))}
                </div>
              ) : null}

              {message.products?.length ? (
                <div className="mt-3 grid gap-2">
                  {message.products.slice(0, 3).map((product) => (
                    <InlineProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {isLoading ? (
            <div className="mr-auto rounded-2xl bg-white/[0.07] px-3.5 py-2 text-[0.82rem] text-pearlcream/70 backdrop-blur-md">
              Thinking…
            </div>
          ) : null}
        </div>
      </div>

      {messages.length <= 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-2 pt-1 sm:px-7">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void submitPrompt(prompt)}
              disabled={isLoading}
              className="shrink-0 rounded-full bg-white/[0.05] px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-pearlcream/75 backdrop-blur-md transition hover:bg-white/[0.12] disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      {notice ? (
        <p className="px-5 pb-1 text-[0.76rem] text-pearlcream/70 sm:px-7">{notice}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 pb-4 pt-2 sm:px-5">
        <label htmlFor="skxnz-ai-inline-input" className="sr-only">
          Ask the SKXNZ AI Assistant
        </label>
        <input
          id="skxnz-ai-inline-input"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Ask anything about style…"
          className="h-11 min-w-0 flex-1 rounded-full bg-white/[0.06] px-4 text-sm text-pearlcream outline-none backdrop-blur-md placeholder:text-pearlcream/40 focus:bg-white/[0.12]"
          maxLength={skxnzAssistantLimits.maxMessageLength + 1}
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pearlcream text-sangria transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message to SKXNZ AI"
        >
          <SendArrowIcon />
        </button>
      </form>
    </div>
  );
}
