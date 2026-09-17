-- =============================================================
-- SKXNZ — Slice 2A demo catalog seed
-- Safe idempotent seed data. SKXNZ-native placeholder brands only,
-- no real luxury brand claims. Run after 0002_catalog_layer.sql.
-- =============================================================


-- =============================================================
-- 1. BRANDS
-- =============================================================

insert into public.brands (slug, name, description, is_active)
values
  ('vanta',     'VANTA',     'Utility-driven outerwear and layers.',            true),
  ('axis',      'AXIS',      'Performance sneakers and footwear.',              true),
  ('signal',    'SIGNAL',    'Core streetwear staples.',                        true),
  ('meridian',  'MERIDIAN',  'Tailored pants and carry goods.',                 true),
  ('halo',      'HALO',      'Timepieces and precision accessories.',           true),
  ('kore',      'KORE',      'Bags and everyday carry.',                        true),
  ('flux',      'FLUX',      'Fast, motion-first footwear.',                    true),
  ('noir',      'NOIR',      'Structured jackets in dark tones.',               true),
  ('monolith',  'MONOLITH',  'Minimal, monochrome layers.',                     true),
  ('apex',      'APEX',      'Track and training wear.',                        true),
  ('pulse',     'PULSE',     'Eyewear and small accessories.',                  true)
on conflict (slug) do nothing;


-- =============================================================
-- 2. CATEGORIES
-- =============================================================

insert into public.categories (slug, name, sort_order, is_active)
values
  ('sneakers',    'Sneakers',    1, true),
  ('jackets',     'Jackets',     2, true),
  ('watches',     'Watches',     3, true),
  ('streetwear',  'Streetwear',  4, true),
  ('bags',        'Bags',        5, true),
  ('accessories', 'Accessories', 6, true)
on conflict (slug) do nothing;


-- =============================================================
-- 3. PRODUCTS
--    Uses subqueries against slugs so this stays idempotent and
--    doesn't depend on capturing generated UUIDs.
-- =============================================================

insert into public.products (
  seller_id, brand_id, category_id, slug, name, subtitle,
  status, price_inr, compare_at_price_inr, image_url, tags,
  is_featured, is_limited
)
values
  (
    null,
    (select id from public.brands where slug = 'vanta'),
    (select id from public.categories where slug = 'jackets'),
    'obsidian-utility-jacket',
    'Obsidian Utility Jacket',
    'Utility-driven outerwear',
    'ACTIVE', 7499, 9999, null, '{jacket,utility}', true, false
  ),
  (
    null,
    (select id from public.brands where slug = 'axis'),
    (select id from public.categories where slug = 'sneakers'),
    'chrome-runner-sneaker',
    'Chrome Runner Sneaker',
    'Performance footwear',
    'ACTIVE', 12999, 15499, null, '{sneaker,running}', true, false
  ),
  (
    null,
    (select id from public.brands where slug = 'meridian'),
    (select id from public.categories where slug = 'streetwear'),
    'midnight-cargo-pants',
    'Midnight Cargo Pants',
    'Tailored streetwear',
    'ACTIVE', 4999, 6499, null, '{pants,cargo}', false, false
  ),
  (
    null,
    (select id from public.brands where slug = 'signal'),
    (select id from public.categories where slug = 'streetwear'),
    'signal-black-hoodie',
    'Signal Black Hoodie',
    'Core streetwear staple',
    'ACTIVE', 3999, 5299, null, '{hoodie,streetwear}', false, false
  ),
  (
    null,
    (select id from public.brands where slug = 'halo'),
    (select id from public.categories where slug = 'watches'),
    'silver-dial-timepiece',
    'Silver Dial Timepiece',
    'Precision accessory',
    'ACTIVE', 18499, 22999, null, '{watch,timepiece}', true, true
  ),
  (
    null,
    (select id from public.brands where slug = 'kore'),
    (select id from public.categories where slug = 'bags'),
    'urban-sling-bag',
    'Urban Sling Bag',
    'Everyday carry',
    'ACTIVE', 5499, 7199, null, '{bag,carry}', false, false
  )
on conflict (slug) do nothing;


-- =============================================================
-- 4. PRODUCT VARIANTS
-- =============================================================

insert into public.product_variants (product_id, sku, size, color, stock_quantity, is_active)
values
  ((select id from public.products where slug = 'obsidian-utility-jacket'), 'VANTA-OUJ-M-BLK',  'M', 'Black', 12, true),
  ((select id from public.products where slug = 'obsidian-utility-jacket'), 'VANTA-OUJ-L-BLK',  'L', 'Black', 8,  true),
  ((select id from public.products where slug = 'chrome-runner-sneaker'),  'AXIS-CRS-9-SLV',   'UK 9', 'Silver', 15, true),
  ((select id from public.products where slug = 'chrome-runner-sneaker'),  'AXIS-CRS-10-SLV',  'UK 10', 'Silver', 10, true),
  ((select id from public.products where slug = 'midnight-cargo-pants'),   'MRDN-MCP-32-BLK',  '32', 'Black', 20, true),
  ((select id from public.products where slug = 'signal-black-hoodie'),    'SGNL-SBH-M-BLK',   'M', 'Black', 25, true),
  ((select id from public.products where slug = 'silver-dial-timepiece'),  'HALO-SDT-OS-SLV',  'One Size', 'Silver', 5, true),
  ((select id from public.products where slug = 'urban-sling-bag'),        'KORE-USB-OS-BLK',  'One Size', 'Black', 18, true)
on conflict (sku) do nothing;


-- =============================================================
-- 5. PRODUCT IMAGES
--    No external URLs. image_url left null; frontend uses its
--    existing gradient placeholder for now.
-- =============================================================

insert into public.product_images (product_id, url, alt, sort_order)
select p.id, 'placeholder://gradient', p.name, 0
from public.products p
where p.slug in (
  'obsidian-utility-jacket',
  'chrome-runner-sneaker',
  'midnight-cargo-pants',
  'signal-black-hoodie',
  'silver-dial-timepiece',
  'urban-sling-bag'
)
and not exists (
  select 1 from public.product_images pi where pi.product_id = p.id
);
