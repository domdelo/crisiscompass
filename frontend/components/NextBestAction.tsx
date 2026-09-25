"use client";

import { useId, useState } from "react";
import { getJourneyContent } from "@/lib/journeyContent";

interface NextBestActionProps {
  action: string;
  category: string | null;
}

export function NextBestAction({ action, category }: NextBestActionProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const content = category ? getJourneyContent(category) : null;

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
        {content && (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls={panelId}
            className="shrink-0 rounded-full bg-action-contrast px-5 py-2.5 text-sm font-semibold text-action transition-colors hover:bg-action-contrast/90"
          >
            {open ? "Hide steps" : "Start →"}
          </button>
        )}
      </div>

      {open && content && (
        <div
          id={panelId}
          className="mt-4 rounded-md bg-surface p-4 text-foreground"
        >
          <p className="text-sm text-muted">{content.guidance}</p>
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
        </div>
      )}
    </section>
  );
}
