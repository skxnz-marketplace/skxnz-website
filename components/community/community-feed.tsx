"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  createDemoCommunityPost,
  getAllCommunityPosts,
  getCommunityTaggedProducts,
  getLikedCommunityPostIds,
  getSavedCommunityPostIds,
  saveDemoCommunityPost,
  submitDemoCommunityReport,
  toggleCommunityLike,
  toggleCommunitySave,
} from "@/lib/data/community";
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
};

const marketplaceUpdates = [
  {
    title: "New marketplace additions",
    description: "Fresh demo catalog drops are being queued for buyer testing.",
  },
  {
    title: "Upcoming drops",
    description: "Limited and New Season edits are prepared as beta previews.",
  },
  {
    title: "Brand updates",
    description: "Seller announcements will appear here after review tools are live.",
  },
  {
    title: "Coming soon",
    description: "Community posting access will connect to order history later.",
  },
];

export function CommunityFeed({
  initialPosts,
  products,
  styleBoards,
  tags,
}: CommunityFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [reportPost, setReportPost] = useState<CommunityPost | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setPosts(getAllCommunityPosts());
    setLikedPostIds(getLikedCommunityPostIds());
    setSavedPostIds(getSavedCommunityPostIds());
  }, []);

  const taggedProductPreview = useMemo(() => {
    const productIdSet = new Set(posts.flatMap((post) => post.taggedProductIds));

    return Array.from(productIdSet)
      .map((productId) => products.find((product) => product.id === productId))
      .filter((product): product is Product => Boolean(product))
      .slice(0, 5);
  }, [posts, products]);

  const handleCreatePost = (draft: CommunityPostDraft) => {
    const post = createDemoCommunityPost(draft);

    saveDemoCommunityPost(post);
    setPosts((currentPosts) => [post, ...currentPosts]);
    setIsCreatePostOpen(false);
    setStatusMessage(
      "Demo post saved locally. Public posting is still locked until moderation is ready.",
    );
  };

  const handleToggleLike = (postId: string) => {
    setLikedPostIds(toggleCommunityLike(postId));
  };

  const handleToggleSave = (postId: string) => {
    setSavedPostIds(toggleCommunitySave(postId));
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
    submitDemoCommunityReport({ postId, reason, note });
    setReportPost(null);
    setStatusMessage("Report submitted for review demo. Admin review is not live yet.");
  };

  const scrollToSignals = () => {
    document.getElementById("signal-tags")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="bg-[var(--skxnz-bg)] pb-14">
      <CommunityHero
        onCreatePost={() => setIsCreatePostOpen(true)}
        onExploreSignals={scrollToSignals}
      />
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
                <p className="text-[0.64rem] font-black uppercase tracking-[0.14em] text-[var(--skxnz-maroon)]">
                  Community chat area
                </p>
                <h2 className="mt-2 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--skxnz-text-dark)]">
                  Post access prepared for repeat buyers.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--skxnz-text-muted)]">
                  Main posting is planned for users with at least 2 completed SKXNZ
                  orders. This MVP shows demo eligibility only.
                </p>
              </div>
              <Badge>Community Beta</Badge>
            </div>
          </section>

          <section className="rounded-[32px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-5 shadow-[0_18px_54px_rgba(58,8,24,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.66rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
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
                <p className="text-[0.66rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
                  Community updates
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--skxnz-text-muted)]">
                  Demo posts, local likes, saves, and report controls.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(true)}
                className="inline-flex min-w-0 items-center justify-center rounded-full border border-[var(--skxnz-border)] bg-[var(--skxnz-maroon)] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--skxnz-text-light)] transition hover:bg-[var(--skxnz-obsidian)]"
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
                    taggedProducts={getCommunityTaggedProducts(post.taggedProductIds)}
                    isLiked={likedPostIds.includes(post.id)}
                    isSaved={savedPostIds.includes(post.id)}
                    onToggleLike={handleToggleLike}
                    onToggleSave={handleToggleSave}
                    onReport={setReportPost}
                  />
                ))}
              </div>
            ) : (
              <CommunityEmptyState onCreatePost={() => setIsCreatePostOpen(true)} />
            )}
          </section>

          <section className="rounded-[32px] border border-[var(--skxnz-border)] bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] p-5 text-[var(--skxnz-text-light)] shadow-[0_24px_70px_rgba(16,0,6,0.18)]">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-glint)]">
              Beta safety note
            </p>
            <p className="mt-3 text-sm leading-7 text-white/[0.76]">
              Signal Community is in beta. Posts, reports, and moderation tools are
              being prepared before public launch. Real public uploads, verified
              creator claims, and admin review outcomes are not live yet.
            </p>
          </section>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-28 lg:self-start">
          <section className="rounded-[28px] bg-[linear-gradient(145deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] p-5 text-[var(--skxnz-text-light)] shadow-[0_20px_56px_rgba(16,0,6,0.18)]">
            <p className="text-[0.64rem] font-black uppercase tracking-[0.14em] text-[var(--skxnz-glint)]">
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
            <p className="text-[0.66rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
              Tagged products
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--skxnz-text-muted)]">
              Quick links from current demo posts into product pages.
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
