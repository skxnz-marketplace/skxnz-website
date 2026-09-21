import type { Metadata } from "next";

import { CommunityFeed } from "@/components/community/community-feed";
import { CommunityNotWired } from "@/components/community/community-not-wired";
import { getCommunityPageData } from "@/lib/community/read-community";
import { trendingSignalTags } from "@/lib/data/community";

const description =
  "SKXNZ Community — fit posts tagging real SKXNZ catalog products, curated style boards, and real moderation. Posting is invite-only while the beta ramps up.";

export const metadata: Metadata = {
  title: "Community",
  description,
  alternates: { canonical: "/community" },
  openGraph: { type: "website", title: "SKXNZ Community", description, url: "/community" },
};

export const revalidate = 60;

export default async function CommunityPage() {
  const data = await getCommunityPageData();

  if (!data.backendReady) {
    return <CommunityNotWired />;
  }

  return (
    <CommunityFeed
      initialPosts={data.posts}
      products={data.products}
      styleBoards={data.styleBoards}
      tags={trendingSignalTags}
      initialLikedPostIds={data.likedPostIds}
      initialSavedPostIds={data.savedPostIds}
      canPost={data.canPost}
      isSignedIn={data.isSignedIn}
    />
  );
}
