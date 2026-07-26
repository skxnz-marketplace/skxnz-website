// Auto-generated from project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx
// by scripts/import-sheet-data.py. Keep demo compatibility layers elsewhere.

export type StructuredProduct = {
  id: string;
  sourceProductId: string;
  slug: string;
  name: string;
  brandId: string;
  brandSlug: string;
  brandName: string;
  category: string;
  subcategory: string;
  gender: string;
  collections: string[];
  collectionSlug: string;
  tags: string[];
  priceInr: number;
  salePriceInr: number | null;
  currency: string;
  description: string;
  shortDescription: string;
  image: string;
  gallery: string[];
  sourceImageFileNames: string[];
  availableSizes: string[];
  availableColors: string[];
  stockQuantity: number;
  stockStatus: string;
  sku: string;
  status: string;
  featured: boolean;
  homepageDisplay: boolean;
  brandPageDisplay: boolean;
  searchKeywords: string[];
  createdDate: string;
  dataSource: "sheet";
};

export const structuredProducts: StructuredProduct[] = [
  {
    "id": "sku-001",
    "sourceProductId": "SKXNZ-001",
    "slug": "obsidian-signal-oversized-tee",
    "name": "Obsidian Signal Oversized Tee",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "Men",
    "subcategory": "T-Shirts",
    "gender": "Men",
    "collections": [
      "Wear The Signal"
    ],
    "collectionSlug": "wear-the-signal",
    "tags": [
      "oversized",
      "black",
      "streetwear",
      "premium"
    ],
    "priceInr": 2499,
    "salePriceInr": 1999,
    "currency": "INR",
    "description": "Premium oversized tee concept built around the SKXNZ signal identity.",
    "shortDescription": "Oversized premium SKXNZ tee.",
    "image": "/assets/demo/uploaded/products/skxnz-graphic-tee.png",
    "gallery": [
      "/assets/demo/uploaded/products/skxnz-graphic-tee.png",
      "/assets/demo/products/product-01.webp",
      "/assets/demo/products/product-03.webp",
      "/assets/demo/uploaded/products/skxnz-back-tee.png"
    ],
    "sourceImageFileNames": [
      "product-obsidian-signal-tee-01.png",
      "product-obsidian-signal-tee-02.png",
      "product-obsidian-signal-tee-03.png",
      "product-obsidian-signal-tee-04.png"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "availableColors": [
      "Obsidian Black"
    ],
    "stockQuantity": 50,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-TEE-001",
    "status": "Demo",
    "featured": true,
    "homepageDisplay": true,
    "brandPageDisplay": true,
    "searchKeywords": [
      "men tee",
      "oversized tee",
      "black tee",
      "streetwear",
      "skxnz",
      "wear the signal",
      "oversized",
      "black",
      "premium",
      "Men",
      "T-Shirts",
      "SKXNZ",
      "Wear The Signal"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-002",
    "sourceProductId": "SKXNZ-002",
    "slug": "pearl-signal-crop-jacket",
    "name": "Pearl Signal Crop Jacket",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "Woman",
    "subcategory": "Jackets",
    "gender": "Woman",
    "collections": [
      "New Season"
    ],
    "collectionSlug": "new-season",
    "tags": [
      "jacket",
      "pearl",
      "premium",
      "futuristic"
    ],
    "priceInr": 4999,
    "salePriceInr": 4299,
    "currency": "INR",
    "description": "A pearl-toned cropped jacket concept for futurewear styling.",
    "shortDescription": "Pearl cropped futurewear jacket.",
    "image": "/assets/home/categories/women.png",
    "gallery": [
      "/assets/home/categories/women.png",
      "/assets/demo/products/product-02.webp",
      "/assets/demo/products/product-07.webp",
      "/assets/demo/uploaded/editorial/fire-shirt-look.png"
    ],
    "sourceImageFileNames": [
      "product-pearl-crop-jacket-01.png",
      "product-pearl-crop-jacket-02.png",
      "product-pearl-crop-jacket-03.png",
      "product-pearl-crop-jacket-04.png"
    ],
    "availableSizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "availableColors": [
      "Pearl White"
    ],
    "stockQuantity": 35,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-JKT-002",
    "status": "Demo",
    "featured": true,
    "homepageDisplay": true,
    "brandPageDisplay": true,
    "searchKeywords": [
      "woman jacket",
      "crop jacket",
      "pearl jacket",
      "new season",
      "skxnz",
      "jacket",
      "pearl",
      "premium",
      "futuristic",
      "Woman",
      "Jackets",
      "SKXNZ",
      "New Season"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-003",
    "sourceProductId": "SKXNZ-003",
    "slug": "chrome-trace-hoodie",
    "name": "Chrome Trace Hoodie",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "Streetwear",
    "subcategory": "Hoodies",
    "gender": "Unisex",
    "collections": [
      "Wear The Signal"
    ],
    "collectionSlug": "wear-the-signal",
    "tags": [
      "hoodie",
      "chrome",
      "streetwear",
      "unisex"
    ],
    "priceInr": 3999,
    "salePriceInr": 3499,
    "currency": "INR",
    "description": "A clean heavyweight hoodie concept with chrome signal detailing.",
    "shortDescription": "Premium chrome streetwear hoodie.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp",
      "/assets/demo/uploaded/products/skxnz-back-tee.png",
      "/assets/demo/products/product-07.webp",
      "/assets/demo/uploaded/editorial/monochrome-fit.png"
    ],
    "sourceImageFileNames": [
      "product-chrome-trace-hoodie-01.png",
      "product-chrome-trace-hoodie-02.png",
      "product-chrome-trace-hoodie-03.png",
      "product-chrome-trace-hoodie-04.png"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "availableColors": [
      "Midnight Navy"
    ],
    "stockQuantity": 40,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-HDY-003",
    "status": "Demo",
    "featured": true,
    "homepageDisplay": true,
    "brandPageDisplay": true,
    "searchKeywords": [
      "hoodie",
      "streetwear",
      "unisex hoodie",
      "chrome hoodie",
      "skxnz",
      "chrome",
      "unisex",
      "Streetwear",
      "Hoodies",
      "SKXNZ",
      "Wear The Signal"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-004",
    "sourceProductId": "SKXNZ-004",
    "slug": "sonic-magenta-mini-bag",
    "name": "Sonic Magenta Mini Bag",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "Accessories",
    "subcategory": "Bags",
    "gender": "Unisex",
    "collections": [
      "Limited Edition"
    ],
    "collectionSlug": "limited-edition",
    "tags": [
      "bag",
      "magenta",
      "accessory",
      "luxury"
    ],
    "priceInr": 2999,
    "salePriceInr": 2499,
    "currency": "INR",
    "description": "Compact statement bag concept with sonic magenta detailing.",
    "shortDescription": "Premium mini accessory bag.",
    "image": "/assets/demo/products/product-06.webp",
    "gallery": [
      "/assets/demo/products/product-06.webp",
      "/assets/demo/products/product-05.webp",
      "/assets/demo/uploaded/categories/streetwear-chain.png",
      "/assets/home/categories/women.png"
    ],
    "sourceImageFileNames": [
      "product-sonic-mini-bag-01.png",
      "product-sonic-mini-bag-02.png",
      "product-sonic-mini-bag-03.png",
      "product-sonic-mini-bag-04.png"
    ],
    "availableSizes": [
      "One Size"
    ],
    "availableColors": [
      "Sonic Magenta"
    ],
    "stockQuantity": 25,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-BAG-004",
    "status": "Demo",
    "featured": true,
    "homepageDisplay": true,
    "brandPageDisplay": true,
    "searchKeywords": [
      "accessories",
      "bag",
      "mini bag",
      "magenta",
      "limited edition",
      "accessory",
      "luxury",
      "Accessories",
      "Bags",
      "SKXNZ",
      "Limited Edition"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-005",
    "sourceProductId": "SKXNZ-005",
    "slug": "liquid-silver-perfume",
    "name": "Liquid Silver Perfume",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "Perfume",
    "subcategory": "Fragrance",
    "gender": "Unisex",
    "collections": [
      "AI Stylised"
    ],
    "collectionSlug": "ai-stylised",
    "tags": [
      "perfume",
      "silver",
      "fragrance",
      "luxury"
    ],
    "priceInr": 3499,
    "salePriceInr": 2999,
    "currency": "INR",
    "description": "A luxury fragrance concept for the SKXNZ futurewear identity.",
    "shortDescription": "Liquid silver fragrance concept.",
    "image": "/assets/demo/uploaded/editorial/chrome-queen.png",
    "gallery": [
      "/assets/demo/uploaded/editorial/chrome-queen.png",
      "/assets/demo/products/product-05.webp",
      "/assets/demo/products/product-09.webp",
      "/assets/home/categories/streetwear.png"
    ],
    "sourceImageFileNames": [
      "product-liquid-silver-perfume-01.png",
      "product-liquid-silver-perfume-02.png",
      "product-liquid-silver-perfume-03.png",
      "product-liquid-silver-perfume-04.png"
    ],
    "availableSizes": [
      "100ML"
    ],
    "availableColors": [
      "Liquid Silver"
    ],
    "stockQuantity": 30,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-PRF-005",
    "status": "Demo",
    "featured": true,
    "homepageDisplay": true,
    "brandPageDisplay": true,
    "searchKeywords": [
      "perfume",
      "fragrance",
      "unisex perfume",
      "silver",
      "ai stylised",
      "luxury",
      "Perfume",
      "Fragrance",
      "SKXNZ",
      "AI Stylised"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-006",
    "sourceProductId": "SKXNZ-006",
    "slug": "midnight-cargo-pants",
    "name": "Midnight Cargo Pants",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "Men",
    "subcategory": "Pants",
    "gender": "Men",
    "collections": [
      "Streetwear"
    ],
    "collectionSlug": "streetwear",
    "tags": [
      "cargo",
      "pants",
      "navy",
      "utility"
    ],
    "priceInr": 3799,
    "salePriceInr": 3299,
    "currency": "INR",
    "description": "Utility cargo pants concept with premium streetwear proportions.",
    "shortDescription": "Premium midnight cargo pants.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp"
    ],
    "sourceImageFileNames": [
      "product-midnight-cargo-pants-01.png",
      "product-midnight-cargo-pants-02.png",
      "product-midnight-cargo-pants-03.png",
      "product-midnight-cargo-pants-04.png"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "availableColors": [
      "Midnight Navy"
    ],
    "stockQuantity": 45,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-PNT-006",
    "status": "Demo",
    "featured": false,
    "homepageDisplay": false,
    "brandPageDisplay": true,
    "searchKeywords": [
      "men pants",
      "cargo pants",
      "streetwear pants",
      "utility",
      "cargo",
      "pants",
      "navy",
      "Men",
      "Pants",
      "SKXNZ",
      "Streetwear"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-007",
    "sourceProductId": "SKXNZ-007",
    "slug": "ultraviolet-mesh-top",
    "name": "Ultraviolet Mesh Top",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "Woman",
    "subcategory": "Tops",
    "gender": "Woman",
    "collections": [
      "AI Stylised"
    ],
    "collectionSlug": "ai-stylised",
    "tags": [
      "mesh",
      "top",
      "ultraviolet",
      "futuristic"
    ],
    "priceInr": 2799,
    "salePriceInr": 2299,
    "currency": "INR",
    "description": "Futuristic mesh top concept with ultraviolet visual direction.",
    "shortDescription": "Ultraviolet premium mesh top.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp"
    ],
    "sourceImageFileNames": [
      "product-ultraviolet-mesh-top-01.png",
      "product-ultraviolet-mesh-top-02.png",
      "product-ultraviolet-mesh-top-03.png",
      "product-ultraviolet-mesh-top-04.png"
    ],
    "availableSizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "availableColors": [
      "Ultraviolet Purple"
    ],
    "stockQuantity": 38,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-TOP-007",
    "status": "Demo",
    "featured": false,
    "homepageDisplay": false,
    "brandPageDisplay": true,
    "searchKeywords": [
      "woman top",
      "mesh top",
      "ultraviolet",
      "ai fashion",
      "mesh",
      "top",
      "futuristic",
      "Woman",
      "Tops",
      "SKXNZ",
      "AI Stylised"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-008",
    "sourceProductId": "SKXNZ-008",
    "slug": "pearl-white-sneakers",
    "name": "Pearl White Sneakers",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "Footwear",
    "subcategory": "Sneakers",
    "gender": "Unisex",
    "collections": [
      "New Season"
    ],
    "collectionSlug": "new-season",
    "tags": [
      "sneakers",
      "pearl",
      "footwear",
      "premium"
    ],
    "priceInr": 5999,
    "salePriceInr": 4999,
    "currency": "INR",
    "description": "Clean futuristic sneaker concept with pearl white styling.",
    "shortDescription": "Pearl white premium sneakers.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp"
    ],
    "sourceImageFileNames": [
      "product-pearl-white-sneakers-01.png",
      "product-pearl-white-sneakers-02.png",
      "product-pearl-white-sneakers-03.png",
      "product-pearl-white-sneakers-04.png"
    ],
    "availableSizes": [
      "6",
      "7",
      "8",
      "9",
      "10",
      "11"
    ],
    "availableColors": [
      "Pearl White"
    ],
    "stockQuantity": 30,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-SNK-008",
    "status": "Demo",
    "featured": true,
    "homepageDisplay": true,
    "brandPageDisplay": true,
    "searchKeywords": [
      "sneakers",
      "footwear",
      "pearl sneakers",
      "new season",
      "pearl",
      "premium",
      "Footwear",
      "Sneakers",
      "SKXNZ",
      "New Season"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-009",
    "sourceProductId": "SKXNZ-009",
    "slug": "obsidian-rider-vest",
    "name": "Obsidian Rider Vest",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "Streetwear",
    "subcategory": "Vests",
    "gender": "Unisex",
    "collections": [
      "Limited Edition"
    ],
    "collectionSlug": "limited-edition",
    "tags": [
      "vest",
      "black",
      "utility",
      "streetwear"
    ],
    "priceInr": 4599,
    "salePriceInr": 3999,
    "currency": "INR",
    "description": "Utility vest concept with sharp SKXNZ streetwear language.",
    "shortDescription": "Obsidian utility rider vest.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp"
    ],
    "sourceImageFileNames": [
      "product-obsidian-rider-vest-01.png",
      "product-obsidian-rider-vest-02.png",
      "product-obsidian-rider-vest-03.png",
      "product-obsidian-rider-vest-04.png"
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "availableColors": [
      "Obsidian Black"
    ],
    "stockQuantity": 20,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-VST-009",
    "status": "Demo",
    "featured": false,
    "homepageDisplay": false,
    "brandPageDisplay": true,
    "searchKeywords": [
      "vest",
      "streetwear",
      "utility vest",
      "limited edition",
      "black",
      "utility",
      "Streetwear",
      "Vests",
      "SKXNZ",
      "Limited Edition"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-010",
    "sourceProductId": "SKXNZ-010",
    "slug": "electric-cyan-sunglasses",
    "name": "Electric Cyan Sunglasses",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "Accessories",
    "subcategory": "Eyewear",
    "gender": "Unisex",
    "collections": [
      "Wear The Signal"
    ],
    "collectionSlug": "wear-the-signal",
    "tags": [
      "sunglasses",
      "cyan",
      "eyewear",
      "accessory"
    ],
    "priceInr": 1999,
    "salePriceInr": 1699,
    "currency": "INR",
    "description": "Futuristic eyewear concept with electric cyan detailing.",
    "shortDescription": "Electric cyan premium eyewear.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp"
    ],
    "sourceImageFileNames": [
      "product-cyan-sunglasses-01.png",
      "product-cyan-sunglasses-02.png",
      "product-cyan-sunglasses-03.png",
      "product-cyan-sunglasses-04.png"
    ],
    "availableSizes": [
      "One Size"
    ],
    "availableColors": [
      "Electric Cyan"
    ],
    "stockQuantity": 60,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-EYE-010",
    "status": "Demo",
    "featured": false,
    "homepageDisplay": false,
    "brandPageDisplay": true,
    "searchKeywords": [
      "sunglasses",
      "eyewear",
      "accessories",
      "electric cyan",
      "cyan",
      "accessory",
      "Accessories",
      "Eyewear",
      "SKXNZ",
      "Wear The Signal"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-011",
    "sourceProductId": "SKXNZ-011",
    "slug": "signal-layered-shirt",
    "name": "Signal Layered Shirt",
    "brandId": "brand-003",
    "brandSlug": "signal-studio",
    "brandName": "Signal Studio",
    "category": "Men",
    "subcategory": "Shirts",
    "gender": "Men",
    "collections": [
      "New Season"
    ],
    "collectionSlug": "new-season",
    "tags": [
      "shirt",
      "layered",
      "premium",
      "editorial"
    ],
    "priceInr": 3299,
    "salePriceInr": 2899,
    "currency": "INR",
    "description": "Layered shirt concept with a streetwear-coded signal finish.",
    "shortDescription": "Layered premium signal shirt.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp"
    ],
    "sourceImageFileNames": [
      "product-signal-layered-shirt-01.png",
      "",
      "",
      ""
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "availableColors": [
      "Pearl White"
    ],
    "stockQuantity": 22,
    "stockStatus": "In Stock",
    "sku": "SIG-SHT-011",
    "status": "Demo",
    "featured": false,
    "homepageDisplay": false,
    "brandPageDisplay": true,
    "searchKeywords": [
      "shirt",
      "men shirt",
      "layered shirt",
      "signal studio",
      "layered",
      "premium",
      "editorial",
      "Men",
      "Shirts",
      "Signal Studio",
      "New Season"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-012",
    "sourceProductId": "SKXNZ-012",
    "slug": "chrome-district-bracelet",
    "name": "Chrome District Bracelet",
    "brandId": "brand-004",
    "brandSlug": "chrome-district",
    "brandName": "Chrome District",
    "category": "Accessories",
    "subcategory": "Jewellery",
    "gender": "Unisex",
    "collections": [
      "Limited Edition"
    ],
    "collectionSlug": "limited-edition",
    "tags": [
      "bracelet",
      "chrome",
      "jewellery",
      "accessory"
    ],
    "priceInr": 1799,
    "salePriceInr": 1499,
    "currency": "INR",
    "description": "Chrome bracelet concept with a polished sculptural finish.",
    "shortDescription": "Chrome premium bracelet.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp"
    ],
    "sourceImageFileNames": [
      "product-chrome-bracelet-01.png",
      "",
      "",
      ""
    ],
    "availableSizes": [
      "One Size"
    ],
    "availableColors": [
      "Liquid Silver"
    ],
    "stockQuantity": 55,
    "stockStatus": "In Stock",
    "sku": "CHR-BRC-012",
    "status": "Demo",
    "featured": false,
    "homepageDisplay": false,
    "brandPageDisplay": true,
    "searchKeywords": [
      "bracelet",
      "jewellery",
      "chrome district",
      "accessories",
      "chrome",
      "accessory",
      "Accessories",
      "Jewellery",
      "Chrome District",
      "Limited Edition"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-013",
    "sourceProductId": "SKXNZ-013",
    "slug": "demo-atelier-long-coat",
    "name": "Atelier Nova Long Coat",
    "brandId": "brand-002",
    "brandSlug": "demo-atelier",
    "brandName": "Atelier Nova",
    "category": "Woman",
    "subcategory": "Coats",
    "gender": "Woman",
    "collections": [
      "New Season"
    ],
    "collectionSlug": "new-season",
    "tags": [
      "coat",
      "long coat",
      "premium",
      "atelier"
    ],
    "priceInr": 7999,
    "salePriceInr": 6999,
    "currency": "INR",
    "description": "Long coat concept with a sculpted premium silhouette.",
    "shortDescription": "Premium atelier long coat.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp"
    ],
    "sourceImageFileNames": [
      "product-demo-atelier-long-coat-01.png",
      "",
      "",
      ""
    ],
    "availableSizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "availableColors": [
      "Pearl Beige"
    ],
    "stockQuantity": 18,
    "stockStatus": "In Stock",
    "sku": "DAT-COA-013",
    "status": "Demo",
    "featured": true,
    "homepageDisplay": false,
    "brandPageDisplay": true,
    "searchKeywords": [
      "woman coat",
      "long coat",
      "demo atelier",
      "premium",
      "coat",
      "atelier",
      "Woman",
      "Coats",
      "Demo Atelier",
      "New Season"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-014",
    "sourceProductId": "SKXNZ-014",
    "slug": "future-runner-crossbody",
    "name": "Future Runner Crossbody",
    "brandId": "brand-004",
    "brandSlug": "chrome-district",
    "brandName": "Chrome District",
    "category": "Accessories",
    "subcategory": "Bags",
    "gender": "Unisex",
    "collections": [
      "AI Stylised"
    ],
    "collectionSlug": "ai-stylised",
    "tags": [
      "crossbody",
      "bag",
      "futuristic",
      "chrome"
    ],
    "priceInr": 2599,
    "salePriceInr": 2199,
    "currency": "INR",
    "description": "Crossbody bag concept with a clean chrome-district finish.",
    "shortDescription": "Futurewear crossbody bag.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp"
    ],
    "sourceImageFileNames": [
      "product-future-runner-crossbody-01.png",
      "",
      "",
      ""
    ],
    "availableSizes": [
      "One Size"
    ],
    "availableColors": [
      "Obsidian Black"
    ],
    "stockQuantity": 33,
    "stockStatus": "In Stock",
    "sku": "CHR-BAG-014",
    "status": "Demo",
    "featured": false,
    "homepageDisplay": false,
    "brandPageDisplay": true,
    "searchKeywords": [
      "crossbody",
      "bag",
      "accessories",
      "chrome district",
      "futuristic",
      "chrome",
      "Accessories",
      "Bags",
      "Chrome District",
      "AI Stylised"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  },
  {
    "id": "sku-015",
    "sourceProductId": "SKXNZ-015",
    "slug": "ai-drift-co-ord-set",
    "name": "AI Drift Co-ord Set",
    "brandId": "brand-001",
    "brandSlug": "skxnz",
    "brandName": "SKXNZ",
    "category": "AI Stylised",
    "subcategory": "Co-ord Sets",
    "gender": "Unisex",
    "collections": [
      "AI Stylised"
    ],
    "collectionSlug": "ai-stylised",
    "tags": [
      "co-ord",
      "ai",
      "futuristic",
      "set"
    ],
    "priceInr": 5599,
    "salePriceInr": 4999,
    "currency": "INR",
    "description": "AI-inspired co-ord concept for futurewear discovery.",
    "shortDescription": "AI-styled co-ord set.",
    "image": "/assets/demo/products/product-01.webp",
    "gallery": [
      "/assets/demo/products/product-01.webp"
    ],
    "sourceImageFileNames": [
      "product-ai-drift-coord-01.png",
      "",
      "",
      ""
    ],
    "availableSizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "availableColors": [
      "Ultraviolet Purple"
    ],
    "stockQuantity": 28,
    "stockStatus": "In Stock",
    "sku": "SKXNZ-COR-015",
    "status": "Demo",
    "featured": true,
    "homepageDisplay": true,
    "brandPageDisplay": true,
    "searchKeywords": [
      "ai stylised",
      "coord set",
      "futuristic outfit",
      "skxnz",
      "co-ord",
      "ai",
      "futuristic",
      "set",
      "AI Stylised",
      "Co-ord Sets",
      "SKXNZ"
    ],
    "createdDate": "2026-05-04",
    "dataSource": "sheet"
  }
];
