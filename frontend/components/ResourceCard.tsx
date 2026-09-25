import type { ResourceRecommendation } from "@/lib/types";

interface ResourceCardProps {
  resource: ResourceRecommendation;
}

const ELIGIBILITY_LABELS: Record<string, string> = {
  potential_match: "Potential match",
  possible_match: "May be relevant to your situation",
};

function eligibilityLabel(status: string): string {
  return (
    ELIGIBILITY_LABELS[status] ??
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <li className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {resource.name}
          </h3>
          <p className="text-sm text-muted">{resource.agency}</p>
        </div>
        <span className="shrink-0 rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success">
          {eligibilityLabel(resource.eligibility_status)}
        </span>
      </div>

      <p className="mt-3 text-sm text-foreground">{resource.reason}</p>

      {resource.required_information.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
            You may need
          </h4>
          <ul className="mt-1 list-inside list-disc text-sm text-muted">
            {resource.required_information.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={resource.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
        >
          View Official Source: {resource.source_title}
        </a>
      </div>
    </li>
  );
}
