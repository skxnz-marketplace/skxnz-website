"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { CommunityEmptyState } from "@/components/community/community-empty-state";
import { CommunityHero } from "@/components/community/community-hero";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { CreatePostModal } from "@/components/community/create-post-modal";
import { ReportPostModal } from "@/components/community/report-post-modal";
import { StyleBoardPreview } from "@/components/community/style-board-preview";
import { TaggedProductsStrip } from "@/components/community/tagged-products-strip";
import { TrendingSignals } from "@/components/community/trending-signals";
import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { getProductHref } from "@/lib/catalog/product-links";
import {
  createCommunityPost,
  submitCommunityReport,
  toggleCommunityLike,
  toggleCommunitySave,
} from "@/lib/community/community-actions";
import { pickTaggedProducts } from "@/lib/community/format";
import { formatProductPrice, type Product } from "@/lib/data/products";
import type {
  CommunityPost,
  CommunityPostDraft,
  CommunityReportReason,
  StyleBoard,
} from "@/lib/types/community";
import { skxnzFallbackAssets } from "@/src/lib/assets";

type CommunityFeedProps = {
  initialPosts: CommunityPost[];
  products: Product[];
  styleBoards: StyleBoard[];
  tags: string[];
  initialLikedPostIds: string[];
  initialSavedPostIds: string[];
  canPost: boolean;
  isSignedIn: boolean;
};

const marketplaceUpdates = [
  {
    title: "New marketplace additions",
    description: "Fresh catalog drops are queued for buyer testing.",
  },
  {
    title: "Upcoming drops",
    description: "Limited and New Season edits are prepared as beta previews.",
  },
  {
    title: "Brand updates",
    description: "Seller announcements will appear here after review tools are live.",
  },
];

export function CommunityFeed({
  initialPosts,
  products,
  styleBoards,
  tags,
  initialLikedPostIds,
  initialSavedPostIds,
  canPost,
  isSignedIn,
}: CommunityFeedProps) {
  const [posts] = useState(initialPosts);
  const [likedPostIds, setLikedPostIds] = useState(initialLikedPostIds);
  const [savedPostIds, setSavedPostIds] = useState(initialSavedPostIds);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [reportPost, setReportPost] = useState<CommunityPost | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const taggedProductPreview = useMemo(() => {
    const productIdSet = new Set(posts.flatMap((post) => post.taggedProductIds));
    return pickTaggedProducts(products, [...productIdSet]).slice(0, 5);
  }, [posts, products]);

  const handleCreatePost = (draft: CommunityPostDraft) => {
    startTransition(async () => {
      const result = await createCommunityPost(draft);
      if (result.ok) {
        setIsCreatePostOpen(false);
        setStatusMessage(
          "Post submitted for review — it'll appear in the feed once approved.",
        );
      } else {
        setStatusMessage(result.message);
      }
    });
  };

  const handleToggleLike = (postId: string) => {
    const wasLiked = likedPostIds.includes(postId);
    setLikedPostIds((current) =>
      wasLiked ? current.filter((id) => id !== postId) : [...current, postId],
    );
    startTransition(async () => {
      const result = await toggleCommunityLike(postId);
      if (!result.ok) {
        // Roll back on failure (e.g. signed out) so the UI never lies.
        setLikedPostIds((current) =>
          wasLiked ? [...current, postId] : current.filter((id) => id !== postId),
        );
        setStatusMessage(result.message);
      }
    });
  };

  const handleToggleSave = (postId: string) => {
    const wasSaved = savedPostIds.includes(postId);
    setSavedPostIds((current) =>
      wasSaved ? current.filter((id) => id !== postId) : [...current, postId],
    );
    startTransition(async () => {
      const result = await toggleCommunitySave(postId);
      if (!result.ok) {
        setSavedPostIds((current) =>
          wasSaved ? [...current, postId] : current.filter((id) => id !== postId),
        );
        setStatusMessage(result.message);
      }
    });
  };

  const handleReportPost = ({
    postId,
    reason,
    note,
  }: {
    postId: string;
    reason: CommunityReportReason;
    note: string;
  }) => {
    startTransition(async () => {
      const result = await submitCommunityReport({ postId, reason, note });
      setReportPost(null);
      setStatusMessage(
        result.ok ? "Report submitted — our team will review it." : result.message,
      );
    });
  };

  const scrollToSignals = () => {
    document.getElementById("signal-tags")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openCreatePost = () => {
    if (!isSignedIn) {
      setStatusMessage("Sign in to post to the community.");
      return;
    }
    if (!canPost) {
      setStatusMessage("Posting is invite-only right now. Ask an admin for access.");
      return;
    }
    setIsCreatePostOpen(true);
  };

  return (
    <div className="bg-[var(--skxnz-bg)] pb-14">
      <CommunityHero onCreatePost={openCreatePost} onExploreSignals={scrollToSignals} />
      <TrendingSignals tags={tags} />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
        <div className="min-w-0 space-y-6">
          {statusMessage ? (
            <div className="rounded-[22px] border border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.08)] px-4 py-3 text-sm leading-6 text-[var(--skxnz-maroon)]">
              {statusMessage}
            </div>
          ) : null}

          <section className="rounded-[28px] bg-[var(--skxnz-surface)] p-5 shadow-[0_14px_40px_rgba(58,8,24,0.055)] ring-1 ring-[rgba(58,8,24,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.78rem] font-black uppercase tracking-[0.14em] text-[var(--skxnz-maroon)]">
                  Community chat area
                </p>
                <h2 className="mt-2 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--skxnz-text-dark)]">
                  Posting is invite-only during beta.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--skxnz-text-muted)]">
                  Everyone can browse, like, and save. Posting opens to more
                  buyers as moderation scales.
                </p>
              </div>
              <Badge>Community Beta</Badge>
            </div>
          </section>

          <section className="rounded-[32px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-5 shadow-[0_18px_54px_rgba(58,8,24,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.78rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
                  Product-tagged looks
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--skxnz-text-muted)]">
                  Posts tag SKXNZ catalog products only.
                </p>
              </div>
              <Badge>{taggedProductPreview.length} products</Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {taggedProductPreview.map((product) => (
                <Link
                  key={product.id}
                  href={getProductHref(product)}
                  className="group min-w-0 overflow-hidden rounded-[24px] border border-[var(--skxnz-border)] bg-[var(--skxnz-card)] p-3 transition hover:border-[rgba(34,211,238,0.4)]"
                >
                  <div className="relative min-h-32 overflow-hidden rounded-[18px] bg-[var(--skxnz-bg-soft)]">
                    <SafeImage
                      src={product.image}
                      fallbackSrc={skxnzFallbackAssets.product}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 220px"
                      className="object-cover object-center transition group-hover:scale-[1.04]"
                    />
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs font-black uppercase tracking-[0.13em] text-[var(--skxnz-text-dark)]">
                    {product.name}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--skxnz-text-muted)]">
                    {formatProductPrice(product.salePrice ?? product.price)}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.78rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
                  Community feed
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--skxnz-text-muted)]">
                  Real posts, likes, saves, and reports.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreatePost}
                disabled={isPending}
                className="inline-flex min-w-0 items-center justify-center rounded-full border border-[var(--skxnz-border)] bg-[var(--skxnz-maroon)] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--skxnz-text-light)] transition hover:bg-[var(--skxnz-obsidian)] disabled:opacity-60"
              >
                Create Post
              </button>
            </div>

            {posts.length > 0 ? (
              <div className="grid gap-5 xl:grid-cols-2">
                {posts.map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    taggedProducts={pickTaggedProducts(products, post.taggedProductIds)}
                    isLiked={likedPostIds.includes(post.id)}
                    isSaved={savedPostIds.includes(post.id)}
                    onToggleLike={handleToggleLike}
                    onToggleSave={handleToggleSave}
                    onReport={setReportPost}
                  />
                ))}
              </div>
            ) : (
              <CommunityEmptyState onCreatePost={openCreatePost} />
            )}
          </section>

          <section className="rounded-[32px] border border-[var(--skxnz-border)] bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] p-5 text-[var(--skxnz-text-light)] shadow-[0_24px_70px_rgba(16,0,6,0.18)]">
            <p className="text-[0.78rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-glint)]">
              Beta safety note
            </p>
            <p className="mt-3 text-sm leading-7 text-white/[0.76]">
              Signal Community is in beta. Posting is invite-only, every post is
              reviewed before it&apos;s public, and reports go to real moderation.
              Photo upload isn&apos;t live yet — posts tag existing SKXNZ catalog
              products.
            </p>
          </section>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-28 lg:self-start">
          <section className="rounded-[28px] bg-[linear-gradient(145deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] p-5 text-[var(--skxnz-text-light)] shadow-[0_20px_56px_rgba(16,0,6,0.18)]">
            <p className="text-[0.78rem] font-black uppercase tracking-[0.14em] text-[var(--skxnz-glint)]">
              Marketplace updates hub
            </p>
            <div className="mt-4 grid gap-3">
              {marketplaceUpdates.map((update) => (
                <div
                  key={update.title}
                  className="rounded-[16px] bg-white/[0.07] p-3 ring-1 ring-white/[0.08]"
                >
                  <p className="text-xs font-black uppercase tracking-[0.08em]">
                    {update.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/[0.68]">
                    {update.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <StyleBoardPreview boards={styleBoards} />

          <section className="rounded-[28px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-5 shadow-[0_18px_54px_rgba(58,8,24,0.06)]">
            <p className="text-[0.78rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
              Tagged products
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--skxnz-text-muted)]">
              Quick links from current posts into product pages.
            </p>
            <div className="mt-4">
              <TaggedProductsStrip products={taggedProductPreview.slice(0, 4)} compact />
            </div>
          </section>
        </aside>
      </section>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        products={products}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmit={handleCreatePost}
      />
      <ReportPostModal
        post={reportPost}
        onClose={() => setReportPost(null)}
        onSubmit={handleReportPost}
      />
    </div>
  );
}
