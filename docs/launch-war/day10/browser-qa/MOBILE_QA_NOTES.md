# D10-A mobile QA notes

Responsive browser inspection at desktop, 768px, and 390px could not be performed. Computer Use stopped because Chrome's current URL could not be determined confidently, and the direct HTTP fallback showed that middleware configuration blocks every page before render.

Manual QA remains required for `/`, `/shop`, a source-backed product path, `/cart`, `/checkout`, `/account`, `/faq`, `/seller`, and `/admin/operations`. At each width, record horizontal overflow, header/nav behavior, CTA wrapping, card density, text/image clipping, tap-target size, form usability, and table/card readability.

The only carried-forward mobile risk is the D9-B note that the `/shop` sidebar may need to collapse for a tighter mobile first fold. No D10-A screenshot proves or disproves it.
