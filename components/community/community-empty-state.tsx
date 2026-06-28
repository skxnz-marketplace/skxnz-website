import { Button } from "@/components/ui/button";

type CommunityEmptyStateProps = {
  onCreatePost: () => void;
};

export function CommunityEmptyState({ onCreatePost }: CommunityEmptyStateProps) {
  return (
    <div className="rounded-[32px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-8 text-center shadow-[0_18px_54px_rgba(58,8,24,0.06)]">
      <p className="text-[0.66rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
        No signals yet
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase tracking-[0.08em] text-[var(--skxnz-text-dark)]">
        Start the beta board.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--skxnz-text-muted)]">
        Create a local demo post with tagged SKXNZ products. Public community
        posting stays locked until moderation and account persistence are ready.
      </p>
      <div className="mt-6">
        <Button type="button" onClick={onCreatePost}>
          Create Demo Post
        </Button>
      </div>
    </div>
  );
}
