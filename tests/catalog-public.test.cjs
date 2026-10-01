// Phase 1B — canonical public catalogue regression suite.
//
// Runs the REAL lib/catalog/public-catalog.ts (compiled via tests/tsconfig.json)
// against a scripted publishable-key client (tests/mocks/supabase-public-catalog.cjs),
// plus source-level guards for the policy migration and the buyer pages. The
// live database behaviour of 0019 is verified separately by
// supabase/verification/0019_brand_category_public_reads_verify.sql.

require("./bootstrap.cjs");

const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { setPublicCatalogHandler } = require("./mocks/supabase-public-catalog.cjs");
const catalog = require("./.build/lib/catalog/public-catalog.js");
const { isDemoCatalogueEnabled } = require("./.build/lib/catalog/demo-fallback.js");

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");
const PERMISSION_DENIED = { code: "42501", message: "permission denied for table users" };

const brand = { id: "b1", slug: "vanta", name: "Vanta", is_active: true, updated_at: "2026-10-01T00:00:00Z" };
const category = { id: "c1", slug: "jackets", name: "Jackets", is_active: true, sort_order: 1, updated_at: "2026-10-01T00:00:00Z" };
const product = {
  id: "11111111-1111-4111-8111-111111111111", slug: "obsidian-utility-jacket", name: "Obsidian Utility Jacket",
  brand_id: "b1", category_id: "c1", status: "ACTIVE", price_inr: 7499, image_url: null, created_at: "2026-10-01T00:00:00Z",
};

let consoleError;
beforeEach(() => {
  consoleError = console.error;
  console.error = () => {}; // fail() logs the real cause; keep test output clean
});
afterEach(() => {
  console.error = consoleError;
  setPublicCatalogHandler(() => ({ data: [], error: null }));
});

// 1 + 2. Anonymous brand / category reads: the policy fix itself.
test("0019 makes brand/category admin SELECT authenticated-only via is_admin(), never touching users", () => {
  const migration = read("supabase/migrations/0019_fix_brand_category_public_reads.sql");
  const executable = migration.replace(/^--.*$/gm, "");

  for (const table of ["brands", "categories"]) {
    assert.match(executable, new RegExp(`drop policy if exists "${table}: admin can select all" on public\\.${table}`));
    assert.match(
      executable,
      new RegExp(`create policy "${table}: admin can select all"\\s+on public\\.${table}\\s+for select\\s+to authenticated\\s+using \\(public\\.is_admin\\(\\)\\)`),
    );
  }
  assert.doesNotMatch(executable, /public\.users|from users/i, "no policy may read users with the caller's privileges");
  assert.doesNotMatch(executable, /grant[^;]*\bon\b[^;]*\busers\b/i, "anon must not be granted anything on users");
  assert.doesNotMatch(executable, /\b(disable|alter table|insert|update|delete from|truncate)\b/i);
});

test("anonymous brand read: active brands are returned from the public client", async () => {
  setPublicCatalogHandler(({ table }) => (table === "brands" ? { data: [brand], error: null } : { data: [], error: null }));
  const result = await catalog.listActiveBrands();
  assert.equal(result.ok, true);
  assert.deepEqual(result.data.map((b) => b.slug), ["vanta"]);
});

test("anonymous category read: active categories are returned from the public client", async () => {
  setPublicCatalogHandler(({ table }) => (table === "categories" ? { data: [category], error: null } : { data: [], error: null }));
  const result = await catalog.listActiveCategories();
  assert.equal(result.ok, true);
  assert.deepEqual(result.data.map((c) => c.slug), ["jackets"]);
});

// 3 + 5. Error is not empty; empty is a valid answer.
test("a database error is reported as an error, not as an empty catalogue", async () => {
  setPublicCatalogHandler(() => ({ data: null, error: PERMISSION_DENIED }));
  for (const read of [catalog.listActiveBrands, catalog.listActiveCategories, () => catalog.listActiveProducts()]) {
    const result = await read();
    assert.equal(result.ok, false);
    assert.equal("data" in result, false, "an error result carries no data to mistake for an empty list");
    assert.doesNotMatch(JSON.stringify(result), /permission denied|42501|users/, "callers never see database internals");
  }
});

test("a genuine zero-row result stays a valid, successful empty catalogue", async () => {
  setPublicCatalogHandler(() => ({ data: [], error: null }));
  const products = await catalog.listActiveProducts();
  const brands = await catalog.listActiveBrands();
  assert.deepEqual(products, { ok: true, data: [] });
  assert.deepEqual(brands, { ok: true, data: [] });
  const missing = await catalog.findActiveProduct("no-such-product");
  assert.deepEqual(missing, { ok: true, data: null }, "not found is a successful null, not an error");
});

test("unwrapCatalog throws a detail-free CatalogUnavailableError on error and passes data through", () => {
  assert.deepEqual(catalog.unwrapCatalog({ ok: true, data: [] }), []);
  assert.throws(
    () => catalog.unwrapCatalog({ ok: false, error: { operation: "brands.list" } }),
    (error) => error instanceof catalog.CatalogUnavailableError && error.operation === "brands.list" && !/42501|users/.test(error.message),
  );
});

// 6. Canonical shop result: ACTIVE products with real relations; a relation error fails the read.
test("listActiveProducts reads ACTIVE products and attaches brand, category, variants and images", async () => {
  setPublicCatalogHandler(({ table, calls }) => {
    if (table === "products") {
      assert.ok(calls.some((c) => c.method === "eq" && c.args[0] === "status" && c.args[1] === "ACTIVE"));
      return { data: [product], error: null };
    }
    if (table === "brands") return { data: [brand], error: null };
    if (table === "categories") return { data: [category], error: null };
    if (table === "product_variants") return { data: [{ id: "v1", product_id: product.id, stock_quantity: 3 }], error: null };
    if (table === "product_images") return { data: [{ id: "i1", product_id: product.id, url: "https://x/i.jpg" }], error: null };
    return { data: [], error: null };
  });
  const result = await catalog.listActiveProducts();
  assert.equal(result.ok, true);
  assert.equal(result.data[0].brand.slug, "vanta");
  assert.equal(result.data[0].category.slug, "jackets");
  assert.equal(result.data[0].variants.length, 1);
  assert.equal(result.data[0].images.length, 1);
});

test("a failed relation read (the old 42501 path) fails the product read instead of dropping brands", async () => {
  setPublicCatalogHandler(({ table }) => {
    if (table === "products") return { data: [product], error: null };
    if (table === "brands") return { data: null, error: PERMISSION_DENIED };
    return { data: [], error: null };
  });
  const result = await catalog.listActiveProducts();
  assert.equal(result.ok, false);
  assert.equal(result.error.operation, "products.list.relations");
  const one = await catalog.findActiveProduct(product.slug);
  assert.equal(one.ok, false, "a live PDP no longer renders with brand silently null");
});

// 4. No production demo fallback.
test("the demo catalogue can never be enabled in a production build", () => {
  const saved = { node: process.env.NODE_ENV, flag: process.env.NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE };
  try {
    process.env.NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE = "1";
    process.env.NODE_ENV = "production";
    assert.equal(isDemoCatalogueEnabled(), false);
    process.env.NODE_ENV = "development";
    assert.equal(isDemoCatalogueEnabled(), true);
    delete process.env.NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE;
    assert.equal(isDemoCatalogueEnabled(), false, "off unless explicitly enabled");
  } finally {
    process.env.NODE_ENV = saved.node;
    if (saved.flag === undefined) delete process.env.NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE;
    else process.env.NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE = saved.flag;
  }
});

test("buyer pages read the canonical layer and only reach demo data through the explicit switch", () => {
  const pages = {
    "app/shop/page.tsx": /CatalogUnavailableError/,
    "app/product/[id]/page.tsx": /CatalogUnavailableError/,
    "app/brands/page.tsx": /CatalogUnavailableError/,
    "app/brands/[slug]/page.tsx": /CatalogUnavailableError/,
    "app/categories/[slug]/page.tsx": /CatalogUnavailableError|unwrapCatalog/,
  };
  for (const [file, failsLoudly] of Object.entries(pages)) {
    const source = read(file);
    assert.match(source, /@\/lib\/catalog\/public-catalog/, `${file} must read lib/catalog/public-catalog`);
    assert.doesNotMatch(source, /@\/lib\/catalog\/queries/, `${file} must not use the seller/admin query layer`);
    assert.match(source, failsLoudly, `${file} must surface catalogue errors`);
    if (/demoBrands|getSeedProductById|getStructuredCategoryBySlug|getTopBrands|getDemoBrandBySlug/.test(source)) {
      assert.match(source, /isDemoCatalogueEnabled\(\)/, `${file} may only use demo data behind isDemoCatalogueEnabled()`);
    }
  }
  const shopCatalog = read("components/buyer/shop-catalog.tsx");
  assert.match(shopCatalog, /source === "live"/, "shop source is decided on the server, not inferred from an empty list");
  assert.doesNotMatch(shopCatalog, /liveProducts\.length > 0 \?/);
});

// 7. Canonical sitemap entities.
test("sitemap lists only live entities and fails loudly instead of omitting them", () => {
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /listActiveBrands\(\)/);
  assert.match(sitemap, /listActiveCategories\(\)/);
  assert.match(sitemap, /listActiveProducts\(\)/);
  assert.match(sitemap, /unwrapCatalog\(/);
  assert.match(sitemap, /export const dynamic = "force-dynamic"/);
  assert.doesNotMatch(sitemap, /src\/data|lib\/data\/(products|brands)|demoBrands/);
});
