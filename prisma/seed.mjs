import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const processedDataFiles = {
  masterStore: path.join(repoRoot, "project-data/processed/master-store.seed.json"),
  backendArchitecture: path.join(
    repoRoot,
    "project-data/processed/backend-architecture.json",
  ),
  aiArchitecture: path.join(repoRoot, "project-data/processed/ai-architecture.json"),
};

const demoBuyers = [
  {
    userId: "user_demo_buyer_aarav",
    buyerId: "buyer_demo_aarav",
    profileId: "profile_demo_buyer_aarav",
    email: "aarav@skxnz.local",
    name: "Aarav Malhotra",
    displayName: "Aarav M.",
    city: "Mumbai",
    stylePreference: "Streetwear and signal-led essentials",
    preferredFit: "Relaxed",
    budgetRange: "Under ₹5,000",
    waitlistStatus: "EARLY_SIGNAL",
  },
  {
    userId: "user_demo_buyer_rhea",
    buyerId: "buyer_demo_rhea",
    profileId: "profile_demo_buyer_rhea",
    email: "rhea@skxnz.local",
    name: "Rhea Kapoor",
    displayName: "Rhea K.",
    city: "Delhi",
    stylePreference: "Futurewear and premium accessories",
    preferredFit: "Structured",
    budgetRange: "₹4,000-₹7,000",
    waitlistStatus: "VIP_PREVIEW",
  },
];

const demoAdmin = {
  userId: "user_demo_admin",
  adminId: "admin_demo_01",
  profileId: "profile_demo_admin",
  email: "admin@skxnz.local",
  name: "SKXNZ Admin",
  city: "Bengaluru",
  title: "Marketplace Operator",
};

const demoRider = {
  userId: "user_demo_rider",
  riderId: "rider_demo_01",
  profileId: "profile_demo_rider",
  email: "rider@skxnz.local",
  name: "Signal Rider",
  city: "Mumbai",
  zones: ["Mumbai South", "Mumbai Central"],
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactWhitespace(value) {
  return value.trim().replace(/\s+/g, " ");
}

function mapProductStatus(status) {
  const normalized = (status || "").toLowerCase();

  if (normalized.includes("reject")) {
    return "REJECTED";
  }

  if (normalized.includes("pending")) {
    return "PENDING_REVIEW";
  }

  if (normalized.includes("archive")) {
    return "ARCHIVED";
  }

  return "APPROVED";
}

function mapContentStatus(status) {
  const normalized = (status || "").toLowerCase();

  if (normalized.includes("draft")) {
    return "DRAFT";
  }

  if (normalized.includes("inactive")) {
    return "INACTIVE";
  }

  if (normalized.includes("archive")) {
    return "ARCHIVED";
  }

  return "ACTIVE";
}

function mapInventoryStatus(stockQuantity) {
  if (stockQuantity <= 0) {
    return "OUT_OF_STOCK";
  }

  if (stockQuantity <= 5) {
    return "LOW_STOCK";
  }

  return "IN_STOCK";
}

function mapAiJobType(feature) {
  const normalized = feature.toLowerCase();

  if (normalized.includes("buyer ai assistant")) {
    return "BUYER_ASSISTANT";
  }

  if (normalized.includes("outfit builder")) {
    return "OUTFIT_BUILDER";
  }

  if (normalized.includes("seller product validation")) {
    return "SELLER_VALIDATION";
  }

  if (normalized.includes("admin daily summary")) {
    return "ADMIN_SUMMARY";
  }

  if (normalized.includes("support triage")) {
    return "SUPPORT_TRIAGE";
  }

  if (normalized.includes("visual search")) {
    return "VISUAL_SEARCH";
  }

  if (normalized.includes("try-on")) {
    return "TRY_ON";
  }

  return "STYLIST";
}

function readJsonFile(filePath) {
  return fs.readFile(filePath, "utf8").then((contents) => JSON.parse(contents));
}

function buildDemoSellers(brands) {
  return brands.map((brand, index) => ({
    userId: `user_demo_seller_${brand.slug}`,
    sellerId: `seller_demo_${brand.slug}`,
    profileId: `profile_demo_seller_${brand.slug}`,
    brandId: `brand_${brand.slug}`,
    email: `${brand.slug}@skxnz.local`,
    name: brand.name,
    storeName: brand.name,
    slug: brand.slug,
    city: index % 2 === 0 ? "Mumbai" : "Delhi",
    instagramPage: `@${brand.slug.replace(/-/g, "")}`,
    phoneNumber: `90000000${String(index + 1).padStart(2, "0")}`,
    website: `https://${brand.slug}.skxnz.local`,
  }));
}

function buildVariantSeeds(product, sellerProfileId) {
  const sizes = product.availableSizes?.length ? product.availableSizes : ["One Size"];
  const colors = product.availableColors?.length ? product.availableColors : ["Pearl Cream"];
  const combinations = [];

  for (const size of sizes) {
    for (const color of colors) {
      combinations.push({ size, color });
    }
  }

  const comboCount = Math.max(combinations.length, 1);
  const stockPerVariant = Math.max(1, Math.floor(product.stockQuantity / comboCount));

  return combinations.map(({ size, color }, index) => {
    const variantId = `variant_${product.slug}_${slugify(size)}_${slugify(color)}`;

    return {
      id: variantId,
      productId: product.slug,
      name: `${size} / ${color}`,
      sku: `${product.sku}-${slugify(size).toUpperCase()}-${slugify(color)
        .replace(/-/g, "_")
        .toUpperCase()}`,
      size,
      color,
      material: product.subcategory,
      stock: stockPerVariant,
      priceCents: (product.salePriceInr ?? product.priceInr) * 100,
      currency: "INR",
      isDefault: index === 0,
      createdAt: new Date(product.createdDate),
      updatedAt: new Date(product.createdDate),
      inventory: {
        id: `inventory_${variantId}`,
        productId: product.slug,
        productVariantId: variantId,
        sellerProfileId,
        sku: `${product.sku}-${index + 1}`,
        stockOnHand: stockPerVariant,
        reservedStock: 0,
        availableStock: stockPerVariant,
        status: mapInventoryStatus(stockPerVariant),
        createdAt: new Date(product.createdDate),
        updatedAt: new Date(product.createdDate),
      },
    };
  });
}

function buildPageSearchKeywordSeeds(searchIndex) {
  return searchIndex
    .filter((entry) => entry.type === "page")
    .flatMap((entry) =>
      entry.keywords.map((keyword, index) => ({
        id: `search_page_${slugify(entry.label)}_${index + 1}`,
        keyword: compactWhitespace(keyword),
        entityType: "PAGE",
        pagePath: entry.href,
        weight: 1,
        sourceSheet: "Search Index",
        createdAt: new Date(),
      })),
    );
}

async function clearDatabase() {
  await prisma.sellerProductValidation.deleteMany();
  await prisma.aiAuditLog.deleteMany();
  await prisma.aiUsageLog.deleteMany();
  await prisma.aiJob.deleteMany();
  await prisma.searchKeyword.deleteMany();
  await prisma.carouselSlide.deleteMany();
  await prisma.brandHero.deleteMany();
  await prisma.homepageHero.deleteMany();
  await prisma.review.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.address.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.riderProfile.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  const [masterStore, backendArchitecture, aiArchitecture] = await Promise.all([
    readJsonFile(processedDataFiles.masterStore),
    readJsonFile(processedDataFiles.backendArchitecture),
    readJsonFile(processedDataFiles.aiArchitecture),
  ]);

  await clearDatabase();

  const brands = masterStore.brands;
  const categories = masterStore.categories;
  const collections = masterStore.collections;
  const homepageHeroes = masterStore.homepageHeroes;
  const brandHeroes = masterStore.brandHeroes;
  const carouselSlides = masterStore.carouselSlides;
  const searchIndex = masterStore.searchIndex;
  const products = masterStore.products;

  const demoSellers = buildDemoSellers(brands);

  const allUsers = [
    ...demoBuyers.map((buyer) => ({
      id: buyer.userId,
      email: buyer.email,
      name: buyer.name,
      role: "BUYER",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    ...demoSellers.map((seller) => ({
      id: seller.userId,
      email: seller.email,
      name: seller.name,
      role: "SELLER",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    {
      id: demoAdmin.userId,
      email: demoAdmin.email,
      name: demoAdmin.name,
      role: "ADMIN",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: demoRider.userId,
      email: demoRider.email,
      name: demoRider.name,
      role: "RIDER",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await prisma.user.createMany({ data: allUsers, skipDuplicates: true });

  await prisma.userProfile.createMany({
    data: [
      ...demoBuyers.map((buyer) => ({
        id: buyer.profileId,
        userId: buyer.userId,
        city: buyer.city,
        country: "India",
        stylePreference: buyer.stylePreference,
        preferredFit: buyer.preferredFit,
        budgetRange: buyer.budgetRange,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      ...demoSellers.map((seller) => ({
        id: seller.profileId,
        userId: seller.userId,
        city: seller.city,
        country: "India",
        phoneNumber: seller.phoneNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      {
        id: demoAdmin.profileId,
        userId: demoAdmin.userId,
        city: demoAdmin.city,
        country: "India",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: demoRider.profileId,
        userId: demoRider.userId,
        city: demoRider.city,
        country: "India",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.buyerProfile.createMany({
    data: demoBuyers.map((buyer) => ({
      id: buyer.buyerId,
      userId: buyer.userId,
      displayName: buyer.displayName,
      waitlistJoinedAt: new Date(),
      waitlistStatus: buyer.waitlistStatus,
      notes: "Demo buyer seeded for local marketplace testing.",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  await prisma.brand.createMany({
    data: brands.map((brand) => ({
      id: `brand_${brand.slug}`,
      sourceBrandId: brand.sourceBrandId,
      name: brand.name,
      slug: brand.slug,
      tagline: brand.tagline,
      shortDescription: brand.shortDescription,
      description: brand.description,
      brandCategory: brand.brandCategory,
      logoUrl: brand.logo,
      heroImageUrl: brand.heroImage,
      accentColor: brand.accentColor,
      featured: Boolean(brand.featured),
      topBrand: Boolean(brand.topBrand),
      status: brand.status,
      availabilityNote: brand.availabilityNote,
      isDemo: brand.status.toLowerCase() !== "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  await prisma.sellerProfile.createMany({
    data: demoSellers.map((seller) => ({
      id: seller.sellerId,
      userId: seller.userId,
      brandId: seller.brandId,
      storeName: seller.storeName,
      slug: seller.slug,
      bio: `Demo seller profile for ${seller.storeName}, seeded from the sheet-backed brand catalogue.`,
      website: seller.website,
      instagramPage: seller.instagramPage,
      phoneNumber: seller.phoneNumber,
      city: seller.city,
      gstAvailable: true,
      canShipOrders: true,
      productCount: products.filter((product) => product.brandSlug === seller.slug).length,
      status: "APPROVED",
      applicationNote: "Sheet-backed demo seller profile for backend testing.",
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  await prisma.riderProfile.createMany({
    data: [
      {
        id: demoRider.riderId,
        userId: demoRider.userId,
        displayName: demoRider.name,
        phoneNumber: "9000000099",
        city: demoRider.city,
        status: "ACTIVE",
        assignedZones: demoRider.zones,
        notes: "Demo rider record for delivery workflow testing.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.adminUser.createMany({
    data: [
      {
        id: demoAdmin.adminId,
        userId: demoAdmin.userId,
        title: demoAdmin.title,
        permissionsText:
          "catalog:read,catalog:write,orders:read,returns:read,support:manage,ai:review",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.category.createMany({
    data: categories.map((category) => ({
      id: `category_${category.slug}`,
      sourceCategoryId: category.sourceCategoryId,
      name: category.name,
      displayName: category.displayName,
      slug: category.slug,
      description: category.description,
      imageUrl: category.image,
      href: category.href,
      displayOrder: category.displayOrder,
      featured: Boolean(category.featured),
      status: category.status,
      isDemo: category.status.toLowerCase() !== "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  await prisma.collection.createMany({
    data: collections.map((collection) => ({
      id: `collection_${collection.slug}`,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      imageUrl: collection.image,
      href: collection.href,
      status: collection.status,
      isDemo: collection.status.toLowerCase() !== "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  const sellerIdByBrandSlug = Object.fromEntries(
    demoSellers.map((seller) => [seller.slug, seller.sellerId]),
  );

  await prisma.product.createMany({
    data: products.map((product) => ({
      id: product.slug,
      sourceProductId: product.sourceProductId,
      sellerProfileId: sellerIdByBrandSlug[product.brandSlug] ?? null,
      brandId: `brand_${product.brandSlug}`,
      categoryId: `category_${slugify(product.category)}`,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      subcategory: product.subcategory,
      gender: product.gender,
      shortDescription: product.shortDescription,
      description: product.description,
      priceCents: product.priceInr * 100,
      salePriceCents: product.salePriceInr ? product.salePriceInr * 100 : null,
      currency: product.currency || "INR",
      status: mapProductStatus(product.status),
      inventoryCount: product.stockQuantity,
      stockStatus: mapInventoryStatus(product.stockQuantity),
      isFeatured: Boolean(product.featured),
      homepageDisplay: Boolean(product.homepageDisplay),
      brandPageDisplay: Boolean(product.brandPageDisplay),
      isDemo: true,
      seedSource: product.dataSource || "sheet-demo",
      publishedAt: new Date(product.createdDate),
      launchNote: `Imported from ${masterStore.source} for demo catalogue seeding.`,
      fabric: product.subcategory || "Demo material mapping",
      fit: product.gender || "Demo fit mapping",
      tags: product.tags ?? [],
      availableSizes: product.availableSizes ?? [],
      availableColors: product.availableColors ?? [],
      mainImageUrl: product.image,
      createdAt: new Date(product.createdDate),
      updatedAt: new Date(product.createdDate),
    })),
    skipDuplicates: true,
  });

  const productCollectionRows = [];
  const productImageRows = [];
  const variantRows = [];
  const inventoryRows = [];
  const searchKeywordRows = [];

  for (const product of products) {
    const sellerProfileId = sellerIdByBrandSlug[product.brandSlug] ?? null;
    const variantSeeds = buildVariantSeeds(product, sellerProfileId);

    for (const [index, image] of product.gallery.entries()) {
      productImageRows.push({
        id: `image_${product.slug}_${index + 1}`,
        productId: product.slug,
        url: image,
        altText: `${product.name} image ${index + 1}`,
        sourceFileName: product.sourceImageFileNames?.[index] ?? null,
        sortOrder: index,
        createdAt: new Date(product.createdDate),
        updatedAt: new Date(product.createdDate),
      });
    }

    for (const [index, collectionName] of (product.collections ?? []).entries()) {
      const collection = collections.find(
        (entry) => entry.slug === slugify(collectionName) || entry.name === collectionName,
      );

      if (!collection) {
        continue;
      }

      productCollectionRows.push({
        productId: product.slug,
        collectionId: `collection_${collection.slug}`,
        sortOrder: index,
        isPrimary: index === 0,
        createdAt: new Date(product.createdDate),
      });
    }

    for (const variant of variantSeeds) {
      variantRows.push({
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        material: variant.material,
        stock: variant.stock,
        priceCents: variant.priceCents,
        currency: variant.currency,
        isDefault: variant.isDefault,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      });

      inventoryRows.push(variant.inventory);
    }

    for (const [index, keyword] of (product.searchKeywords ?? []).entries()) {
      searchKeywordRows.push({
        id: `search_product_${product.slug}_${index + 1}`,
        keyword: compactWhitespace(keyword),
        entityType: "PRODUCT",
        productId: product.slug,
        weight: 1,
        sourceSheet: "Products",
        createdAt: new Date(product.createdDate),
      });
    }
  }

  await prisma.productImage.createMany({ data: productImageRows, skipDuplicates: true });
  await prisma.productVariant.createMany({ data: variantRows, skipDuplicates: true });
  await prisma.inventory.createMany({ data: inventoryRows, skipDuplicates: true });
  await prisma.productCollection.createMany({
    data: productCollectionRows,
    skipDuplicates: true,
  });

  for (const brand of brands) {
    for (const [index, keyword] of (brand.searchKeywords ?? []).entries()) {
      searchKeywordRows.push({
        id: `search_brand_${brand.slug}_${index + 1}`,
        keyword: compactWhitespace(keyword),
        entityType: "BRAND",
        brandId: `brand_${brand.slug}`,
        weight: 1,
        sourceSheet: "Brands",
        createdAt: new Date(),
      });
    }
  }

  for (const category of categories) {
    for (const [index, keyword] of (category.searchKeywords ?? []).entries()) {
      searchKeywordRows.push({
        id: `search_category_${category.slug}_${index + 1}`,
        keyword: compactWhitespace(keyword),
        entityType: "CATEGORY",
        categoryId: `category_${category.slug}`,
        weight: 1,
        sourceSheet: "Categories",
        createdAt: new Date(),
      });
    }
  }

  for (const collection of collections) {
    for (const [index, keyword] of (collection.searchKeywords ?? []).entries()) {
      searchKeywordRows.push({
        id: `search_collection_${collection.slug}_${index + 1}`,
        keyword: compactWhitespace(keyword),
        entityType: "COLLECTION",
        collectionId: `collection_${collection.slug}`,
        weight: 1,
        sourceSheet: "Collections",
        createdAt: new Date(),
      });
    }
  }

  searchKeywordRows.push(...buildPageSearchKeywordSeeds(searchIndex));

  await prisma.searchKeyword.createMany({
    data: searchKeywordRows,
    skipDuplicates: true,
  });

  await prisma.homepageHero.createMany({
    data: homepageHeroes.map((hero) => ({
      id: `homepage_${hero.id}`,
      sourceHeroId: hero.sourceHeroId,
      title: hero.title,
      subtitle: hero.subtitle,
      buttonText: hero.buttonText,
      buttonLink: hero.buttonLink,
      imageUrl: hero.image,
      mobileImageUrl: hero.mobileImage,
      displayOrder: hero.displayOrder,
      status: mapContentStatus(hero.status),
      isDemo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  await prisma.brandHero.createMany({
    data: brandHeroes
      .filter((hero) => brands.some((brand) => brand.slug === hero.brandSlug))
      .map((hero) => ({
        id: `brand_hero_${hero.brandSlug}_${hero.displayOrder}`,
        brandId: `brand_${hero.brandSlug}`,
        title: hero.title,
        subtitle: hero.subtitle,
        ctaText: hero.ctaText,
        ctaLink: hero.ctaLink,
        imageUrl: hero.image,
        mobileImageUrl: hero.mobileImage,
        displayOrder: hero.displayOrder,
        status: mapContentStatus(hero.status),
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    skipDuplicates: true,
  });

  await prisma.carouselSlide.createMany({
    data: carouselSlides.map((slide) => ({
      id: `carousel_${slide.id}`,
      sourceSlideId: slide.id,
      carouselName: slide.carouselName,
      placement: slide.carouselName,
      title: slide.title,
      subtitle: slide.subtitle,
      buttonText: slide.buttonText,
      buttonLink: slide.buttonLink,
      imageUrl: slide.image,
      mobileImageUrl: slide.mobileImage,
      displayOrder: slide.displayOrder,
      status: mapContentStatus(slide.status),
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  await prisma.address.createMany({
    data: [
      {
        id: "address_demo_aarav_home",
        userId: demoBuyers[0].userId,
        buyerProfileId: demoBuyers[0].buyerId,
        label: "Home",
        fullName: demoBuyers[0].name,
        phoneNumber: "9876543210",
        line1: "17 Signal Residency",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "address_demo_rhea_studio",
        userId: demoBuyers[1].userId,
        buyerProfileId: demoBuyers[1].buyerId,
        label: "Studio",
        fullName: demoBuyers[1].name,
        phoneNumber: "9876543211",
        line1: "24 Future Lane",
        city: "Delhi",
        state: "Delhi",
        postalCode: "110001",
        country: "India",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  const featuredProducts = products.slice(0, 6);
  const productMap = new Map(products.map((product) => [product.slug, product]));
  const firstVariantByProduct = new Map(
    variantRows.reduce((map, variant) => {
      if (!map.has(variant.productId)) {
        map.set(variant.productId, variant);
      }

      return map;
    }, new Map()),
  );

  await prisma.wishlist.createMany({
    data: [
      {
        id: "wishlist_demo_aarav",
        buyerProfileId: demoBuyers[0].buyerId,
        name: "Saved Signal Picks",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.wishlistItem.createMany({
    data: featuredProducts.slice(0, 2).map((product, index) => {
      const variant = firstVariantByProduct.get(product.slug);

      return {
        id: `wishlist_item_${product.slug}`,
        wishlistId: "wishlist_demo_aarav",
        productId: product.slug,
        productVariantId: variant?.id ?? null,
        selectedSize: variant?.size ?? null,
        selectedColor: variant?.color ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
    skipDuplicates: true,
  });

  await prisma.cart.createMany({
    data: [
      {
        id: "cart_demo_aarav",
        buyerProfileId: demoBuyers[0].buyerId,
        status: "ACTIVE",
        currency: "INR",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.cartItem.createMany({
    data: featuredProducts.slice(0, 2).map((product, index) => {
      const variant = firstVariantByProduct.get(product.slug);
      const unitPriceCents = (product.salePriceInr ?? product.priceInr) * 100;

      return {
        id: `cart_item_${product.slug}`,
        cartId: "cart_demo_aarav",
        productId: product.slug,
        productVariantId: variant?.id ?? null,
        selectedSize: variant?.size ?? null,
        selectedColor: variant?.color ?? null,
        quantity: index + 1,
        unitPriceCents,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
    skipDuplicates: true,
  });

  const orderOneProducts = featuredProducts.slice(0, 2);
  const orderTwoProducts = featuredProducts.slice(2, 4);

  const orderRows = [
    {
      id: "order_demo_001",
      buyerProfileId: demoBuyers[0].buyerId,
      status: "DELIVERED",
      subtotalCents: orderOneProducts.reduce(
        (total, product) => total + (product.salePriceInr ?? product.priceInr) * 100,
        0,
      ),
      shippingCents: 30000,
      notes: "Demo delivered order built from sheet-backed catalogue data.",
      shippingAddressJson: {
        city: "Mumbai",
        note: "Demo operational seed only.",
      },
      placedAt: new Date(),
    },
    {
      id: "order_demo_002",
      buyerProfileId: demoBuyers[1].buyerId,
      status: "RETURN_REQUESTED",
      subtotalCents: orderTwoProducts.reduce(
        (total, product) => total + (product.salePriceInr ?? product.priceInr) * 100,
        0,
      ),
      shippingCents: 30000,
      notes: "Demo return flow order seeded for backend workflow testing.",
      shippingAddressJson: {
        city: "Delhi",
        note: "Demo operational seed only.",
      },
      placedAt: new Date(),
    },
  ].map((order) => ({
    ...order,
    totalCents: order.subtotalCents + order.shippingCents,
    currency: "INR",
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await prisma.order.createMany({ data: orderRows, skipDuplicates: true });

  const orderItemRows = [];

  for (const [orderIndex, orderProducts] of [orderOneProducts, orderTwoProducts].entries()) {
    const orderId = orderIndex === 0 ? "order_demo_001" : "order_demo_002";

    for (const product of orderProducts) {
      const variant = firstVariantByProduct.get(product.slug);
      const unitPriceCents = (product.salePriceInr ?? product.priceInr) * 100;
      orderItemRows.push({
        id: `order_item_${orderId}_${product.slug}`,
        orderId,
        productId: product.slug,
        productVariantId: variant?.id ?? null,
        sellerProfileId: sellerIdByBrandSlug[product.brandSlug] ?? null,
        selectedSize: variant?.size ?? null,
        selectedColor: variant?.color ?? null,
        quantity: 1,
        unitPriceCents,
        lineTotalCents: unitPriceCents,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  await prisma.orderItem.createMany({ data: orderItemRows, skipDuplicates: true });

  await prisma.payment.createMany({
    data: orderRows.map((order, index) => ({
      id: `payment_${order.id}`,
      orderId: order.id,
      provider: "demo_provider",
      providerReference: `demo-ref-${index + 1}`,
      status: index === 0 ? "PAID" : "NOT_CONNECTED",
      amountCents: order.totalCents,
      currency: "INR",
      notes: "No real card details stored. Demo provider reference only.",
      paidAt: index === 0 ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  await prisma.shipment.createMany({
    data: [
      {
        id: "shipment_demo_001",
        orderId: "order_demo_001",
        riderProfileId: demoRider.riderId,
        carrier: "SKXNZ Demo Dispatch",
        trackingNumber: "SKXNZ-DEMO-001",
        status: "DELIVERED",
        originCity: "Mumbai",
        destinationCity: "Mumbai",
        pickupScheduledAt: new Date(),
        shippedAt: new Date(),
        deliveredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "shipment_demo_002",
        orderId: "order_demo_002",
        riderProfileId: demoRider.riderId,
        carrier: "SKXNZ Demo Dispatch",
        trackingNumber: "SKXNZ-DEMO-002",
        status: "OUT_FOR_DELIVERY",
        originCity: "Mumbai",
        destinationCity: "Delhi",
        pickupScheduledAt: new Date(),
        shippedAt: new Date(),
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.shipmentEvent.createMany({
    data: [
      {
        id: "shipment_event_demo_001",
        shipmentId: "shipment_demo_001",
        status: "DELIVERED",
        note: "Delivered in demo seed flow.",
        city: "Mumbai",
        eventAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: "shipment_event_demo_002",
        shipmentId: "shipment_demo_002",
        status: "OUT_FOR_DELIVERY",
        note: "Out for delivery in demo seed flow.",
        city: "Delhi",
        eventAt: new Date(),
        createdAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.returnRequest.createMany({
    data: [
      {
        id: "return_demo_001",
        orderId: "order_demo_002",
        buyerProfileId: demoBuyers[1].buyerId,
        reason: "Demo return request created from backend workflow planning.",
        issueType: "Size / fit issue",
        photoProofUrl: null,
        message: "Sheet-backed demo return request for workflow testing.",
        status: "REQUESTED",
        requestedAt: new Date(),
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  const returnOrderItem = orderItemRows.find((item) => item.orderId === "order_demo_002");

  if (returnOrderItem) {
    await prisma.returnItem.createMany({
      data: [
        {
          id: "return_item_demo_001",
          returnRequestId: "return_demo_001",
          orderItemId: returnOrderItem.id,
          quantity: 1,
          conditionNote: "Demo item return entry seeded from workflow planning.",
          createdAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.refund.createMany({
    data: [
      {
        id: "refund_demo_001",
        paymentId: "payment_order_demo_002",
        orderId: "order_demo_002",
        returnRequestId: "return_demo_001",
        provider: "demo_provider",
        providerReference: "refund-demo-001",
        amountCents:
          orderRows.find((order) => order.id === "order_demo_002")?.subtotalCents ?? 0,
        currency: "INR",
        status: "PENDING",
        reason: "Return request created in demo seed flow.",
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.supportTicket.createMany({
    data: [
      {
        id: "ticket_demo_001",
        userId: demoBuyers[1].userId,
        buyerProfileId: demoBuyers[1].buyerId,
        sellerProfileId: null,
        orderId: "order_demo_002",
        assignedAdminUserId: demoAdmin.adminId,
        requesterRole: "BUYER",
        subject: "Return status check",
        message: "Demo support ticket linked to the seeded return flow.",
        status: "OPEN",
        priority: "MEDIUM",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.supportMessage.createMany({
    data: [
      {
        id: "ticket_message_demo_001",
        ticketId: "ticket_demo_001",
        senderUserId: demoBuyers[1].userId,
        senderRole: "BUYER",
        message: "Checking the status of my demo return request.",
        isInternal: false,
        createdAt: new Date(),
      },
      {
        id: "ticket_message_demo_002",
        ticketId: "ticket_demo_001",
        senderUserId: demoAdmin.userId,
        senderRole: "ADMIN",
        message: "Marked for internal review in the seeded support workflow.",
        isInternal: true,
        createdAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  if (orderItemRows[0]) {
    await prisma.review.createMany({
      data: [
        {
          id: "review_demo_001",
          productId: orderItemRows[0].productId,
          buyerProfileId: demoBuyers[0].buyerId,
          orderItemId: orderItemRows[0].id,
          rating: 5,
          title: "Demo premium fit",
          body: "Sheet-seeded demo review for backend trust workflows.",
          status: "PUBLISHED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });
  }

  const aiJobSeeds = aiArchitecture.ai_modules.slice(0, 4).map((module, index) => ({
    id: `ai_job_${slugify(module.id)}`,
    createdByUserId:
      module.userType.toLowerCase().includes("buyer")
        ? demoBuyers[0].userId
        : module.userType.toLowerCase().includes("seller")
          ? demoSellers[0].userId
          : demoAdmin.userId,
    sellerProfileId:
      module.userType.toLowerCase().includes("seller") ||
      module.userType.toLowerCase().includes("admin")
        ? demoSellers[0].sellerId
        : null,
    productId: products[0]?.slug ?? null,
    jobType: mapAiJobType(module.feature),
    status: "COMPLETED",
    provider: "demo-ai",
    providerJobId: `demo-ai-${index + 1}`,
    inputText: module.purpose,
    outputText: `Seeded from AI module ${module.id} for backend preparation.`,
    inputRef: module.id,
    outputRef: `output-${module.id}`,
    errorMessage: null,
    startedAt: new Date(),
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await prisma.aiJob.createMany({ data: aiJobSeeds, skipDuplicates: true });

  await prisma.aiUsageLog.createMany({
    data: aiJobSeeds.map((job, index) => ({
      id: `ai_usage_${job.id}`,
      userId: job.createdByUserId,
      aiJobId: job.id,
      role:
        index === 0
          ? "BUYER"
          : index === 1
            ? "BUYER"
            : index === 2
              ? "SELLER"
              : "ADMIN",
      feature: job.jobType,
      model: "demo-local",
      inputTokens: 120 + index * 10,
      outputTokens: 220 + index * 10,
      costEstimate: 0,
      createdAt: new Date(),
    })),
    skipDuplicates: true,
  });

  await prisma.aiAuditLog.createMany({
    data: aiJobSeeds.map((job, index) => ({
      id: `ai_audit_${job.id}`,
      aiJobId: job.id,
      actorType: index === 2 ? "SELLER" : index === 3 ? "ADMIN" : "AI",
      actorId:
        index === 2
          ? demoSellers[0].sellerId
          : index === 3
            ? demoAdmin.adminId
            : "system-ai",
      feature: job.jobType,
      inputSummary: job.inputText,
      outputSummary: job.outputText,
      actionTaken: "seeded-demo-record",
      riskScore: index === 2 ? 0.42 : 0.08,
      metadata: {
        source: aiArchitecture.source,
      },
      createdAt: new Date(),
    })),
    skipDuplicates: true,
  });

  await prisma.sellerProductValidation.createMany({
    data: [
      {
        id: "seller_validation_demo_001",
        sellerProfileId: demoSellers[0].sellerId,
        productId: products[0]?.slug ?? null,
        productDraftId: products[0]?.sourceProductId ?? null,
        aiJobId: aiJobSeeds.find((job) => job.jobType === "SELLER_VALIDATION")?.id ?? null,
        missingFields: {
          note: "No blocking missing fields. Seeded from AI planning workflow.",
        },
        suggestedTags: products[0]?.tags ?? [],
        riskScore: 0.18,
        status: "NEEDS_REVIEW",
        reviewNote: "Demo seller validation seed from AI planning pack.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.auditLog.createMany({
    data: [
      {
        id: "audit_demo_catalog_import",
        adminUserId: demoAdmin.adminId,
        actorType: "ADMIN",
        entityType: "catalog_import",
        entityId: "sheet-seed",
        action: "seed_import_completed",
        summary: `Catalog and backend seed data imported from ${masterStore.source} and ${backendArchitecture.source}.`,
        metadata: {
          generatedAt: masterStore.generatedAt,
          productCount: products.length,
          brandCount: brands.length,
        },
        createdAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log(
    `Seeded ${products.length} products, ${brands.length} brands, ${categories.length} categories, and ${backendArchitecture.backend_tables.length} backend table mappings.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
