#!/usr/bin/env python3
"""
Generate JSON backend seed artifacts from the SKXNZ planning workbooks.

This keeps Prisma seed data independent from the frontend TypeScript modules while
still using the Google Sheet planning files as the source of truth.
"""

from __future__ import annotations

import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IMPORTER_PATH = ROOT / "scripts" / "import-sheet-data.py"
PROCESSED_DIR = ROOT / "project-data" / "processed"


def load_importer_module():
    spec = importlib.util.spec_from_file_location("import_sheet_data", IMPORTER_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    importer = load_importer_module()
    generated_at = datetime.now(timezone.utc).isoformat()

    master = importer.build_master_store_data()
    backend = importer.build_backend_summary()
    ai = importer.build_ai_summary()

    write_json(
      PROCESSED_DIR / "master-store.seed.json",
      {
        "generatedAt": generated_at,
        "source": "project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx",
        "products": master["structured_products"],
        "brands": master["structured_brands"],
        "categories": master["structured_categories"],
        "collections": master["structured_collections"],
        "homepageHeroes": master["homepage_heroes"],
        "brandHeroes": master["brand_page_heroes"],
        "carouselSlides": master["carousel_slides"],
        "searchIndex": master["search_index"],
        "aiOutfitMetadata": master["ai_outfit_metadata"],
      },
    )

    write_json(
      PROCESSED_DIR / "backend-architecture.json",
      {
        "generatedAt": generated_at,
        "source": "project-data/source-sheets/SKXNZ_BACKEND_ARCHITECTURE_PACK_FINAL.xlsx",
        **backend,
      },
    )

    write_json(
      PROCESSED_DIR / "ai-architecture.json",
      {
        "generatedAt": generated_at,
        "source": "project-data/source-sheets/SKXNZ_AI_OPERATING_SYSTEM_PACK_FINAL.xlsx",
        **ai,
      },
    )


if __name__ == "__main__":
    main()
