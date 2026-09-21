import type { CommunityReportReason } from "@/lib/types/community";
import {
  demoStyleBoards,
  seedCommunityPosts,
  trendingSignalTags,
} from "@/src/data/skxnz-community-posts";

// The real community feed/actions live in lib/community/* (Supabase-backed,
// see supabase/migrations/0017_community_layer.sql). What's left here is:
// - re-exports still used elsewhere (seedCommunityPosts by the unrelated
//   admin-overview demo stats widget, trendingSignalTags/demoStyleBoards as
//   general reference data), and
// - communityReportReasons, the display-string list ReportPostModal renders
//   (kept in sync with the DB check constraint on community_reports.reason).
export { demoStyleBoards, seedCommunityPosts, trendingSignalTags };

export const communityReportReasons: CommunityReportReason[] = [
  "Spam",
  "Inappropriate content",
  "Fake product claim",
  "Harassment",
  "Copyright concern",
  "Other",
];
