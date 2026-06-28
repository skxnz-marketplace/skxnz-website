import { products } from "@/lib/data/products";
import type { CommunityPost, StyleBoard } from "@/lib/types/community";
import { skxnzFallbackAssets } from "@/src/lib/assets";

function findProductId(predicate: (product: (typeof products)[number]) => boolean) {
  return products.find(predicate)?.id ?? products[0]?.id ?? "demo-product";
}

function getProductImage(productId: string) {
  return (
    products.find((product) => product.id === productId)?.image ??
    skxnzFallbackAssets.product
  );
}

const jacketId = findProductId((product) =>
  [product.name, product.subcategory, product.category].join(" ").toLowerCase().includes("jacket"),
);
const teeId = findProductId((product) =>
  [product.name, product.subcategory].join(" ").toLowerCase().includes("tee"),
);
const accessoryId = findProductId((product) =>
  product.category.toLowerCase().includes("accessories"),
);
const perfumeId = findProductId((product) =>
  product.category.toLowerCase().includes("perfume"),
);
const sneakerId = findProductId((product) =>
  [product.name, product.subcategory, product.category].join(" ").toLowerCase().includes("sneaker"),
);
const limitedId = findProductId((product) =>
  [...product.tags, ...product.collections].join(" ").toLowerCase().includes("limited"),
);
const aiStyledId = findProductId((product) =>
  [...product.tags, ...product.collections].join(" ").toLowerCase().includes("ai styl"),
);
const newSeasonId = findProductId((product) =>
  [...product.tags, ...product.collections].join(" ").toLowerCase().includes("new season"),
);

export const trendingSignalTags = [
  "#Streetwear",
  "#AllBlack",
  "#ChromeFit",
  "#LuxuryDrop",
  "#AIStyled",
  "#NewSeason",
  "#LimitedEdition",
  "#Futurewear",
  "#WearTheSignal",
];

export const seedCommunityPosts: CommunityPost[] = [
  {
    id: "signal-post-001",
    username: "signal.mira",
    avatarInitials: "SM",
    timeLabel: "Demo, 12 min ago",
    image: getProductImage(jacketId),
    caption:
      "Chrome layers, clean base, sharp accessory signal. Built as a beta style post for SKXNZ discovery.",
    styleTags: ["#ChromeFit", "#Futurewear", "#WearTheSignal"],
    taggedProductIds: [jacketId, accessoryId],
    visibility: "Public Beta",
    status: "Demo Post",
    createdAt: "2026-05-17T10:10:00.000Z",
  },
  {
    id: "signal-post-002",
    username: "noir.archive",
    avatarInitials: "NA",
    timeLabel: "Demo, 38 min ago",
    image: getProductImage(teeId),
    caption:
      "A quieter streetwear board: oversized tee, dark tone, and one clean finishing piece.",
    styleTags: ["#Streetwear", "#AllBlack", "#CollegeFits"],
    taggedProductIds: [teeId, accessoryId],
    visibility: "Public Beta",
    status: "Demo Post",
    createdAt: "2026-05-17T09:42:00.000Z",
  },
  {
    id: "signal-post-003",
    username: "drop.reader",
    avatarInitials: "DR",
    timeLabel: "Demo, 1 hr ago",
    image: getProductImage(limitedId),
    caption:
      "Limited edition energy without fake scarcity claims. Saved as an internal community preview.",
    styleTags: ["#LimitedEdition", "#LuxuryDrop", "#NewSeason"],
    taggedProductIds: [limitedId, newSeasonId],
    visibility: "Public Beta",
    status: "Demo Post",
    createdAt: "2026-05-17T09:04:00.000Z",
  },
  {
    id: "signal-post-004",
    username: "aura.signal",
    avatarInitials: "AS",
    timeLabel: "Demo, 2 hr ago",
    image: getProductImage(perfumeId),
    caption:
      "Scent as the final signal: perfume plus chrome accessory styling for a cleaner evening fit.",
    styleTags: ["#DateNight", "#Perfume", "#ChromeFit"],
    taggedProductIds: [perfumeId, accessoryId],
    visibility: "Public Beta",
    status: "Demo Post",
    createdAt: "2026-05-17T08:15:00.000Z",
  },
  {
    id: "signal-post-005",
    username: "route.future",
    avatarInitials: "RF",
    timeLabel: "Demo, 3 hr ago",
    image: getProductImage(sneakerId),
    caption:
      "Airport fit beta board: comfortable sneaker shape, utility layer, and a low-noise palette.",
    styleTags: ["#AirportFits", "#Futurewear", "#Travel"],
    taggedProductIds: [sneakerId, jacketId],
    visibility: "Public Beta",
    status: "Demo Post",
    createdAt: "2026-05-17T07:18:00.000Z",
  },
  {
    id: "signal-post-006",
    username: "styled.local",
    avatarInitials: "SL",
    timeLabel: "Demo, today",
    image: getProductImage(aiStyledId),
    caption:
      "AI Styled is a beta discovery label here, not a claim of live AI personalization.",
    styleTags: ["#AIStyled", "#NewSeason", "#WearTheSignal"],
    taggedProductIds: [aiStyledId, teeId],
    visibility: "Public Beta",
    status: "Demo Post",
    createdAt: "2026-05-17T06:30:00.000Z",
  },
];

export const demoStyleBoards: StyleBoard[] = [
  {
    id: "style-board-night-fits",
    title: "Night Fits",
    slug: "night-fits",
    description: "Dark, polished, and sharp enough for late plans.",
    image: getProductImage(jacketId),
    tags: ["#AllBlack", "#DateNight"],
    productIds: [jacketId, accessoryId],
  },
  {
    id: "style-board-college-fits",
    title: "College Fits",
    slug: "college-fits",
    description: "Comfort-first product edits for daily rotation.",
    image: getProductImage(teeId),
    tags: ["#Streetwear", "#DailyWear"],
    productIds: [teeId, sneakerId],
  },
  {
    id: "style-board-luxury-streetwear",
    title: "Luxury Streetwear",
    slug: "luxury-streetwear",
    description: "Elevated demo styling with no official brand claims.",
    image: getProductImage(limitedId),
    tags: ["#LuxuryDrop", "#LimitedEdition"],
    productIds: [limitedId, jacketId],
  },
  {
    id: "style-board-airport-fits",
    title: "Airport Fits",
    slug: "airport-fits",
    description: "Travel-friendly layers, sneakers, and carry pieces.",
    image: getProductImage(sneakerId),
    tags: ["#AirportFits", "#Travel"],
    productIds: [sneakerId, accessoryId],
  },
  {
    id: "style-board-futurewear",
    title: "Futurewear",
    slug: "futurewear",
    description: "Chrome, utility, and premium SKXNZ demo signals.",
    image: getProductImage(aiStyledId),
    tags: ["#Futurewear", "#AIStyled"],
    productIds: [aiStyledId, jacketId],
  },
  {
    id: "style-board-date-night",
    title: "Date Night",
    slug: "date-night",
    description: "Clean scent, controlled layers, and one standout accent.",
    image: getProductImage(perfumeId),
    tags: ["#DateNight", "#Perfume"],
    productIds: [perfumeId, accessoryId],
  },
  {
    id: "style-board-chrome-fits",
    title: "Chrome Fits",
    slug: "chrome-fits",
    description: "High-shine finishing pieces and sharp silhouettes.",
    image: getProductImage(accessoryId),
    tags: ["#ChromeFit", "#WearTheSignal"],
    productIds: [accessoryId, jacketId],
  },
  {
    id: "style-board-new-season",
    title: "New Season",
    slug: "new-season",
    description: "New-season demo products prepared for private QA.",
    image: getProductImage(newSeasonId),
    tags: ["#NewSeason", "#Futurewear"],
    productIds: [newSeasonId, teeId],
  },
];
