#!/usr/bin/env python3
"""
Import SKXNZ spreadsheet planning data into structured TypeScript data modules.

Primary source of truth:
- project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx
- project-data/source-sheets/SKXNZ_BACKEND_ARCHITECTURE_PACK_FINAL.xlsx
- project-data/source-sheets/SKXNZ_AI_OPERATING_SYSTEM_PACK_FINAL.xlsx

Fallback if direct XLSX parsing is not available:
Export the following tabs to CSV inside project-data/csv/ and map them with the
same column names used below.

Master store workbook:
- Products
- Brands
- Categories
- Homepage Heroes
- Brand Page Heroes
- Carousels

Backend workbook:
- Backend Tables
- API Routes
- Seed Mapping

AI workbook:
- AI Modules
- Data Sources
- AI Tables
- API Routes
- Outfit Builder
- Buyer Assistant
- Prompt Rules
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

try:
    from openpyxl import load_workbook
except ModuleNotFoundError as exc:
    raise SystemExit(
        "openpyxl is required to parse the XLSX source sheets. "
        "If direct XLSX parsing is unavailable, export the documented tabs to "
        "project-data/csv/ first."
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHEETS = ROOT / "project-data" / "source-sheets"
OUTPUT_DIR = ROOT / "src" / "data"


MASTER_STORE_FILE = SOURCE_SHEETS / "SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx"
BACKEND_FILE = SOURCE_SHEETS / "SKXNZ_BACKEND_ARCHITECTURE_PACK_FINAL.xlsx"
AI_FILE = SOURCE_SHEETS / "SKXNZ_AI_OPERATING_SYSTEM_PACK_FINAL.xlsx"


FALLBACK_PRODUCT_IMAGE = "/assets/demo/products/product-01.webp"
FALLBACK_BRAND_HERO = "/assets/demo/brands/skxnz/hero.webp"
FALLBACK_BRAND_LOGO = "/assets/brand/skxnz/logo-mark-transparent.png"
FALLBACK_CATEGORY_IMAGE = "/assets/demo/uploaded/editorial/monochrome-fit.png"
FALLBACK_EDITORIAL_IMAGE = "/assets/demo/uploaded/editorial/afterlast-duo.png"


PRODUCT_MEDIA_MAP = {
    "SKXNZ-001": {
        "image": "/assets/demo/uploaded/products/skxnz-graphic-tee.png",
        "gallery": [
            "/assets/demo/uploaded/products/skxnz-graphic-tee.png",
            "/assets/demo/products/product-01.webp",
            "/assets/demo/products/product-03.webp",
            "/assets/demo/uploaded/products/skxnz-back-tee.png",
        ],
    },
    "SKXNZ-002": {
        "image": "/assets/demo/uploaded/editorial/afterlast-duo.png",
        "gallery": [
            "/assets/demo/uploaded/editorial/afterlast-duo.png",
            "/assets/demo/products/product-02.webp",
            "/assets/demo/products/product-07.webp",
            "/assets/demo/uploaded/editorial/fire-shirt-look.png",
        ],
    },
    "SKXNZ-003": {
        "image": "/assets/demo/products/product-01.webp",
        "gallery": [
            "/assets/demo/products/product-01.webp",
            "/assets/demo/uploaded/products/skxnz-back-tee.png",
            "/assets/demo/products/product-07.webp",
            "/assets/demo/uploaded/editorial/monochrome-fit.png",
        ],
    },
    "SKXNZ-004": {
        "image": "/assets/demo/products/product-06.webp",
        "gallery": [
            "/assets/demo/products/product-06.webp",
            "/assets/demo/products/product-05.webp",
            "/assets/demo/uploaded/categories/streetwear-chain.png",
            "/assets/demo/uploaded/editorial/afterlast-duo.png",
        ],
    },
    "SKXNZ-005": {
        "image": "/assets/demo/uploaded/editorial/chrome-queen.png",
        "gallery": [
            "/assets/demo/uploaded/editorial/chrome-queen.png",
            "/assets/demo/products/product-05.webp",
            "/assets/demo/products/product-09.webp",
            "/assets/demo/uploaded/editorial/afterlast-smoke.png",
        ],
    },
}


BRAND_ASSET_MAP = {
    "skxnz": {
        "logo": "/assets/brand/skxnz/logo-mark-transparent.png",
        "hero": "/assets/demo/brands/skxnz/hero.webp",
        "accentColor": "#5A1F2E",
        "tagline": "WEAR THE SIGNAL.",
    },
    "demo-atelier": {
        "logo": "/assets/demo/brands/pulse-atelier/logo.webp",
        "hero": "/assets/demo/uploaded/editorial/afterlast-duo.png",
        "accentColor": "#B97D5A",
        "tagline": "Demo luxury direction for marketplace testing.",
    },
    "signal-studio": {
        "logo": "/assets/demo/brands/noir-signal/logo.webp",
        "hero": "/assets/demo/uploaded/editorial/afterlast-smoke.png",
        "accentColor": "#2F6F73",
        "tagline": "Streetwear-coded signal edits for preview testing.",
    },
    "chrome-district": {
        "logo": "/assets/demo/brands/chrome-lab/logo.webp",
        "hero": "/assets/demo/uploaded/editorial/chrome-queen.png",
        "accentColor": "#231F1B",
        "tagline": "Accessories and lifestyle concepts for demo discovery.",
    },
}


CATEGORY_IMAGE_MAP = {
    "men": "/assets/demo/uploaded/editorial/monochrome-fit.png",
    "woman": "/assets/demo/uploaded/editorial/afterlast-duo.png",
    "perfume": "/assets/demo/uploaded/editorial/chrome-queen.png",
    "accessories": "/assets/demo/uploaded/categories/streetwear-chain.png",
    "streetwear": "/assets/demo/uploaded/editorial/afterlast-smoke.png",
    "shoes": "/assets/demo/uploaded/editorial/fire-shirt-look.png",
}


CATEGORY_DISPLAY_NAME_MAP = {
    "woman": "Women",
    "perfume": "Perfumes",
    "footwear": "Shoes",
}


HOMEPAGE_HERO_IMAGE_MAP = {
    "HERO-001": {
        "image": "/assets/demo/uploaded/editorial/fire-shirt-look.png",
        "mobileImage": "/assets/demo/uploaded/editorial/fire-shirt-look.png",
    },
    "HERO-002": {
        "image": "/assets/demo/uploaded/products/afterlast-portrait-shirt.png",
        "mobileImage": "/assets/demo/uploaded/products/afterlast-portrait-shirt.png",
    },
    "HERO-003": {
        "image": "/assets/demo/uploaded/products/skxnz-back-tee.png",
        "mobileImage": "/assets/demo/uploaded/products/skxnz-back-tee.png",
    },
}


CAROUSEL_IMAGE_MAP = {
    "CAR-001": {
        "image": "/assets/demo/uploaded/editorial/fire-shirt-look.png",
        "mobileImage": "/assets/demo/uploaded/editorial/fire-shirt-look.png",
    },
    "CAR-002": {
        "image": "/assets/demo/uploaded/products/afterlast-portrait-shirt.png",
        "mobileImage": "/assets/demo/uploaded/products/afterlast-portrait-shirt.png",
    },
    "CAR-003": {
        "image": "/assets/demo/uploaded/products/skxnz-back-tee.png",
        "mobileImage": "/assets/demo/uploaded/products/skxnz-back-tee.png",
    },
    "CAR-004": {
        "image": "/assets/demo/uploaded/products/skxnz-graphic-tee.png",
        "mobileImage": "/assets/demo/uploaded/products/skxnz-graphic-tee.png",
    },
}


COLLECTION_METADATA_MAP = {
    "wear-the-signal": {
        "description": "Core SKXNZ signal-led essentials and futurewear foundations.",
        "image": "/assets/demo/uploaded/products/skxnz-graphic-tee.png",
        "searchKeywords": ["wear the signal", "signal", "skxnz signature"],
    },
    "new-season": {
        "description": "Fresh season edits curated for sharper daily rotation.",
        "image": "/assets/demo/uploaded/products/afterlast-portrait-shirt.png",
        "searchKeywords": ["new season", "season picks", "fresh drops"],
    },
    "limited-edition": {
        "description": "Curated limited edit pieces for high-signal wardrobes.",
        "image": "/assets/demo/uploaded/editorial/afterlast-duo.png",
        "searchKeywords": ["limited edition", "limited drops", "drop zone"],
    },
    "ai-stylised": {
        "description": "Editorial SKXNZ concepts prepared for future AI-assisted discovery.",
        "image": "/assets/demo/uploaded/editorial/chrome-queen.png",
        "searchKeywords": ["ai stylised", "ai styled", "futurewear concepts"],
    },
}


PRODUCT_STYLE_OVERRIDES = {
    "SKXNZ-001": {
        "itemType": "T-Shirts",
        "fitType": "Oversized",
        "occasionTags": ["daily", "streetwear", "casual"],
        "styleTags": ["oversized", "streetwear", "premium", "signal"],
    },
    "SKXNZ-002": {
        "itemType": "Jackets",
        "fitType": "Cropped",
        "occasionTags": ["editorial", "evening", "fashion"],
        "styleTags": ["cropped", "futurewear", "premium", "new season"],
    },
    "SKXNZ-003": {
        "itemType": "Hoodies",
        "fitType": "Relaxed",
        "occasionTags": ["daily", "streetwear", "layering"],
        "styleTags": ["hoodie", "chrome", "streetwear", "unisex"],
    },
    "SKXNZ-004": {
        "itemType": "Bags",
        "fitType": "Accessory",
        "occasionTags": ["party", "editorial", "evening"],
        "styleTags": ["bag", "luxury", "statement", "limited edition"],
    },
    "SKXNZ-005": {
        "itemType": "Fragrance",
        "fitType": "Accessory",
        "occasionTags": ["daily", "evening", "signature"],
        "styleTags": ["perfume", "luxury", "fragrance", "ai stylised"],
    },
}


def slugify(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def normalize_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    return str(value).strip()


def split_csv_list(value) -> list[str]:
    text = normalize_text(value)
    if not text:
        return []
    return [item.strip() for item in text.split(",") if item and item.strip()]


def parse_bool(value) -> bool:
    return normalize_text(value).lower() in {"yes", "true", "1", "active"}


def parse_status(value) -> str:
    return normalize_text(value) or "Demo"


def stock_status(quantity: int) -> str:
    if quantity <= 0:
        return "Out Of Stock"
    if quantity <= 10:
        return "Low Stock"
    return "In Stock"


def color_family(values: list[str]) -> list[str]:
    families: list[str] = []
    for value in values:
        lowered = value.lower()
        if "black" in lowered:
            families.append("Black")
        elif "white" in lowered or "pearl" in lowered:
            families.append("White")
        elif "silver" in lowered or "chrome" in lowered:
            families.append("Silver")
        elif "magenta" in lowered or "pink" in lowered:
            families.append("Magenta")
        elif "navy" in lowered or "blue" in lowered:
            families.append("Blue")
        else:
            families.append(value)
    return list(dict.fromkeys(families))


def budget_range(price_inr: int) -> str:
    if price_inr < 2500:
        return "Under ₹2,500"
    if price_inr < 4000:
        return "₹2,500-₹3,999"
    if price_inr < 6000:
        return "₹4,000-₹5,999"
    return "₹6,000+"


def shop_query_href(query: str) -> str:
    return f"/shop?q={quote(query)}"


def resolve_internal_link(value) -> str:
    text = normalize_text(value)
    if not text:
        return "/shop"
    if text.startswith("/categories/"):
        slug = text.rsplit("/", 1)[-1]
        label_map = {
            "new-season": "New Season",
            "ai-stylised": "AI Stylised",
            "limited-edition": "Limited Edition",
            "wear-the-signal": "Wear The Signal",
        }
        return shop_query_href(label_map.get(slug, slug.replace("-", " ")))
    return text


def load_sheet_records(workbook_path: Path, sheet_name: str, header_first_cell: str) -> list[dict[str, object]]:
    workbook = load_workbook(workbook_path, data_only=True)
    worksheet = workbook[sheet_name]
    header_row = None
    for row in worksheet.iter_rows(values_only=True):
        if normalize_text(row[0]) == header_first_cell:
            header_row = [normalize_text(cell) for cell in row]
            break

    if header_row is None:
        raise ValueError(f"Header row not found for {sheet_name} in {workbook_path.name}")

    records: list[dict[str, object]] = []
    header_indexes = [index for index, key in enumerate(header_row) if key]

    reading = False
    for row in worksheet.iter_rows(values_only=True):
        if not reading:
            if normalize_text(row[0]) == header_first_cell:
                reading = True
            continue

        first_value = normalize_text(row[0]) if row else ""
        if not first_value:
            continue

        record: dict[str, object] = {}
        for index in header_indexes:
            key = header_row[index]
            record[key] = row[index] if index < len(row) else None
        records.append(record)

    return records


def resolve_brand_slug(name: str, brand_rows_by_name: dict[str, dict[str, object]]) -> str:
    row = brand_rows_by_name.get(name)
    if row:
        return normalize_text(row.get("Brand Slug"))
    return slugify(name)


def resolve_brand_id(name: str, brand_rows_by_name: dict[str, dict[str, object]]) -> str:
    row = brand_rows_by_name.get(name)
    if row:
        value = normalize_text(row.get("Brand ID"))
        if value:
            return value.lower().replace("br-", "brand-")
    return f"brand-{resolve_brand_slug(name, brand_rows_by_name)}"


def resolve_brand_assets(slug: str) -> dict[str, str]:
    return BRAND_ASSET_MAP.get(
        slug,
        {
            "logo": FALLBACK_BRAND_LOGO,
            "hero": FALLBACK_BRAND_HERO,
            "accentColor": "#5A1F2E",
            "tagline": "Demo brand preview for SKXNZ marketplace testing.",
        },
    )


def write_ts_module(path: Path, content: str) -> None:
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def ts_dump(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def build_master_store_data() -> dict[str, object]:
    product_rows = load_sheet_records(MASTER_STORE_FILE, "Products", "Product ID")
    brand_rows = load_sheet_records(MASTER_STORE_FILE, "Brands", "Brand ID")
    category_rows = load_sheet_records(MASTER_STORE_FILE, "Categories", "Category ID")
    homepage_hero_rows = load_sheet_records(MASTER_STORE_FILE, "Homepage Heroes", "Hero ID")
    brand_page_hero_rows = load_sheet_records(MASTER_STORE_FILE, "Brand Page Heroes", "Brand Name")
    carousel_rows = load_sheet_records(MASTER_STORE_FILE, "Carousels", "Carousel ID")

    brand_rows_by_name = {
        normalize_text(row.get("Brand Name")): row for row in brand_rows if normalize_text(row.get("Brand Name"))
    }

    structured_products = []
    products_by_brand: dict[str, list[str]] = defaultdict(list)
    product_keyword_index: list[dict[str, object]] = []

    for row in product_rows:
        product_id = normalize_text(row.get("Product ID"))
        slug = slugify(normalize_text(row.get("Product Name")))
        brand_name = normalize_text(row.get("Brand Name"))
        brand_slug = resolve_brand_slug(brand_name, brand_rows_by_name)
        brand_id = resolve_brand_id(brand_name, brand_rows_by_name)
        category = normalize_text(row.get("Category"))
        subcategory = normalize_text(row.get("Subcategory"))
        collection_name = normalize_text(row.get("Collection"))
        collection_slug = slugify(collection_name)
        tags = split_csv_list(row.get("Tags"))
        search_keywords = split_csv_list(row.get("Search Keywords"))
        sizes = split_csv_list(row.get("Available Sizes"))
        colors = split_csv_list(row.get("Available Colors"))
        stock_quantity = int(row.get("Stock Quantity") or 0)
        media = PRODUCT_MEDIA_MAP.get(product_id, {"image": FALLBACK_PRODUCT_IMAGE, "gallery": [FALLBACK_PRODUCT_IMAGE]})

        product_record = {
            "id": product_id.lower().replace("skxnz-", "sku-"),
            "sourceProductId": product_id,
            "slug": slug,
            "name": normalize_text(row.get("Product Name")),
            "brandId": brand_id,
            "brandSlug": brand_slug,
            "brandName": brand_name,
            "category": category,
            "subcategory": subcategory,
            "gender": normalize_text(row.get("Gender")) or "Unisex",
            "collections": [collection_name] if collection_name else [],
            "collectionSlug": collection_slug,
            "tags": tags,
            "priceInr": int(row.get("Price") or 0),
            "salePriceInr": int(row.get("Sale Price") or 0) or None,
            "currency": normalize_text(row.get("Currency")) or "INR",
            "description": normalize_text(row.get("Description")),
            "shortDescription": normalize_text(row.get("Short Description")),
            "image": media["image"],
            "gallery": media["gallery"],
            "sourceImageFileNames": [
                normalize_text(row.get("Main Image File Name")),
                normalize_text(row.get("Image 2")),
                normalize_text(row.get("Image 3")),
                normalize_text(row.get("Image 4")),
            ],
            "availableSizes": sizes,
            "availableColors": colors,
            "stockQuantity": stock_quantity,
            "stockStatus": stock_status(stock_quantity),
            "sku": normalize_text(row.get("SKU")),
            "status": parse_status(row.get("Status")),
            "featured": parse_bool(row.get("Featured")),
            "homepageDisplay": parse_bool(row.get("Homepage Display")),
            "brandPageDisplay": parse_bool(row.get("Brand Page Display")),
            "searchKeywords": list(dict.fromkeys(search_keywords + tags + [category, subcategory, brand_name, collection_name])),
            "createdDate": normalize_text(row.get("Created Date")),
            "dataSource": "sheet",
        }
        structured_products.append(product_record)
        products_by_brand[brand_slug].append(product_record["id"])
        product_keyword_index.append(
            {
                "id": f"product-{product_record['id']}",
                "type": "product",
                "label": product_record["name"],
                "href": shop_query_href(product_record["name"]),
                "keywords": product_record["searchKeywords"],
                "image": product_record["image"],
                "description": f"{brand_name} • {category}",
                "status": product_record["status"],
                "dataSource": "sheet",
            }
        )

    structured_brands = []
    for row in brand_rows:
        brand_name = normalize_text(row.get("Brand Name"))
        if not brand_name:
            continue
        slug = normalize_text(row.get("Brand Slug"))
        assets = resolve_brand_assets(slug)
        related_categories = sorted(
            {
                product["category"]
                for product in structured_products
                if product["brandSlug"] == slug
            }
        )
        if not related_categories:
            related_categories = [normalize_text(row.get("Brand Category"))]

        brand_record = {
            "id": resolve_brand_id(brand_name, brand_rows_by_name),
            "sourceBrandId": normalize_text(row.get("Brand ID")),
            "name": brand_name,
            "slug": slug,
            "tagline": assets["tagline"],
            "shortDescription": normalize_text(row.get("Brand Description")),
            "description": normalize_text(row.get("Brand Description")),
            "brandCategory": normalize_text(row.get("Brand Category")),
            "categories": [entry for entry in related_categories if entry],
            "logo": assets["logo"],
            "heroImage": assets["hero"],
            "accentColor": assets["accentColor"],
            "featured": parse_bool(row.get("Featured Brand")),
            "topBrand": parse_bool(row.get("Top Brand")),
            "searchKeywords": split_csv_list(row.get("Search Keywords")),
            "status": parse_status(row.get("Status")),
            "availabilityNote": (
                "SKXNZ brand content planned from source sheets."
                if slug == "skxnz"
                else "Demo marketplace brand imported from planning data."
            ),
            "productIds": products_by_brand.get(slug, []),
            "dataSource": "sheet",
        }
        structured_brands.append(brand_record)

    structured_categories = []
    for row in category_rows:
        slug = normalize_text(row.get("Slug"))
        category_record = {
            "id": normalize_text(row.get("Category ID")).lower().replace("cat-", "category-"),
            "sourceCategoryId": normalize_text(row.get("Category ID")),
            "name": normalize_text(row.get("Category Name")),
            "displayName": CATEGORY_DISPLAY_NAME_MAP.get(
                slug,
                normalize_text(row.get("Category Name")),
            ),
            "slug": slug,
            "description": normalize_text(row.get("Description")),
            "image": CATEGORY_IMAGE_MAP.get(slug, FALLBACK_CATEGORY_IMAGE),
            "href": shop_query_href(normalize_text(row.get("Category Name"))),
            "displayOrder": int(row.get("Display Order") or 0),
            "featured": parse_bool(row.get("Featured")),
            "searchKeywords": split_csv_list(row.get("Search Keywords")),
            "status": parse_status(row.get("Status")),
            "dataSource": "sheet",
        }
        structured_categories.append(category_record)

    homepage_heroes = []
    for row in homepage_hero_rows:
        hero_id = normalize_text(row.get("Hero ID"))
        assets = HOMEPAGE_HERO_IMAGE_MAP.get(
            hero_id,
            {"image": FALLBACK_EDITORIAL_IMAGE, "mobileImage": FALLBACK_EDITORIAL_IMAGE},
        )
        homepage_heroes.append(
            {
                "id": hero_id.lower(),
                "sourceHeroId": hero_id,
                "title": normalize_text(row.get("Title")),
                "subtitle": normalize_text(row.get("Subtitle")),
                "tagline": normalize_text(row.get("Tagline")) or "SKXNZ",
                "buttonText": normalize_text(row.get("Button Text")),
                "buttonLink": resolve_internal_link(row.get("Button Link")),
                "image": assets["image"],
                "mobileImage": assets["mobileImage"],
                "sourceImageFileName": normalize_text(row.get("Image File Name")),
                "sourceMobileImageFileName": normalize_text(row.get("Mobile Image File Name")),
                "displayOrder": int(row.get("Display Order") or 0),
                "status": parse_status(row.get("Status")),
                "dataSource": "sheet",
            }
        )

    brand_page_heroes = []
    for row in brand_page_hero_rows:
        slug = normalize_text(row.get("Brand Slug"))
        brand_assets = resolve_brand_assets(slug)
        hero_image = brand_assets["hero"]
        brand_page_heroes.append(
            {
                "id": f"brand-hero-{slug}",
                "brandName": normalize_text(row.get("Brand Name")),
                "brandSlug": slug,
                "title": normalize_text(row.get("Hero Title")),
                "subtitle": normalize_text(row.get("Hero Subtitle")),
                "image": hero_image,
                "mobileImage": hero_image,
                "sourceImageFileName": normalize_text(row.get("Hero Image")),
                "sourceMobileImageFileName": normalize_text(row.get("Mobile Hero Image")),
                "ctaText": normalize_text(row.get("CTA Text")) or "Shop Brand",
                "ctaLink": resolve_internal_link(row.get("CTA Link")) or f"/brands/{slug}",
                "displayOrder": int(row.get("Display Order") or 0),
                "status": parse_status(row.get("Status")),
                "dataSource": "sheet",
            }
        )

    carousel_slides = []
    for row in carousel_rows:
        carousel_id = normalize_text(row.get("Carousel ID"))
        assets = CAROUSEL_IMAGE_MAP.get(
            carousel_id,
            {"image": FALLBACK_EDITORIAL_IMAGE, "mobileImage": FALLBACK_EDITORIAL_IMAGE},
        )
        carousel_slides.append(
            {
                "id": carousel_id.lower(),
                "carouselName": normalize_text(row.get("Carousel Name")),
                "title": normalize_text(row.get("Slide Title")),
                "subtitle": normalize_text(row.get("Slide Subtitle")),
                "image": assets["image"],
                "mobileImage": assets["mobileImage"],
                "sourceImageFileName": normalize_text(row.get("Image File Name")),
                "buttonText": normalize_text(row.get("Button Text")),
                "buttonLink": resolve_internal_link(row.get("Button Link")),
                "displayOrder": int(row.get("Display Order") or 0),
                "status": parse_status(row.get("Status")),
                "dataSource": "sheet",
            }
        )

    collections_by_slug: dict[str, dict[str, object]] = {}
    for product in structured_products:
        for collection_name in product["collections"]:
            slug = slugify(collection_name)
            meta = COLLECTION_METADATA_MAP.get(
                slug,
                {
                    "description": f"{collection_name} collection from SKXNZ planning data.",
                    "image": FALLBACK_EDITORIAL_IMAGE,
                    "searchKeywords": [collection_name.lower()],
                },
            )
            collection_record = collections_by_slug.setdefault(
                slug,
                {
                    "id": f"collection-{slug}",
                    "name": collection_name,
                    "slug": slug,
                    "description": meta["description"],
                    "image": meta["image"],
                    "href": shop_query_href(collection_name),
                    "searchKeywords": meta["searchKeywords"],
                    "productIds": [],
                    "status": "Demo",
                    "dataSource": "sheet-derived",
                },
            )
            collection_record["productIds"].append(product["id"])

    structured_collections = sorted(
        collections_by_slug.values(),
        key=lambda entry: entry["name"],
    )

    ai_outfit_metadata = []
    for product in structured_products:
        overrides = PRODUCT_STYLE_OVERRIDES.get(product["sourceProductId"], {})
        ai_outfit_metadata.append(
            {
                "productId": product["id"],
                "slug": product["slug"],
                "itemType": overrides.get("itemType", product["subcategory"]),
                "styleTags": overrides.get("styleTags", product["tags"]),
                "occasionTags": overrides.get("occasionTags", ["daily"]),
                "colorFamily": color_family(product["availableColors"]),
                "budgetRange": budget_range(product["priceInr"]),
                "fitType": overrides.get("fitType", "Regular"),
                "gender": product["gender"],
                "availableSizes": product["availableSizes"],
                "stockStatus": product["stockStatus"],
                "dataSource": "sheet-derived",
            }
        )

    search_index = []
    search_index.extend(product_keyword_index)
    for brand in structured_brands:
        search_index.append(
            {
                "id": f"brand-{brand['slug']}",
                "type": "brand",
                "label": brand["name"],
                "href": f"/brands/{brand['slug']}",
                "keywords": list(dict.fromkeys(brand["searchKeywords"] + brand["categories"] + [brand["name"], brand["slug"]])),
                "image": brand["logo"],
                "description": "Brand",
                "status": brand["status"],
                "dataSource": brand["dataSource"],
            }
        )
    for category in structured_categories:
        search_index.append(
            {
                "id": f"category-{category['slug']}",
                "type": "category",
                "label": category["displayName"],
                "href": category["href"],
                "keywords": list(dict.fromkeys(category["searchKeywords"] + [category["name"], category["displayName"], category["slug"]])),
                "image": category["image"],
                "description": "Category",
                "status": category["status"],
                "dataSource": category["dataSource"],
            }
        )
    for collection in structured_collections:
        search_index.append(
            {
                "id": collection["id"],
                "type": "collection",
                "label": collection["name"],
                "href": collection["href"],
                "keywords": list(dict.fromkeys(collection["searchKeywords"] + [collection["name"], collection["slug"]])),
                "image": collection["image"],
                "description": "Collection",
                "status": collection["status"],
                "dataSource": collection["dataSource"],
            }
        )
    search_index.extend(
        [
            {
                "id": "page-ai-stylist",
                "type": "page",
                "label": "AI Stylist",
                "href": "/ai-stylist",
                "keywords": ["ai stylist", "ai stylised", "ai styled", "stylist", "style"],
                "image": None,
                "description": "Page",
                "status": "Demo",
                "dataSource": "sheet-derived",
            },
            {
                "id": "page-brands",
                "type": "page",
                "label": "Brands",
                "href": "/brands",
                "keywords": ["brands", "shop by brand", "top brands"],
                "image": None,
                "description": "Page",
                "status": "Active",
                "dataSource": "sheet-derived",
            },
        ]
    )

    return {
        "structured_products": structured_products,
        "structured_brands": structured_brands,
        "structured_categories": sorted(structured_categories, key=lambda entry: entry["displayOrder"]),
        "homepage_heroes": sorted(homepage_heroes, key=lambda entry: entry["displayOrder"]),
        "brand_page_heroes": sorted(brand_page_heroes, key=lambda entry: entry["displayOrder"]),
        "carousel_slides": sorted(carousel_slides, key=lambda entry: entry["displayOrder"]),
        "structured_collections": structured_collections,
        "ai_outfit_metadata": ai_outfit_metadata,
        "search_index": search_index,
    }


def build_backend_summary():
    backend_tables = load_sheet_records(BACKEND_FILE, "Backend Tables", "Table Name")
    api_routes = load_sheet_records(BACKEND_FILE, "API Routes", "Method")
    seed_mapping = load_sheet_records(BACKEND_FILE, "Seed Mapping", "Source Sheet")

    return {
        "backend_tables": [
            {
                "tableName": normalize_text(row.get("Table Name")),
                "module": normalize_text(row.get("Module")),
                "purpose": normalize_text(row.get("Purpose")),
                "ownerApp": normalize_text(row.get("Owner App")),
                "phase": normalize_text(row.get("Phase")),
                "priority": normalize_text(row.get("Priority")),
                "status": normalize_text(row.get("Status")),
            }
            for row in backend_tables
            if normalize_text(row.get("Table Name"))
        ],
        "backend_api_routes": [
            {
                "method": normalize_text(row.get("Method")),
                "route": normalize_text(row.get("Route")),
                "module": normalize_text(row.get("Module")),
                "access": normalize_text(row.get("Access")),
                "purpose": normalize_text(row.get("Purpose")),
                "phase": normalize_text(row.get("Phase")),
                "status": normalize_text(row.get("Status")),
            }
            for row in api_routes
            if normalize_text(row.get("Route"))
        ],
        "seed_mapping": [
            {
                "sourceSheet": normalize_text(row.get("Source Sheet")),
                "backendTables": normalize_text(row.get("Backend Tables")),
                "fieldsToMap": normalize_text(row.get("Fields to Map")),
                "importPhase": normalize_text(row.get("Import Phase")),
                "minimumRequired": normalize_text(row.get("Minimum Required")),
            }
            for row in seed_mapping
            if normalize_text(row.get("Source Sheet"))
        ],
    }


def build_ai_summary():
    ai_modules = load_sheet_records(AI_FILE, "AI Modules", "Module ID")
    api_routes = load_sheet_records(AI_FILE, "API Routes", "Route")
    data_sources = load_sheet_records(AI_FILE, "Data Sources", "Data Source")
    ai_tables = load_sheet_records(AI_FILE, "AI Tables", "Table")
    prompt_rules = load_sheet_records(AI_FILE, "Prompt Rules", "Prompt Area")
    outfit_builder = load_sheet_records(AI_FILE, "Outfit Builder", "Rule ID")

    return {
        "ai_modules": [
            {
                "id": normalize_text(row.get("Module ID")),
                "feature": normalize_text(row.get("AI Feature")),
                "userType": normalize_text(row.get("User Type")),
                "purpose": normalize_text(row.get("Purpose")),
                "launchPhase": normalize_text(row.get("Launch Phase")),
                "needsBackend": normalize_text(row.get("Needs Backend?")),
                "needsImageAi": normalize_text(row.get("Needs Image AI?")),
                "needsAdminReview": normalize_text(row.get("Needs Admin Review?")),
                "status": normalize_text(row.get("Status")),
            }
            for row in ai_modules
            if normalize_text(row.get("Module ID"))
        ],
        "ai_routes": [
            {
                "route": normalize_text(row.get("Route")),
                "method": normalize_text(row.get("Method")),
                "feature": normalize_text(row.get("Feature")),
                "userType": normalize_text(row.get("User Type")),
                "purpose": normalize_text(row.get("Purpose")),
                "launchPhase": normalize_text(row.get("Launch Phase")),
                "status": normalize_text(row.get("Status")),
            }
            for row in api_routes
            if normalize_text(row.get("Route"))
        ],
        "ai_data_sources": [
            {
                "dataSource": normalize_text(row.get("Data Source")),
                "usedBy": normalize_text(row.get("Used By")),
                "accessLevel": normalize_text(row.get("Access Level")),
                "examples": normalize_text(row.get("Examples")),
                "privacyLevel": normalize_text(row.get("Privacy Level")),
                "notes": normalize_text(row.get("Notes")),
            }
            for row in data_sources
            if normalize_text(row.get("Data Source"))
        ],
        "ai_tables": [
            {
                "table": normalize_text(row.get("Table")),
                "purpose": normalize_text(row.get("Purpose")),
                "keyColumns": normalize_text(row.get("Key Columns")),
                "usedBy": normalize_text(row.get("Used By")),
                "launchPhase": normalize_text(row.get("Launch Phase")),
                "status": normalize_text(row.get("Status")),
            }
            for row in ai_tables
            if normalize_text(row.get("Table"))
        ],
        "ai_prompt_rules": [
            {
                "promptArea": normalize_text(row.get("Prompt Area")),
                "systemRule": normalize_text(row.get("System Rule")),
                "mustUseDataFrom": normalize_text(row.get("Must Use Data From")),
                "mustNeverDo": normalize_text(row.get("Must Never Do")),
                "outputStyle": normalize_text(row.get("Output Style")),
                "status": normalize_text(row.get("Status")),
            }
            for row in prompt_rules
            if normalize_text(row.get("Prompt Area"))
        ],
        "outfit_builder_rules": [
            {
                "ruleId": normalize_text(row.get("Rule ID")),
                "rule": normalize_text(row.get("Rule")),
                "priority": normalize_text(row.get("Priority")),
                "dataNeeded": normalize_text(row.get("Data Needed")),
                "example": normalize_text(row.get("Example")),
                "status": normalize_text(row.get("Status")),
            }
            for row in outfit_builder
            if normalize_text(row.get("Rule ID"))
        ],
    }


def generate_modules() -> None:
    master = build_master_store_data()
    backend = build_backend_summary()
    ai = build_ai_summary()

    products_content = f"""// Auto-generated from project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx
// by scripts/import-sheet-data.py. Keep demo compatibility layers elsewhere.

export type StructuredProduct = {{
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
}};

export const structuredProducts: StructuredProduct[] = {ts_dump(master["structured_products"])};
"""

    brands_content = f"""// Auto-generated from project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx

export type StructuredBrand = {{
  id: string;
  sourceBrandId: string;
  name: string;
  slug: string;
  tagline: string;
  shortDescription: string;
  description: string;
  brandCategory: string;
  categories: string[];
  logo: string;
  heroImage: string;
  accentColor: string;
  featured: boolean;
  topBrand: boolean;
  searchKeywords: string[];
  status: string;
  availabilityNote: string;
  productIds: string[];
  dataSource: "sheet";
}};

export const structuredBrands: StructuredBrand[] = {ts_dump(master["structured_brands"])};
"""

    categories_content = f"""// Auto-generated from project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx

export type StructuredCategory = {{
  id: string;
  sourceCategoryId: string;
  name: string;
  displayName: string;
  slug: string;
  description: string;
  image: string;
  href: string;
  displayOrder: number;
  featured: boolean;
  searchKeywords: string[];
  status: string;
  dataSource: "sheet";
}};

export const structuredCategories: StructuredCategory[] = {ts_dump(master["structured_categories"])};
"""

    homepage_heroes_content = f"""// Auto-generated from project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx

export type HomepageHero = {{
  id: string;
  sourceHeroId: string;
  title: string;
  subtitle: string;
  tagline: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  mobileImage: string;
  sourceImageFileName: string;
  sourceMobileImageFileName: string;
  displayOrder: number;
  status: string;
  dataSource: "sheet";
}};

export const homepageHeroes: HomepageHero[] = {ts_dump(master["homepage_heroes"])};
"""

    brand_page_heroes_content = f"""// Auto-generated from project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx

export type BrandPageHero = {{
  id: string;
  brandName: string;
  brandSlug: string;
  title: string;
  subtitle: string;
  image: string;
  mobileImage: string;
  sourceImageFileName: string;
  sourceMobileImageFileName: string;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
  status: string;
  dataSource: "sheet";
}};

export const brandPageHeroes: BrandPageHero[] = {ts_dump(master["brand_page_heroes"])};
"""

    carousels_content = f"""// Auto-generated from project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx

export type CarouselSlide = {{
  id: string;
  carouselName: string;
  title: string;
  subtitle: string;
  image: string;
  mobileImage: string;
  sourceImageFileName: string;
  buttonText: string;
  buttonLink: string;
  displayOrder: number;
  status: string;
  dataSource: "sheet";
}};

export const carouselSlides: CarouselSlide[] = {ts_dump(master["carousel_slides"])};
"""

    collections_content = f"""// Auto-generated from product collection values in the master store sheet.

export type StructuredCollection = {{
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  href: string;
  searchKeywords: string[];
  productIds: string[];
  status: string;
  dataSource: "sheet-derived";
}};

export const structuredCollections: StructuredCollection[] = {ts_dump(master["structured_collections"])};
"""

    search_index_content = f"""// Auto-generated search entries derived from master store, collection, and brand data.

export type StructuredSearchEntry = {{
  id: string;
  type: "product" | "brand" | "category" | "collection" | "page";
  label: string;
  href: string;
  keywords: string[];
  image: string | null;
  description: string;
  status: string;
  dataSource: string;
}};

export const structuredSearchIndex: StructuredSearchEntry[] = {ts_dump(master["search_index"])};
"""

    ai_outfit_content = f"""// Auto-generated from master store products and AI planning rules.

export type AiOutfitMetadata = {{
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
}};

export type AiModuleSummary = {{
  id: string;
  feature: string;
  userType: string;
  purpose: string;
  launchPhase: string;
  needsBackend: string;
  needsImageAi: string;
  needsAdminReview: string;
  status: string;
}};

export type AiRouteSummary = {{
  route: string;
  method: string;
  feature: string;
  userType: string;
  purpose: string;
  launchPhase: string;
  status: string;
}};

export const aiOutfitMetadata: AiOutfitMetadata[] = {ts_dump(master["ai_outfit_metadata"])};

export const aiModules: AiModuleSummary[] = {ts_dump(ai["ai_modules"])};

export const aiRoutes: AiRouteSummary[] = {ts_dump(ai["ai_routes"])};

export const aiOutfitBuilderRules = {ts_dump(ai["outfit_builder_rules"])};
"""

    write_ts_module(OUTPUT_DIR / "products.ts", products_content)
    write_ts_module(OUTPUT_DIR / "brands.ts", brands_content)
    write_ts_module(OUTPUT_DIR / "categories.ts", categories_content)
    write_ts_module(OUTPUT_DIR / "homepageHeroes.ts", homepage_heroes_content)
    write_ts_module(OUTPUT_DIR / "brandPageHeroes.ts", brand_page_heroes_content)
    write_ts_module(OUTPUT_DIR / "carousels.ts", carousels_content)
    write_ts_module(OUTPUT_DIR / "collections.ts", collections_content)
    write_ts_module(OUTPUT_DIR / "searchIndex.ts", search_index_content)
    write_ts_module(OUTPUT_DIR / "aiOutfitMetadata.ts", ai_outfit_content)


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    generate_modules()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
