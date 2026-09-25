import type { RecoveryStep } from "@/lib/types";

interface RecoveryJourneyProps {
  steps: RecoveryStep[];
  startedAction?: string | null;
  onStepSelect?: (step: RecoveryStep) => void;
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RecoveryJourney({
  steps,
  startedAction = null,
  onStepSelect,
}: RecoveryJourneyProps) {
  if (steps.length === 0) return null;

  const firstPendingIndex = steps.findIndex(
    (step) => step.status === "pending"
  );

  return (
    <section aria-label="Your Recovery Journey" className="w-full">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
        Your Recovery Journey
      </h2>
      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((step, index) => {
          const isCurrent = index === firstPendingIndex;
          const isDone = step.status === "done";
          const isStarted = !isDone && step.action === startedAction;
          const isClickable = !isDone && Boolean(onStepSelect);

          const row = (
            <>
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isDone
                      ? "bg-success text-white"
                      : isCurrent || isStarted
                      ? "bg-primary text-white"
                      : "bg-border text-muted"
                  }`}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <span
                  className={
                    isDone
                      ? "text-muted line-through"
                      : "font-medium text-foreground"
                  }
                >
                  {titleCase(step.category)}
                </span>
              </span>
              {!isDone && (isStarted || isCurrent) && (
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {isStarted ? "In Progress" : "Current"}
                </span>
              )}
            </>
          );

          const rowClassName = `flex w-full items-center justify-between rounded-md border px-4 py-3 text-left ${
            isCurrent || isStarted
              ? "border-primary bg-primary/5"
              : "border-border bg-surface"
          } ${isClickable ? "transition-colors hover:border-primary hover:bg-primary/5" : ""}`;

          return (
            <li key={`${step.category}-${index}`}>
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onStepSelect?.(step)}
                  aria-pressed={isStarted}
                  className={rowClassName}
                >
                  {row}
                </button>
              ) : (
                <div className={rowClassName}>{row}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
