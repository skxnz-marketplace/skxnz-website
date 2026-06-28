import { products } from "@/lib/data/products";
import type {
  CommunityPost,
  CommunityPostDraft,
  CommunityReport,
  CommunityReportReason,
} from "@/lib/types/community";
import {
  demoStyleBoards,
  seedCommunityPosts,
  trendingSignalTags,
} from "@/src/data/skxnz-community-posts";
import { skxnzFallbackAssets } from "@/src/lib/assets";

export const communityPostsStorageKey = "skxnz-signal-community-posts";
export const communityLikesStorageKey = "skxnz-signal-community-likes";
export const communitySavesStorageKey = "skxnz-signal-community-saves";
export const communityReportsStorageKey = "skxnz-signal-community-reports";

export { demoStyleBoards, seedCommunityPosts, trendingSignalTags };

export const communityReportReasons: CommunityReportReason[] = [
  "Spam",
  "Inappropriate content",
  "Fake product claim",
  "Harassment",
  "Copyright concern",
  "Other",
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJsonFromStorage<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeJsonToStorage<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function getStoredIds(key: string) {
  return readJsonFromStorage<string[]>(key, []);
}

function writeStoredIds(key: string, ids: string[]) {
  writeJsonToStorage(key, Array.from(new Set(ids)));
}

export function getCommunityProducts() {
  return products;
}

export function getCommunityProduct(productId: string) {
  return products.find(
    (product) => product.id === productId || product.slug === productId,
  );
}

export function getCommunityTaggedProducts(productIds: string[]) {
  return productIds
    .map((productId) => getCommunityProduct(productId))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
}

export function getStoredCommunityPosts() {
  return readJsonFromStorage<CommunityPost[]>(communityPostsStorageKey, []);
}

export function getAllCommunityPosts() {
  return [...getStoredCommunityPosts(), ...seedCommunityPosts];
}

export function createDemoCommunityPost(draft: CommunityPostDraft): CommunityPost {
  const createdAt = new Date().toISOString();
  const firstTaggedProduct = getCommunityProduct(draft.taggedProductIds[0] ?? "");
  const image = firstTaggedProduct?.image ?? skxnzFallbackAssets.product;

  return {
    id: `signal-post-local-${Date.now()}`,
    username: "demo.signal",
    avatarInitials: "DS",
    timeLabel: "Demo, just now",
    image,
    caption: draft.caption.trim(),
    styleTags: draft.styleTags,
    taggedProductIds: draft.taggedProductIds,
    visibility: draft.visibility,
    status: draft.visibility === "Private Draft" ? "Beta Draft" : "Pending Moderation",
    createdAt,
  };
}

export function saveDemoCommunityPost(post: CommunityPost) {
  const existingPosts = getStoredCommunityPosts();
  writeJsonToStorage(communityPostsStorageKey, [post, ...existingPosts]);
}

export function getLikedCommunityPostIds() {
  return getStoredIds(communityLikesStorageKey);
}

export function getSavedCommunityPostIds() {
  return getStoredIds(communitySavesStorageKey);
}

export function toggleCommunityLike(postId: string) {
  const currentIds = getLikedCommunityPostIds();
  const nextIds = currentIds.includes(postId)
    ? currentIds.filter((id) => id !== postId)
    : [...currentIds, postId];

  writeStoredIds(communityLikesStorageKey, nextIds);

  return nextIds;
}

export function toggleCommunitySave(postId: string) {
  const currentIds = getSavedCommunityPostIds();
  const nextIds = currentIds.includes(postId)
    ? currentIds.filter((id) => id !== postId)
    : [...currentIds, postId];

  writeStoredIds(communitySavesStorageKey, nextIds);

  return nextIds;
}

export function getCommunityReports() {
  return readJsonFromStorage<CommunityReport[]>(communityReportsStorageKey, []);
}

export function submitDemoCommunityReport({
  postId,
  reason,
  note,
}: {
  postId: string;
  reason: CommunityReportReason;
  note: string;
}) {
  const report: CommunityReport = {
    id: `signal-report-local-${Date.now()}`,
    postId,
    reason,
    note: note.trim(),
    status: "Demo submitted",
    createdAt: new Date().toISOString(),
  };
  const existingReports = getCommunityReports();

  writeJsonToStorage(communityReportsStorageKey, [report, ...existingReports]);

  return report;
}
