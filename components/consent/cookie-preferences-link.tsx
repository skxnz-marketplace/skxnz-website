"use client";

// Footer entry point into the cookie preference centre. A button (not a link)
// because it opens the in-page centre rather than navigating. Dispatches the
// event ConsentManager listens for. Styled to match the surrounding footer
// legal links via `className`.

type Props = { className?: string; label?: string };

export function CookiePreferencesLink({ className, label = "Cookie preferences" }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("skxnz:open-cookie-preferences"))}
      className={className}
    >
      {label}
    </button>
  );
}

export default CookiePreferencesLink;
