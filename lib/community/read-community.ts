// SERVER ONLY — real reads behind the SKXNZ Community feature, replacing
// the browser-localStorage demo in lib/data/community.ts. RLS
// (supabase/migrations/0017_community_layer.sql) is the real access
// boundary; every filter here is defensive, not the source of truth.

import { createClient } from "@/lib/supabase/server";
import { listActiveProducts, unwrapCatalog } from "@/lib/catalog/public-catalog";
import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import { fallbackProductImage, type Product } from "@/lib/data/products";
import { avatarInitialsFromName, relativeTimeLabel } from "@/lib/community/format";
import type { CommunityPost, StyleBoard } from "@/lib/types/community";
import { skxnzFallbackAssets } from "@/src/lib/assets";

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

type CommunityPostRow = {
  id: string;
  author_display_name: string;
  caption: string;
  style_tags: string[];
  tagged_product_ids: string[];
  status: string;
  created_at: string;
};

function mapPostRow(row: CommunityPostRow, productsById: Map<string, Product>): CommunityPost {
  const taggedProducts = row.tagged_product_ids
    .map((id) => productsById.get(id))
    .filter((product): product is Product => Boolean(product));
  const image = taggedProducts[0]?.image || fallbackProductImage;

  return {
    id: row.id,
    username: row.author_display_name,
    avatarInitials: avatarInitialsFromName(row.author_display_name),
    timeLabel: relativeTimeLabel(row.created_at),
    image,
    caption: row.caption,
    styleTags: row.style_tags,
    taggedProductIds: row.tagged_product_ids,
    // The DB only ever has one real visibility for a reader: it's a row
    // they're allowed to see. "Public Beta" matches the existing frontend
    // union without inventing a new one.
    visibility: "Public Beta",
    status:
      row.status === "published"
        ? "Published"
        : row.status === "pending_moderation"
          ? "Pending Moderation"
          : "Demo Post",
    createdAt: row.created_at,
  };
}

/** Active catalog products, mapped to the shared buyer Product shape used
 * throughout the site (real Supabase uuid ids — required since
 * community_posts.tagged_product_ids is a uuid[] column). */
export async function getCommunityCatalogProducts(): Promise<Product[]> {
  // Canonical public read; a catalogue error throws rather than showing posts
  // with their tagged products silently missing.
  return unwrapCatalog(await listActiveProducts()).map(mapCatalogProductToBuyerProduct);
}

export type CommunityPageData = {
  backendReady: boolean;
  posts: CommunityPost[];
  products: Product[];
  styleBoards: StyleBoard[];
  likedPostIds: string[];
  savedPostIds: string[];
  /** True iff the signed-in user holds a community_poster_grants row. */
  canPost: boolean;
  isSignedIn: boolean;
};

/** Everything app/community/page.tsx needs in one pass. Public data (posts,
 * products, style boards) loads even for signed-out visitors; per-user data
 * (likes/saves/canPost) is empty when signed out. */
export async function getCommunityPageData(): Promise<CommunityPageData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const products = await getCommunityCatalogProducts();
  const productsById = new Map(products.map((product) => [product.id, product]));

  const [postsResult, styleBoardsResult] = await Promise.all([
    supabase
      .from("community_posts")
      .select("id, author_display_name, caption, style_tags, tagged_product_ids, status, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("style_boards")
      .select("id, slug, title, description, image_url, tags, product_ids")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (isMissingTableError(postsResult.error)) {
    return {
      backendReady: false,
      posts: [],
      products,
      styleBoards: [],
      likedPostIds: [],
      savedPostIds: [],
      canPost: false,
      isSignedIn: Boolean(user),
    };
  }

  if (postsResult.error) {
    console.warn("[community] posts read failed:", postsResult.error.message);
  }
  if (styleBoardsResult.error && !isMissingTableError(styleBoardsResult.error)) {
    console.warn("[community] style boards read failed:", styleBoardsResult.error.message);
  }

  const posts = ((postsResult.data ?? []) as CommunityPostRow[]).map((row) =>
    mapPostRow(row, productsById),
  );

  const styleBoards: StyleBoard[] = (styleBoardsResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    image: row.image_url ?? skxnzFallbackAssets.product,
    tags: row.tags ?? [],
    productIds: row.product_ids ?? [],
  }));

  if (!user) {
    return {
      backendReady: true,
      posts,
      products,
      styleBoards,
      likedPostIds: [],
      savedPostIds: [],
      canPost: false,
      isSignedIn: false,
    };
  }

  const [likesResult, savesResult, grantResult] = await Promise.all([
    supabase.from("community_likes").select("post_id").eq("user_id", user.id),
    supabase.from("community_saves").select("post_id").eq("user_id", user.id),
    supabase.from("community_poster_grants").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  return {
    backendReady: true,
    posts,
    products,
    styleBoards,
    likedPostIds: (likesResult.data ?? []).map((row) => row.post_id as string),
    savedPostIds: (savesResult.data ?? []).map((row) => row.post_id as string),
    canPost: Boolean(grantResult.data),
    isSignedIn: true,
  };
}
