"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ResourceLinkCard } from "@/components/ResourceLinkCard";
import { titleCase } from "@/lib/format";
import {
  getJourneyContent,
  groupStepsByCategory,
  toResourceLink,
} from "@/lib/journeyContent";
import { setStepComplete } from "@/lib/session";
import type { RecoveryStep, ResourceRecommendation } from "@/lib/types";

interface RecoveryJourneyProps {
  steps: RecoveryStep[];
  completedSteps: string[];
  stepResources: Record<string, ResourceRecommendation[]>;
}

export function RecoveryJourney({
  steps,
  completedSteps,
  stepResources,
}: RecoveryJourneyProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    null
  );
  const panelIdBase = useId();
  const groups = groupStepsByCategory(steps, completedSteps);

  if (groups.length === 0) {
    return (
      <section aria-label="Your Recovery Journey" className="w-full">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Your Recovery Journey
        </h2>
        <p className="mt-2 rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
          We couldn&apos;t identify specific recovery steps from your
          description yet. You can talk to a person below, or start over and
          tell us a bit more about what happened.
        </p>
      </section>
    );
  }

  const firstPendingIndex = groups.findIndex((group) => !group.done);

  return (
    <section aria-label="Your Recovery Journey" className="w-full">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
        Your Recovery Journey
      </h2>
      <ol className="mt-3 flex flex-col gap-2">
        {groups.map((group, index) => {
          const isCurrent = index === firstPendingIndex;
          const isExpanded = expandedCategory === group.category;
          const panelId = `${panelIdBase}-${group.category}`;
          const content = getJourneyContent(group.category);
          const official = stepResources[group.category] ?? [];
          const links =
            official.length > 0 ? official.map(toResourceLink) : content.links;

          return (
            <li key={group.category} className="w-full">
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() =>
                  setExpandedCategory(isExpanded ? null : group.category)
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
                      group.done
                        ? "bg-success text-white"
                        : isCurrent
                          ? "bg-primary text-white"
                          : "bg-border text-muted"
                    }`}
                  >
                    {group.done ? "✓" : index + 1}
                  </span>
                  <span
                    className={
                      group.done
                        ? "text-muted line-through"
                        : "font-medium text-foreground"
                    }
                  >
                    {titleCase(group.category)}
                  </span>
                  {group.done && <span className="sr-only">(done)</span>}
                </span>
                <span className="flex items-center gap-2">
                  {isCurrent && (
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
                  <ul className="flex flex-col gap-1 text-sm font-medium text-foreground">
                    {group.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-sm text-muted">{content.guidance}</p>

                  <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    {official.length > 0
                      ? "Official sources for your situation"
                      : "Helpful resources"}
                  </h3>
                  <ul className="mt-2 flex flex-col gap-3">
                    {links.map((link) => (
                      <ResourceLinkCard key={link.url} link={link} />
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/guide?step=${encodeURIComponent(group.category)}`}
                      className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-contrast hover:bg-primary-dark"
                    >
                      Get personalized help &rarr;
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setStepComplete(group.category, !group.done)
                      }
                      className="rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
                    >
                      {group.done ? "Mark as not done" : "Mark step complete"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
