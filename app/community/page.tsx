import type { Metadata } from "next";

import { CommunityFeed } from "@/components/community/community-feed";
import { products } from "@/lib/data/products";
import {
  demoStyleBoards,
  seedCommunityPosts,
  trendingSignalTags,
} from "@/lib/data/community";

export const metadata: Metadata = {
  title: "Signal Community Beta",
  description:
    "Signal Community Beta is the SKXNZ MVP style layer for demo posts, tagged products, saved looks, and report-prepared community testing.",
};

export const revalidate = 300;

export default function CommunityPage() {
  return (
    <CommunityFeed
      initialPosts={seedCommunityPosts}
      products={products}
      styleBoards={demoStyleBoards}
      tags={trendingSignalTags}
    />
  );
}
