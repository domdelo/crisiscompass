import type { RecoveryPassport as RecoveryPassportData } from "@/lib/types";

interface RecoveryPassportProps {
  passport: RecoveryPassportData;
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function householdSummary(
  household: RecoveryPassportData["household"]
): string {
  const parts: string[] = [];
  if (household.adults) parts.push(`${household.adults} adult(s)`);
  if (household.children) parts.push(`${household.children} child(ren)`);
  return parts.length > 0 ? parts.join(", ") : "Household details pending";
}

export function RecoveryPassport({ passport }: RecoveryPassportProps) {
  const summaryParts = [
    passport.disaster ? titleCase(passport.disaster) : null,
    passport.location,
    householdSummary(passport.household),
  ].filter(Boolean);

  return (
    <section
      aria-label="Your Recovery Passport"
      className="w-full rounded-lg border border-border bg-surface p-6"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
        Your Recovery Passport
      </h2>
      <p className="mt-1 text-lg font-medium text-foreground">
        {summaryParts.join(" • ")}
      </p>

      {passport.immediate_needs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground">
            Immediate needs
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {passport.immediate_needs.map((need) => (
              <li
                key={need}
                className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary-dark"
              >
                {titleCase(need)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {passport.barriers.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground">Barriers</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {passport.barriers.map((barrier) => (
              <li
                key={barrier}
                className="rounded-full bg-warning-bg px-3 py-1 text-sm text-warning"
              >
                {titleCase(barrier)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
