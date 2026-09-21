// Honest fallback for when supabase/migrations/0017_community_layer.sql
// hasn't been applied to the environment currently serving this request
// (e.g. a preview/staging DB that hasn't caught up yet). Matches the
// backendReady pattern used elsewhere (components/account/account-saved-items.tsx).
export function CommunityNotWired() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
        Community
      </p>
      <h1 className="mt-4 font-display text-3xl uppercase tracking-[0.04em] text-[var(--skxnz-text-dark)]">
        Not connected yet.
      </h1>
      <p className="mt-4 text-sm leading-7 text-[var(--skxnz-text-muted)]">
        SKXNZ Community isn&apos;t connected on this environment yet. Nothing was
        lost — check back shortly.
      </p>
    </div>
  );
}
