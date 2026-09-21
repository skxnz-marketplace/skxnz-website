import { getSiteBaseUrl } from "@/lib/site";

// llms.txt — an emerging, unstandardized convention some AI crawlers/assistants
// read for a plain-language summary of a site. It is not a ranking signal and
// is not guaranteed to be honored. Keep this factual and public-only: no
// secrets, admin paths, or internal architecture.
export function GET() {
  const baseUrl = getSiteBaseUrl();
  const url = (path: string) => new URL(path, baseUrl).toString();

  const body = `# SKXNZ

> AI-powered futurewear marketplace by Vivaan Poddar Companies. Private-preview:
> curated catalog discovery is live; checkout, payments, delivery, and refunds
> are not yet enabled.

Canonical domain: ${baseUrl}

## Shop
- [Shop](${url("/shop")}): Full product catalog with filters and search.
- [Brands](${url("/brands")}): Brands available on SKXNZ.

## AI
- [AI](${url("/ai")}): SKXNZ's AI-driven discovery experience.
- [AI Stylist](${url("/ai/stylist")}): AI-assisted style recommendations.

## Company
- [About](${url("/about")}): What SKXNZ is and who runs it.
- [Contact](${url("/contact")}): How to reach SKXNZ.

## Policies
- [Returns](${url("/returns")})
- [FAQ](${url("/faq")})

Authenticity, shipping, terms, and privacy pages exist but are draft copy
pending legal review — not linked here to avoid an assistant quoting them
as final policy.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
