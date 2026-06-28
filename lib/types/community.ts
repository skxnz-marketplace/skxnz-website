export type CommunityVisibility = "Public Beta" | "Private Draft";

export type CommunityPostStatus =
  | "Demo Post"
  | "Beta Draft"
  | "Pending Moderation";

export type CommunityPost = {
  id: string;
  username: string;
  avatarInitials: string;
  timeLabel: string;
  image: string;
  caption: string;
  styleTags: string[];
  taggedProductIds: string[];
  visibility: CommunityVisibility;
  status: CommunityPostStatus;
  createdAt: string;
};

export type CommunityPostDraft = {
  caption: string;
  styleTags: string[];
  taggedProductIds: string[];
  visibility: CommunityVisibility;
};

export type CommunityReportReason =
  | "Spam"
  | "Inappropriate content"
  | "Fake product claim"
  | "Harassment"
  | "Copyright concern"
  | "Other";

export type CommunityReport = {
  id: string;
  postId: string;
  reason: CommunityReportReason;
  note: string;
  status: "Demo submitted";
  createdAt: string;
};

export type StyleBoard = {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  tags: string[];
  productIds: string[];
};
