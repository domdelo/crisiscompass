interface NextBestActionProps {
  action: string;
  onStart?: () => void;
}

export function NextBestAction({ action, onStart }: NextBestActionProps) {
  return (
    <section
      aria-label="Next Best Action"
      className="w-full rounded-lg bg-action px-6 py-5 text-action-contrast"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-action-contrast/80">
        Next Best Action
      </h2>
      <div className="mt-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-xl font-semibold">{action}</p>
        <button
          type="button"
          onClick={onStart}
          className="shrink-0 rounded-full bg-action-contrast px-5 py-2.5 text-sm font-semibold text-action transition-colors hover:bg-action-contrast/90"
        >
          Start &rarr;
        </button>
      </div>
    </section>
  );
}
