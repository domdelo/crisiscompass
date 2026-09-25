"use client";

import { useId, useState } from "react";
import type { RecoveryStep } from "@/lib/types";
import { getJourneyContent } from "@/lib/journeyContent";

interface RecoveryJourneyProps {
  steps: RecoveryStep[];
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RecoveryJourney({ steps }: RecoveryJourneyProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    null
  );
  const [completedCategories, setCompletedCategories] = useState<Set<string>>(
    new Set()
  );
  const panelIdBase = useId();

  if (steps.length === 0) return null;

  function isDone(step: RecoveryStep): boolean {
    return step.status === "done" || completedCategories.has(step.category);
  }

  function toggleStepComplete(category: string) {
    setCompletedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  const firstPendingIndex = steps.findIndex((step) => !isDone(step));

  return (
    <section aria-label="Your Recovery Journey" className="w-full">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
        Your Recovery Journey
      </h2>
      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((step, index) => {
          const done = isDone(step);
          const isCurrent = index === firstPendingIndex;
          const isExpanded = expandedCategory === step.category;
          const panelId = `${panelIdBase}-${step.category}`;
          const content = getJourneyContent(step.category);

          return (
            <li key={`${step.category}-${index}`} className="w-full">
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() =>
                  setExpandedCategory(isExpanded ? null : step.category)
                }
                className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5 ${
                  isCurrent || isExpanded
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      done
                        ? "bg-success text-white"
                        : isCurrent
                        ? "bg-primary text-white"
                        : "bg-border text-muted"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <span
                    className={
                      done
                        ? "text-muted line-through"
                        : "font-medium text-foreground"
                    }
                  >
                    {titleCase(step.category)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {isCurrent && !done && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Current
                    </span>
                  )}
                  <span aria-hidden="true" className="text-muted">
                    {isExpanded ? "−" : "+"}
                  </span>
                </span>
              </button>

              {isExpanded && (
                <div
                  id={panelId}
                  className="mt-2 rounded-md border border-border bg-surface p-4"
                >
                  <p className="text-sm font-medium text-foreground">
                    {step.action}
                  </p>
                  <p className="mt-1 text-sm text-muted">{content.guidance}</p>

                  <ul className="mt-3 flex flex-col gap-3">
                    {content.links.map((link) => (
                      <li
                        key={link.url}
                        className="rounded-md border border-border bg-background p-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {link.title}
                        </p>
                        <p className="text-xs text-muted">{link.agency}</p>
                        <p className="mt-1 text-sm text-foreground">
                          {link.description}
                        </p>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary underline"
                        >
                          Visit {link.agency} &#8599;
                        </a>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => toggleStepComplete(step.category)}
                    className="mt-4 rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
                  >
                    {done ? "Mark as not done" : "Mark step complete"}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
