"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { guardServerAction } from "@/lib/security/rate-limit/rate-limit";
import { isUuidShape } from "@/lib/saved/saved-items";

type AdminActionResult =
  | { ok: true }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "FORBIDDEN" | "VALIDATION_FAILED" | "NOT_FOUND" | "RATE_LIMITED" | "NOT_WIRED" | "DB_ERROR";
      message: string;
    };

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function notWired(): AdminActionResult {
  return { ok: false, code: "NOT_WIRED", message: "Community moderation is not connected yet." };
}

function dbError(): AdminActionResult {
  return { ok: false, code: "DB_ERROR", message: "That didn't go through. Please try again." };
}

/** Same belt-and-braces pattern as lib/returns/admin-update-return-status.ts:
 * RLS (public.is_admin()) is the real gate, this is a defensive check that
 * fails fast with a clear FORBIDDEN before attempting a write RLS would
 * reject anyway. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, forbidden: false };
  }

  const { data: role, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    return { supabase, user, forbidden: true };
  }

  return { supabase, user, forbidden: role?.role !== "ADMIN" };
}

export async function adminGrantCommunityPoster(userEmail: string): Promise<AdminActionResult> {
  const email = userEmail.trim().toLowerCase();
  if (!email) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Enter a user's email." };
  }

  const { supabase, user, forbidden } = await requireAdmin();
  if (!user) return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in." };
  if (forbidden) return { ok: false, code: "FORBIDDEN", message: "Only administrators can grant posting rights." };

  const limit = await guardServerAction("community.admin", { userId: user.id });
  if (!limit.ok) return limit.error;

  const { data: target, error: targetError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (targetError) return dbError();
  if (!target) {
    return { ok: false, code: "NOT_FOUND", message: "No account found with that email." };
  }

  const { error } = await supabase
    .from("community_poster_grants")
    .upsert({ user_id: target.id, granted_by: user.id }, { onConflict: "user_id" });

  if (error) {
    if (isMissingTableError(error)) return notWired();
    console.warn("[community] grant poster failed:", error.message);
    return dbError();
  }

  revalidatePath("/admin/community");
  return { ok: true };
}

export async function adminRevokeCommunityPoster(userId: string): Promise<AdminActionResult> {
  if (!isUuidShape(userId)) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid user." };
  }

  const { supabase, user, forbidden } = await requireAdmin();
  if (!user) return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in." };
  if (forbidden) return { ok: false, code: "FORBIDDEN", message: "Only administrators can revoke posting rights." };

  const limit = await guardServerAction("community.admin", { userId: user.id });
  if (!limit.ok) return limit.error;

  const { error } = await supabase.from("community_poster_grants").delete().eq("user_id", userId);

  if (error) {
    if (isMissingTableError(error)) return notWired();
    return dbError();
  }

  revalidatePath("/admin/community");
  return { ok: true };
}

export type ModerationAction = "dismiss" | "hide" | "delete";

/** Resolves a report and, for hide/delete, also updates the reported post's
 * moderation status. Two writes, not one RPC — acceptable here (unlike
 * checkout) because there's no money and a partial failure just leaves a
 * report "open" for a retry, not a corrupted commerce state. */
export async function adminResolveCommunityReport(input: {
  reportId: string;
  postId: string;
  action: ModerationAction;
}): Promise<AdminActionResult> {
  if (!isUuidShape(input.reportId) || !isUuidShape(input.postId)) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid report." };
  }

  const { supabase, user, forbidden } = await requireAdmin();
  if (!user) return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in." };
  if (forbidden) return { ok: false, code: "FORBIDDEN", message: "Only administrators can resolve reports." };

  const limit = await guardServerAction("community.admin", { userId: user.id });
  if (!limit.ok) return limit.error;

  const reportStatus = input.action === "dismiss" ? "dismissed" : "resolved";
  const { error: reportError } = await supabase
    .from("community_reports")
    .update({ status: reportStatus, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", input.reportId);

  if (reportError) {
    if (isMissingTableError(reportError)) return notWired();
    return dbError();
  }

  if (input.action !== "dismiss") {
    const postStatus = input.action === "hide" ? "hidden" : "removed";
    const { error: postError } = await supabase
      .from("community_posts")
      .update({ status: postStatus })
      .eq("id", input.postId);

    if (postError) return dbError();
  }

  revalidatePath("/admin/community");
  revalidatePath("/community");
  return { ok: true };
}
