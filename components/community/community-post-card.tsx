"use client";

import Link from "next/link";

import { TaggedProductsStrip } from "@/components/community/tagged-products-strip";
import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/data/products";
import type { CommunityPost } from "@/lib/types/community";
import { skxnzFallbackAssets } from "@/src/lib/assets";

type CommunityPostCardProps = {
  post: CommunityPost;
  taggedProducts: Product[];
  isLiked: boolean;
  isSaved: boolean;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onReport: (post: CommunityPost) => void;
};

export function CommunityPostCard({
  post,
  taggedProducts,
  isLiked,
  isSaved,
  onToggleLike,
  onToggleSave,
  onReport,
}: CommunityPostCardProps) {
  const primaryProduct = taggedProducts[0];

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[32px] border border-[var(--skxnz-border)] bg-[var(--skxnz-card)] shadow-[0_18px_54px_rgba(58,8,24,0.07)]">
      <div className="flex min-w-0 items-center gap-3 border-b border-[var(--skxnz-border)] p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(34,211,238,0.24)] bg-[linear-gradient(135deg,var(--skxnz-maroon),var(--skxnz-obsidian))] text-xs font-black uppercase tracking-[0.16em] text-[var(--skxnz-text-light)]">
          {post.avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-black uppercase tracking-[0.16em] text-[var(--skxnz-text-dark)]">
            {post.username}
          </p>
          <p className="mt-1 line-clamp-1 text-xs text-[var(--skxnz-text-muted)]">
            {post.timeLabel}
          </p>
        </div>
        <Badge>{post.status}</Badge>
      </div>

      <div className="relative min-h-[18rem] overflow-hidden bg-[var(--skxnz-bg-soft)]">
        <SafeImage
          src={post.image}
          fallbackSrc={skxnzFallbackAssets.product}
          alt={`${post.username} Signal Community demo post`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(16,0,6,0.70)_100%)]" />
        {primaryProduct ? (
          <Link
            href={`/product/${primaryProduct.id}`}
            className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-full border border-white/18 bg-white/[0.14] px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.16em] text-white backdrop-blur transition hover:border-[rgba(34,211,238,0.45)]"
          >
            Tagged: {primaryProduct.name}
          </Link>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
        <p className="line-clamp-4 text-sm leading-7 text-[var(--skxnz-text-dark)]">
          {post.caption}
        </p>

        <div className="flex flex-wrap gap-2">
          {post.styleTags.map((tag) => (
            <Link
              key={`${post.id}-${tag}`}
              href={`/shop?q=${encodeURIComponent(tag.replace("#", ""))}`}
              className="rounded-full border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[var(--skxnz-maroon)] transition hover:border-[rgba(34,211,238,0.42)]"
            >
              {tag}
            </Link>
          ))}
        </div>

        <TaggedProductsStrip products={taggedProducts} compact />

        <div className="mt-auto grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            type="button"
            variant={isLiked ? "primary" : "secondary"}
            size="sm"
            onClick={() => onToggleLike(post.id)}
          >
            {isLiked ? "Liked" : "Like"}
          </Button>
          <Button
            type="button"
            variant={isSaved ? "primary" : "secondary"}
            size="sm"
            onClick={() => onToggleSave(post.id)}
          >
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled>
            Comment Demo
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onReport(post)}>
            Report
          </Button>
        </div>

        <p className="text-[0.68rem] leading-5 text-[var(--skxnz-text-muted)]">
          Share and comment actions are demo placeholders until community
          moderation and account persistence are connected.
        </p>
      </div>
    </article>
  );
}
