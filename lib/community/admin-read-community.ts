// SERVER ONLY — admin moderation reads. RLS's "admin can select all"
// policies on community_reports/community_posts/community_poster_grants
// (0017) are the real gate; this file does no additional filtering beyond
// what those policies already allow.

import { createClient } from "@/lib/supabase/server";

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

export type AdminCommunityReport = {
  id: string;
  postId: string;
  postAuthor: string;
  postCaption: string;
  postStatus: string;
  reason: string;
  note: string;
  status: string;
  createdAt: string;
};

export type AdminCommunityReportsResult =
  | { backendReady: true; reports: AdminCommunityReport[] }
  | { backendReady: false; reports: [] };

export async function getCommunityReportsForModeration(): Promise<AdminCommunityReportsResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_reports")
    .select(
      "id, post_id, reason, note, status, created_at, community_posts(author_display_name, caption, status)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingTableError(error)) {
      return { backendReady: false, reports: [] };
    }
    console.warn("[community] admin reports read failed:", error.message);
    return { backendReady: true, reports: [] };
  }

  type Row = {
    id: string;
    post_id: string;
    reason: string;
    note: string;
    status: string;
    created_at: string;
    community_posts: { author_display_name: string; caption: string; status: string } | null;
  };

  return {
    backendReady: true,
    reports: (data as unknown as Row[]).map((row) => ({
      id: row.id,
      postId: row.post_id,
      postAuthor: row.community_posts?.author_display_name ?? "Unknown",
      postCaption: row.community_posts?.caption ?? "",
      postStatus: row.community_posts?.status ?? "removed",
      reason: row.reason,
      note: row.note,
      status: row.status,
      createdAt: row.created_at,
    })),
  };
}

export type CommunityPosterGrant = {
  userId: string;
  email: string;
  name: string;
  grantedAt: string;
};

/** Current invite-only posters, for the admin grant/revoke UI. */
export async function getCommunityPosterGrants(): Promise<CommunityPosterGrant[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_poster_grants")
    .select("user_id, granted_at, users(email, name)")
    .order("granted_at", { ascending: false });

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[community] poster grants read failed:", error.message);
    }
    return [];
  }

  type Row = {
    user_id: string;
    granted_at: string;
    users: { email: string; name: string } | null;
  };

  return (data as unknown as Row[]).map((row) => ({
    userId: row.user_id,
    email: row.users?.email ?? "unknown",
    name: row.users?.name ?? "",
    grantedAt: row.granted_at,
  }));
}
