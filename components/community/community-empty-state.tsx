import { Button } from "@/components/ui/button";

type CommunityEmptyStateProps = {
  onCreatePost: () => void;
};

export function CommunityEmptyState({ onCreatePost }: CommunityEmptyStateProps) {
  return (
    <div className="rounded-[32px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-8 text-center shadow-[0_18px_54px_rgba(58,8,24,0.06)]">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
        No signals yet
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase tracking-[0.08em] text-[var(--skxnz-text-dark)]">
        Start the beta board.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--skxnz-text-muted)]">
        Once invited posters share their fits, they&apos;ll show up here after
        review.
      </p>
      <div className="mt-6">
        <Button type="button" onClick={onCreatePost}>
          Create Post
        </Button>
      </div>
    </div>
  );
}
