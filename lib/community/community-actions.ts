"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { guardServerAction } from "@/lib/security/rate-limit/rate-limit";
import { isUuidShape } from "@/lib/saved/saved-items";
import type { CommunityPostDraft, CommunityReportReason } from "@/lib/types/community";

const MAX_CAPTION_LENGTH = 220;
const MIN_CAPTION_LENGTH = 12;
const MAX_STYLE_TAGS = 8;
const MAX_TAGGED_PRODUCTS = 4;
const MAX_REPORT_NOTE_LENGTH = 500;

// Runtime shape validation at the server-action boundary. Server Actions are
// callable network endpoints (a POST to an action id) — the TypeScript param
// type is compile-time only and enforces nothing against a raw/adversarial
// payload. Matches CLAUDE.md's "Validate all input (zod)" hard rule.
const REPORT_REASONS = [
  "Spam",
  "Inappropriate content",
  "Fake product claim",
  "Harassment",
  "Copyright concern",
  "Other",
] as const satisfies readonly CommunityReportReason[];

const createPostSchema = z.object({
  caption: z.string(),
  styleTags: z.array(z.string()).max(64), // generous pre-filter cap; MAX_STYLE_TAGS trims after
  taggedProductIds: z.array(z.string()).max(64),
});

const submitReportSchema = z.object({
  postId: z.string(),
  reason: z.enum(REPORT_REASONS),
  note: z.string(),
});

type ActionResult =
  | { ok: true }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "NOT_ELIGIBLE" | "VALIDATION_FAILED" | "RATE_LIMITED" | "NOT_WIRED" | "DB_ERROR";
      message: string;
    };

function schemaError(): ActionResult {
  return { ok: false, code: "VALIDATION_FAILED", message: "That request wasn't in the right shape." };
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function notWired(): ActionResult {
  return {
    ok: false,
    code: "NOT_WIRED",
    message: "Community is not connected yet. The community database migration has not been applied.",
  };
}

function dbError(): ActionResult {
  return { ok: false, code: "DB_ERROR", message: "That didn't go through. Please try again." };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

export async function createCommunityPost(draft: CommunityPostDraft): Promise<ActionResult> {
  const parsed = createPostSchema.safeParse(draft);
  if (!parsed.success) return schemaError();

  const caption = parsed.data.caption.trim();
  if (caption.length < MIN_CAPTION_LENGTH || caption.length > MAX_CAPTION_LENGTH) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: `Caption must be between ${MIN_CAPTION_LENGTH} and ${MAX_CAPTION_LENGTH} characters.`,
    };
  }

  const taggedProductIds = [...new Set(parsed.data.taggedProductIds)].filter(isUuidShape).slice(0, MAX_TAGGED_PRODUCTS);
  if (taggedProductIds.length === 0) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Tag at least one SKXNZ product." };
  }

  const styleTags = [...new Set(parsed.data.styleTags)]
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && tag.length <= 40)
    .slice(0, MAX_STYLE_TAGS);

  const { supabase, user } = await requireUser();
  if (!user) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to post." };
  }

  const limit = await guardServerAction("community.post", { userId: user.id });
  if (!limit.ok) return limit.error;

  // author_display_name is a snapshot the author sets from their OWN
  // public.users row (which they can always read — see 0017's comment on
  // why this can't be a read-time join). Never client-supplied.
  const { data: ownProfile, error: ownProfileError } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  if (ownProfileError && !isMissingTableError(ownProfileError)) {
    return dbError();
  }

  const authorDisplayName = ownProfile?.name?.trim() || "SKXNZ member";

  const { error } = await supabase.from("community_posts").insert({
    user_id: user.id,
    author_display_name: authorDisplayName,
    caption,
    style_tags: styleTags,
    tagged_product_ids: taggedProductIds,
    // status is also server-forced by the DB trigger regardless of this —
    // omitted here so the DB default/trigger is the single source of truth.
  });

  if (error) {
    if (isMissingTableError(error)) return notWired();
    if (error.code === "42501") {
      // RLS denied the insert — most likely no community_poster_grants row.
      return {
        ok: false,
        code: "NOT_ELIGIBLE",
        message: "Posting is invite-only right now. Ask an admin for access.",
      };
    }
    console.warn("[community] create post failed:", error.message);
    return dbError();
  }

  revalidatePath("/community");
  revalidatePath("/admin/community");
  return { ok: true };
}

async function toggleEngagement(
  table: "community_likes" | "community_saves",
  postId: string,
): Promise<ActionResult> {
  if (!isUuidShape(postId)) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid post." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in." };
  }

  const limit = await guardServerAction("community.engage", { userId: user.id });
  if (!limit.ok) return limit.error;

  const { data: existing, error: readError } = await supabase
    .from(table)
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) {
    if (isMissingTableError(readError)) return notWired();
    return dbError();
  }

  if (existing) {
    const { error } = await supabase.from(table).delete().eq("id", existing.id);
    if (error) return dbError();
  } else {
    const { error } = await supabase.from(table).insert({ post_id: postId, user_id: user.id });
    if (error) {
      if (isMissingTableError(error)) return notWired();
      // RLS denies liking/saving a non-published post — a truthful no-op,
      // not a server error.
      if (error.code === "42501") {
        return { ok: false, code: "VALIDATION_FAILED", message: "This post isn't available." };
      }
      return dbError();
    }
  }

  revalidatePath("/community");
  return { ok: true };
}

export async function toggleCommunityLike(postId: string): Promise<ActionResult> {
  return toggleEngagement("community_likes", postId);
}

export async function toggleCommunitySave(postId: string): Promise<ActionResult> {
  return toggleEngagement("community_saves", postId);
}

export async function submitCommunityReport(input: {
  postId: string;
  reason: CommunityReportReason;
  note: string;
}): Promise<ActionResult> {
  const parsed = submitReportSchema.safeParse(input);
  if (!parsed.success) return schemaError();
  if (!isUuidShape(parsed.data.postId)) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid post." };
  }

  const note = parsed.data.note.trim().slice(0, MAX_REPORT_NOTE_LENGTH);

  const { supabase, user } = await requireUser();
  if (!user) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to report a post." };
  }

  const limit = await guardServerAction("community.report", { userId: user.id });
  if (!limit.ok) return limit.error;

  const { error } = await supabase.from("community_reports").insert({
    post_id: parsed.data.postId,
    reporter_id: user.id,
    reason: parsed.data.reason,
    note,
  });

  if (error) {
    if (isMissingTableError(error)) return notWired();
    console.warn("[community] report failed:", error.message);
    return dbError();
  }

  revalidatePath("/admin/community");
  return { ok: true };
}
