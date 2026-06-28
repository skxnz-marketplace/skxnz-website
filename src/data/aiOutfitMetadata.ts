// Auto-generated from master store products and AI planning rules.

export type AiOutfitMetadata = {
  productId: string;
  slug: string;
  itemType: string;
  styleTags: string[];
  occasionTags: string[];
  colorFamily: string[];
  budgetRange: string;
  fitType: string;
  gender: string;
  availableSizes: string[];
  stockStatus: string;
  dataSource: "sheet-derived";
};

export type AiModuleSummary = {
  id: string;
  feature: string;
  userType: string;
  purpose: string;
  launchPhase: string;
  needsBackend: string;
  needsImageAi: string;
  needsAdminReview: string;
  status: string;
};

export type AiRouteSummary = {
  route: string;
  method: string;
  feature: string;
  userType: string;
  purpose: string;
  launchPhase: string;
  status: string;
};

export const aiOutfitMetadata: AiOutfitMetadata[] = [
  {
    "productId": "sku-001",
    "slug": "obsidian-signal-oversized-tee",
    "itemType": "T-Shirts",
    "styleTags": [
      "oversized",
      "streetwear",
      "premium",
      "signal"
    ],
    "occasionTags": [
      "daily",
      "streetwear",
      "casual"
    ],
    "colorFamily": [
      "Black"
    ],
    "budgetRange": "Under ₹2,500",
    "fitType": "Oversized",
    "gender": "Men",
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-002",
    "slug": "pearl-signal-crop-jacket",
    "itemType": "Jackets",
    "styleTags": [
      "cropped",
      "futurewear",
      "premium",
      "new season"
    ],
    "occasionTags": [
      "editorial",
      "evening",
      "fashion"
    ],
    "colorFamily": [
      "White"
    ],
    "budgetRange": "₹4,000-₹5,999",
    "fitType": "Cropped",
    "gender": "Woman",
    "availableSizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-003",
    "slug": "chrome-trace-hoodie",
    "itemType": "Hoodies",
    "styleTags": [
      "hoodie",
      "chrome",
      "streetwear",
      "unisex"
    ],
    "occasionTags": [
      "daily",
      "streetwear",
      "layering"
    ],
    "colorFamily": [
      "Blue"
    ],
    "budgetRange": "₹2,500-₹3,999",
    "fitType": "Relaxed",
    "gender": "Unisex",
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-004",
    "slug": "sonic-magenta-mini-bag",
    "itemType": "Bags",
    "styleTags": [
      "bag",
      "luxury",
      "statement",
      "limited edition"
    ],
    "occasionTags": [
      "party",
      "editorial",
      "evening"
    ],
    "colorFamily": [
      "Magenta"
    ],
    "budgetRange": "₹2,500-₹3,999",
    "fitType": "Accessory",
    "gender": "Unisex",
    "availableSizes": [
      "One Size"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-005",
    "slug": "liquid-silver-perfume",
    "itemType": "Fragrance",
    "styleTags": [
      "perfume",
      "luxury",
      "fragrance",
      "ai stylised"
    ],
    "occasionTags": [
      "daily",
      "evening",
      "signature"
    ],
    "colorFamily": [
      "Silver"
    ],
    "budgetRange": "₹2,500-₹3,999",
    "fitType": "Accessory",
    "gender": "Unisex",
    "availableSizes": [
      "100ML"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-006",
    "slug": "midnight-cargo-pants",
    "itemType": "Pants",
    "styleTags": [
      "cargo",
      "pants",
      "navy",
      "utility"
    ],
    "occasionTags": [
      "daily"
    ],
    "colorFamily": [
      "Blue"
    ],
    "budgetRange": "₹2,500-₹3,999",
    "fitType": "Regular",
    "gender": "Men",
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-007",
    "slug": "ultraviolet-mesh-top",
    "itemType": "Tops",
    "styleTags": [
      "mesh",
      "top",
      "ultraviolet",
      "futuristic"
    ],
    "occasionTags": [
      "daily"
    ],
    "colorFamily": [
      "Ultraviolet Purple"
    ],
    "budgetRange": "₹2,500-₹3,999",
    "fitType": "Regular",
    "gender": "Woman",
    "availableSizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-008",
    "slug": "pearl-white-sneakers",
    "itemType": "Sneakers",
    "styleTags": [
      "sneakers",
      "pearl",
      "footwear",
      "premium"
    ],
    "occasionTags": [
      "daily"
    ],
    "colorFamily": [
      "White"
    ],
    "budgetRange": "₹4,000-₹5,999",
    "fitType": "Regular",
    "gender": "Unisex",
    "availableSizes": [
      "6",
      "7",
      "8",
      "9",
      "10",
      "11"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-009",
    "slug": "obsidian-rider-vest",
    "itemType": "Vests",
    "styleTags": [
      "vest",
      "black",
      "utility",
      "streetwear"
    ],
    "occasionTags": [
      "daily"
    ],
    "colorFamily": [
      "Black"
    ],
    "budgetRange": "₹4,000-₹5,999",
    "fitType": "Regular",
    "gender": "Unisex",
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-010",
    "slug": "electric-cyan-sunglasses",
    "itemType": "Eyewear",
    "styleTags": [
      "sunglasses",
      "cyan",
      "eyewear",
      "accessory"
    ],
    "occasionTags": [
      "daily"
    ],
    "colorFamily": [
      "Electric Cyan"
    ],
    "budgetRange": "Under ₹2,500",
    "fitType": "Regular",
    "gender": "Unisex",
    "availableSizes": [
      "One Size"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-011",
    "slug": "signal-layered-shirt",
    "itemType": "Shirts",
    "styleTags": [
      "shirt",
      "layered",
      "premium",
      "editorial"
    ],
    "occasionTags": [
      "daily"
    ],
    "colorFamily": [
      "White"
    ],
    "budgetRange": "₹2,500-₹3,999",
    "fitType": "Regular",
    "gender": "Men",
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-012",
    "slug": "chrome-district-bracelet",
    "itemType": "Jewellery",
    "styleTags": [
      "bracelet",
      "chrome",
      "jewellery",
      "accessory"
    ],
    "occasionTags": [
      "daily"
    ],
    "colorFamily": [
      "Silver"
    ],
    "budgetRange": "Under ₹2,500",
    "fitType": "Regular",
    "gender": "Unisex",
    "availableSizes": [
      "One Size"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-013",
    "slug": "demo-atelier-long-coat",
    "itemType": "Coats",
    "styleTags": [
      "coat",
      "long coat",
      "premium",
      "atelier"
    ],
    "occasionTags": [
      "daily"
    ],
    "colorFamily": [
      "White"
    ],
    "budgetRange": "₹6,000+",
    "fitType": "Regular",
    "gender": "Woman",
    "availableSizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-014",
    "slug": "future-runner-crossbody",
    "itemType": "Bags",
    "styleTags": [
      "crossbody",
      "bag",
      "futuristic",
      "chrome"
    ],
    "occasionTags": [
      "daily"
    ],
    "colorFamily": [
      "Black"
    ],
    "budgetRange": "₹2,500-₹3,999",
    "fitType": "Regular",
    "gender": "Unisex",
    "availableSizes": [
      "One Size"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  },
  {
    "productId": "sku-015",
    "slug": "ai-drift-co-ord-set",
    "itemType": "Co-ord Sets",
    "styleTags": [
      "co-ord",
      "ai",
      "futuristic",
      "set"
    ],
    "occasionTags": [
      "daily"
    ],
    "colorFamily": [
      "Ultraviolet Purple"
    ],
    "budgetRange": "₹4,000-₹5,999",
    "fitType": "Regular",
    "gender": "Unisex",
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "stockStatus": "In Stock",
    "dataSource": "sheet-derived"
  }
];

export const aiModules: AiModuleSummary[] = [
  {
    "id": "AI-001",
    "feature": "Buyer AI Assistant",
    "userType": "Buyer",
    "purpose": "Help shoppers discover products, compare choices, understand policies, and get order/support guidance.",
    "launchPhase": "Phase 1",
    "needsBackend": "Yes",
    "needsImageAi": "No",
    "needsAdminReview": "No",
    "status": "Planned"
  },
  {
    "id": "AI-002",
    "feature": "AI Outfit Builder",
    "userType": "Buyer",
    "purpose": "Build complete outfits from active SKXNZ products using budget, style, size, occasion, and stock constraints.",
    "launchPhase": "Phase 1",
    "needsBackend": "Yes",
    "needsImageAi": "No",
    "needsAdminReview": "No",
    "status": "Planned"
  },
  {
    "id": "AI-003",
    "feature": "Seller Product Validation",
    "userType": "Seller/Admin",
    "purpose": "Check seller uploads for missing fields, duplicate risk, image quality, category/tag readiness, and publish-readiness.",
    "launchPhase": "Phase 1",
    "needsBackend": "Yes",
    "needsImageAi": "No",
    "needsAdminReview": "Yes",
    "status": "Planned"
  },
  {
    "id": "AI-004",
    "feature": "Backend AI Data Handler",
    "userType": "System",
    "purpose": "Control AI calls, data access, tool permissions, usage logs, cost tracking, audit logs, and job queues.",
    "launchPhase": "Phase 1",
    "needsBackend": "Yes",
    "needsImageAi": "No",
    "needsAdminReview": "Yes",
    "status": "Planned"
  },
  {
    "id": "AI-005",
    "feature": "Rider Helper",
    "userType": "Rider",
    "purpose": "Guide delivery partners through pickup, delivery, COD, failed delivery, return pickup, and policy-based next steps.",
    "launchPhase": "Phase 2",
    "needsBackend": "Yes",
    "needsImageAi": "No",
    "needsAdminReview": "No",
    "status": "Planned"
  },
  {
    "id": "AI-006",
    "feature": "Admin Daily Summary",
    "userType": "Admin",
    "purpose": "Summarize orders, returns, support issues, seller alerts, failed deliveries, and top searches.",
    "launchPhase": "Phase 2",
    "needsBackend": "Yes",
    "needsImageAi": "No",
    "needsAdminReview": "Yes",
    "status": "Planned"
  },
  {
    "id": "AI-007",
    "feature": "Support Triage",
    "userType": "Support/Admin",
    "purpose": "Classify support tickets by urgency, topic, order relation, and suggested next action.",
    "launchPhase": "Phase 2",
    "needsBackend": "Yes",
    "needsImageAi": "No",
    "needsAdminReview": "Yes",
    "status": "Planned"
  },
  {
    "id": "AI-008",
    "feature": "Return Reason Summary",
    "userType": "Admin/Seller",
    "purpose": "Summarize why products are returned and identify recurring product/fit/delivery issues.",
    "launchPhase": "Phase 2",
    "needsBackend": "Yes",
    "needsImageAi": "No",
    "needsAdminReview": "Yes",
    "status": "Planned"
  },
  {
    "id": "AI-009",
    "feature": "AI Visual Search",
    "userType": "Buyer",
    "purpose": "Allow users to upload/screenshot a look and find visually similar products in SKXNZ.",
    "launchPhase": "Phase 3",
    "needsBackend": "Yes",
    "needsImageAi": "Yes",
    "needsAdminReview": "No",
    "status": "Planned"
  },
  {
    "id": "AI-010",
    "feature": "Full Outfit Try-On",
    "userType": "Buyer",
    "purpose": "Generate a visual try-on preview for selected outfits after user consent.",
    "launchPhase": "Phase 3",
    "needsBackend": "Yes",
    "needsImageAi": "Yes",
    "needsAdminReview": "Yes",
    "status": "Planned"
  },
  {
    "id": "AI-011",
    "feature": "Size Confidence Assistant",
    "userType": "Buyer",
    "purpose": "Estimate size confidence using brand size charts, user preference, and product measurements without guaranteeing fit.",
    "launchPhase": "Phase 3",
    "needsBackend": "Yes",
    "needsImageAi": "No",
    "needsAdminReview": "No",
    "status": "Planned"
  },
  {
    "id": "AI-012",
    "feature": "Personalized Homepage AI",
    "userType": "Buyer",
    "purpose": "Reorder homepage/category/product suggestions based on style profile, wishlist, searches, and budget signals.",
    "launchPhase": "Phase 3",
    "needsBackend": "Yes",
    "needsImageAi": "No",
    "needsAdminReview": "Yes",
    "status": "Planned"
  }
];

export const aiRoutes: AiRouteSummary[] = [
  {
    "route": "/api/ai/buyer-assistant",
    "method": "POST",
    "feature": "Buyer AI Assistant",
    "userType": "Buyer",
    "purpose": "Answer shopping, product, order, and policy questions using permitted data.",
    "launchPhase": "Phase 1",
    "status": "Planned"
  },
  {
    "route": "/api/ai/outfit-builder",
    "method": "POST",
    "feature": "AI Outfit Builder",
    "userType": "Buyer",
    "purpose": "Build complete outfits from products, budget, size, occasion, and style preferences.",
    "launchPhase": "Phase 1",
    "status": "Planned"
  },
  {
    "route": "/api/ai/outfit-results/:id",
    "method": "GET",
    "feature": "AI Outfit Builder",
    "userType": "Buyer",
    "purpose": "Fetch saved outfit result.",
    "launchPhase": "Phase 1",
    "status": "Planned"
  },
  {
    "route": "/api/ai/seller-product-check",
    "method": "POST",
    "feature": "Seller Validation",
    "userType": "Seller",
    "purpose": "Validate product draft fields, images, category/tags, risk, and publish-readiness.",
    "launchPhase": "Phase 1",
    "status": "Planned"
  },
  {
    "route": "/api/ai/usage",
    "method": "GET",
    "feature": "Backend AI Handler",
    "userType": "Admin",
    "purpose": "View usage/cost summary.",
    "launchPhase": "Phase 1",
    "status": "Planned"
  },
  {
    "route": "/api/ai/audit-logs",
    "method": "GET",
    "feature": "Backend AI Handler",
    "userType": "Admin",
    "purpose": "View AI audit logs.",
    "launchPhase": "Phase 1",
    "status": "Planned"
  },
  {
    "route": "/api/ai/rider-helper",
    "method": "POST",
    "feature": "Rider Helper",
    "userType": "Rider",
    "purpose": "Get policy-based guidance for delivery task issues.",
    "launchPhase": "Phase 2",
    "status": "Planned"
  },
  {
    "route": "/api/ai/admin-summary",
    "method": "GET",
    "feature": "Admin AI",
    "userType": "Admin",
    "purpose": "Daily operating summary.",
    "launchPhase": "Phase 2",
    "status": "Planned"
  },
  {
    "route": "/api/ai/support-triage",
    "method": "POST",
    "feature": "Support Triage",
    "userType": "Support/Admin",
    "purpose": "Classify support ticket and suggest next action.",
    "launchPhase": "Phase 2",
    "status": "Planned"
  },
  {
    "route": "/api/ai/visual-search",
    "method": "POST",
    "feature": "AI Visual Search",
    "userType": "Buyer",
    "purpose": "Find similar products from uploaded image/screenshot.",
    "launchPhase": "Phase 3",
    "status": "Planned"
  },
  {
    "route": "/api/ai/try-on/jobs",
    "method": "POST",
    "feature": "Full Outfit Try-On",
    "userType": "Buyer",
    "purpose": "Create try-on job after consent.",
    "launchPhase": "Phase 3",
    "status": "Planned"
  },
  {
    "route": "/api/ai/try-on/jobs/:id",
    "method": "GET",
    "feature": "Full Outfit Try-On",
    "userType": "Buyer",
    "purpose": "Fetch try-on job status/result.",
    "launchPhase": "Phase 3",
    "status": "Planned"
  },
  {
    "route": "/api/ai/try-on/results/:id",
    "method": "DELETE",
    "feature": "Full Outfit Try-On",
    "userType": "Buyer",
    "purpose": "Delete try-on result/photo references according to policy.",
    "launchPhase": "Phase 3",
    "status": "Planned"
  }
];

export const aiOutfitBuilderRules = [
  {
    "ruleId": "OB-001",
    "rule": "Only suggest products that are active and in stock.",
    "priority": "Critical",
    "dataNeeded": "product.status, inventory.stock_quantity",
    "example": "Do not show sold-out hoodie.",
    "status": "Planned"
  },
  {
    "ruleId": "OB-002",
    "rule": "Stay inside user budget unless over-budget is clearly stated.",
    "priority": "Critical",
    "dataNeeded": "price, sale_price, budget",
    "example": "₹10,500 outfit for ₹10,000 budget must show warning.",
    "status": "Planned"
  },
  {
    "ruleId": "OB-003",
    "rule": "Build complete outfits, not random product lists.",
    "priority": "High",
    "dataNeeded": "item_type",
    "example": "Topwear + bottomwear + footwear + accessory/perfume.",
    "status": "Planned"
  },
  {
    "ruleId": "OB-004",
    "rule": "Match size availability when user gives size.",
    "priority": "High",
    "dataNeeded": "variants, size_availability",
    "example": "User wears XL, avoid products without XL.",
    "status": "Planned"
  },
  {
    "ruleId": "OB-005",
    "rule": "Respect occasion and style.",
    "priority": "High",
    "dataNeeded": "occasion_tags, style_tags",
    "example": "Party outfit should not look like gymwear.",
    "status": "Planned"
  },
  {
    "ruleId": "OB-006",
    "rule": "Give 2–3 options maximum.",
    "priority": "Medium",
    "dataNeeded": "ranking score",
    "example": "Minimal / bold / premium options.",
    "status": "Planned"
  },
  {
    "ruleId": "OB-007",
    "rule": "Show total price and savings clearly.",
    "priority": "High",
    "dataNeeded": "price, sale_price",
    "example": "Total ₹9,497, saved ₹1,000.",
    "status": "Planned"
  },
  {
    "ruleId": "OB-008",
    "rule": "Allow regenerate/refine.",
    "priority": "Medium",
    "dataNeeded": "user preferences",
    "example": "Make it darker, cheaper, more formal.",
    "status": "Planned"
  }
];
