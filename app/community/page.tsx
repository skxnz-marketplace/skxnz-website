import type { Metadata } from "next";
import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getProductHref } from "@/lib/catalog/product-links";
import { formatProductPrice, products } from "@/lib/data/products";
import { skxnzFallbackAssets } from "@/src/lib/assets";

export const metadata: Metadata = {
  title: "Signal Room",
  description:
    "Signal Room is the upcoming SKXNZ community landing for drop discussions, style signals, house-styled looks, and community code.",
};

export const revalidate = 300;

const featuredProducts = products.slice(0, 4);
const heroProduct = featuredProducts[0] ?? products[0];

const roomPillars = [
  {
    title: "Drop Discussions",
    description:
      "Future threads will collect drop notes, launch questions, and buyer reactions after the room opens.",
  },
  {
    title: "Style Signals",
    description:
      "Members will be able to follow styling cues around silhouettes, palettes, and product pairings.",
  },
  {
    title: "Member Fits",
    description:
      "Fit features will arrive after account access, eligibility, and community safety flows are ready.",
  },
];

const styledLooks = featuredProducts.map((product, index) => ({
  product,
  label: ["Night Signal", "Chrome Utility", "Drop Layer", "Quiet Luxury"][index] ?? "Signal Edit",
}));

const previewThread = [
  {
    title: "Thread 01",
    body: "Which silhouette should lead the first Signal Room drop: sharp outerwear, elevated tees, or low-noise accessories?",
  },
  {
    title: "Thread 02",
    body: "How should SKXNZ style a black-on-black capsule without losing texture, hardware, and proportion?",
  },
  {
    title: "Thread 03",
    body: "What makes a product tag useful: price clarity, fabric detail, color accuracy, or styling context?",
  },
];

const communityRules = [
  "Respect style differences. No harassment, hate, or personal attacks.",
  "Tag SKXNZ products honestly. No fake brand, seller, creator, or ownership claims.",
  "Keep product talk useful: fit, material, styling, and buyer context.",
  "Use original images and clear captions when posting access opens.",
];

function ProductTag({
  product,
  compact = false,
}: {
  product: (typeof products)[number];
  compact?: boolean;
}) {
  return (
    <Link
      href={getProductHref(product)}
      className="group inline-flex min-w-0 items-center gap-3 rounded-full border border-[rgba(255,254,250,0.14)] bg-white/[0.08] px-3 py-2 text-left text-[var(--skxnz-text-light)] transition hover:border-[rgba(34,211,238,0.44)] hover:bg-white/[0.12]"
    >
      <span
        className={`relative shrink-0 overflow-hidden rounded-full bg-white/[0.08] ${
          compact ? "h-8 w-8" : "h-10 w-10"
        }`}
      >
        <SafeImage
          src={product.image}
          fallbackSrc={skxnzFallbackAssets.product}
          alt={product.name}
          fill
          sizes={compact ? "32px" : "40px"}
          className="object-cover object-center transition group-hover:scale-[1.05]"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.65rem] font-black uppercase tracking-[0.13em]">
          {product.name}
        </span>
        <span className="mt-0.5 block truncate text-[0.64rem] text-white/60">
          {formatProductPrice(product.salePrice ?? product.price)}
        </span>
      </span>
    </Link>
  );
}

export default function CommunityPage() {
  return (
    <main className="bg-[var(--skxnz-bg)] text-[var(--skxnz-text-dark)]">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] text-[var(--skxnz-text-light)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_16%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_18%_88%,rgba(217,70,239,0.12),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-18">
          <div className="min-w-0 self-center">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.10)] text-[var(--skxnz-glint)]">
                Opening soon
              </Badge>
              <p className="text-[0.66rem] font-black uppercase tracking-[0.34em] text-white/58">
                WEAR THE SIGNAL.
              </p>
            </div>
            <h1 className="mt-6 max-w-[10ch] break-words font-display text-[3.1rem] uppercase leading-[0.9] tracking-[0.05em] sm:text-6xl lg:text-7xl">
              Signal Room
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/76 sm:text-base">
              A premium SKXNZ space being prepared for curated drop talk,
              product-tagged styling, and sharper community standards before
              public participation opens.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {heroProduct ? <ProductTag product={heroProduct} /> : null}
              <Link
                href="/login"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Get first access
              </Link>
            </div>
          </div>

          {heroProduct ? (
            <div className="min-w-0 self-end rounded-[34px] border border-white/12 bg-white/[0.07] p-3 shadow-[0_26px_80px_rgba(16,0,6,0.26)] backdrop-blur">
              <div className="relative min-h-[28rem] overflow-hidden rounded-[28px] bg-white/[0.08]">
                <SafeImage
                  src={heroProduct.image}
                  fallbackSrc={skxnzFallbackAssets.product}
                  alt={heroProduct.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_48%,rgba(16,0,6,0.72)_100%)]" />
                <div className="absolute bottom-5 left-5 right-5">
                  <Badge className="border-white/18 bg-white/[0.16] text-white">
                    Styled by SKXNZ
                  </Badge>
                  <p className="mt-3 text-xl font-semibold uppercase tracking-[0.04em]">
                    {heroProduct.name}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {roomPillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-[28px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-5 shadow-[0_18px_54px_rgba(58,8,24,0.06)]"
            >
              <p className="text-[0.64rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
                Signal Room intro
              </p>
              <h2 className="mt-3 text-lg font-semibold uppercase tracking-[0.02em]">
                {pillar.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--skxnz-text-muted)]">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.66rem] font-black uppercase tracking-[0.28em] text-[var(--skxnz-maroon)]">
                Styled By SKXNZ
              </p>
              <h2 className="mt-3 font-display text-3xl uppercase tracking-[0.04em]">
                House-styled signal looks.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[var(--skxnz-text-muted)]">
              Curated looks show how SKXNZ may frame product tags when the room opens.
            </p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {styledLooks.map(({ product, label }) => (
              <Link
                key={product.id}
                href={getProductHref(product)}
                className="group min-w-0 overflow-hidden rounded-[28px] border border-[var(--skxnz-border)] bg-[var(--skxnz-card)] p-3 shadow-[0_18px_54px_rgba(58,8,24,0.06)] transition hover:border-[rgba(34,211,238,0.42)]"
              >
                <div className="relative min-h-[18rem] overflow-hidden rounded-[22px] bg-[var(--skxnz-bg-soft)]">
                  <SafeImage
                    src={product.image}
                    fallbackSrc={skxnzFallbackAssets.product}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 280px"
                    className="object-cover object-center transition group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>Styled by SKXNZ</Badge>
                  <Badge>{label}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-black uppercase tracking-[0.12em]">
                  {product.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-[32px] bg-[linear-gradient(145deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] p-6 text-[var(--skxnz-text-light)] shadow-[0_24px_70px_rgba(16,0,6,0.20)]">
          <Badge className="border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.10)] text-[var(--skxnz-glint)]">
            Preview
          </Badge>
          <h2 className="mt-4 font-display text-3xl uppercase tracking-[0.04em]">
            Drop discussion preview.
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/72">
            Static examples show the tone planned for future discussions. Public
            replies are not open from this page.
          </p>
        </div>

        <div className="grid gap-3">
          {previewThread.map((item) => (
            <article
              key={item.title}
              className="rounded-[24px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-5 shadow-[0_16px_46px_rgba(58,8,24,0.055)]"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.66rem] font-black uppercase tracking-[0.22em] text-[var(--skxnz-maroon)]">
                  {item.title}
                </p>
                <Badge>Preview</Badge>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--skxnz-text-muted)]">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[var(--skxnz-surface)] py-10">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_0.75fr] lg:px-8">
          <div>
            <p className="text-[0.66rem] font-black uppercase tracking-[0.28em] text-[var(--skxnz-maroon)]">
              Community code
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase tracking-[0.04em]">
              Clear standards before the room opens.
            </h2>
          </div>
          <div className="grid gap-3">
            {communityRules.map((rule) => (
              <div
                key={rule}
                className="rounded-[20px] border border-[var(--skxnz-border)] bg-white p-4 text-sm leading-7 text-[var(--skxnz-text-muted)]"
              >
                {rule}
              </div>
            ))}
            <Link
              href="/community-guidelines"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Community guidelines
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] p-6 text-[var(--skxnz-text-light)] shadow-[0_28px_82px_rgba(16,0,6,0.22)] sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge className="border-white/18 bg-white/[0.12] text-white">
                First access
              </Badge>
              <h2 className="mt-4 font-display text-3xl uppercase tracking-[0.04em] sm:text-4xl">
                Enter the room when access opens.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                Sign in to be ready for early Signal Room entry, product-tagged
                styling, and future community drops.
              </p>
            </div>
            <Link
              href="/login"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Get first access
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
