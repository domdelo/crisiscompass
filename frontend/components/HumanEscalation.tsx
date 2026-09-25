"use client";

import { useId, useState } from "react";
import { ApiError, escalateToHuman } from "@/lib/api";
import { titleCase } from "@/lib/format";
import type { EscalationResponse, RecoveryPassport } from "@/lib/types";

interface HumanEscalationProps {
  passport: RecoveryPassport;
  actionsTaken: string[];
  result: EscalationResponse | null;
  onEscalated: (result: EscalationResponse) => void;
}

export function HumanEscalation({
  passport,
  actionsTaken,
  result,
  onEscalated,
}: HumanEscalationProps) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (reason.trim().length === 0) {
      setStatus("error");
      setErrorMessage("Let us know why you'd like to talk to a person.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await escalateToHuman({
        passport,
        reason,
        actions_taken: actionsTaken,
      });
      onEscalated(response);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Couldn't reach a human representative right now. Please try again."
      );
    }
  }

  if (result) {
    const summary = result.handoff_summary;

    return (
      <section
        aria-label="Human Handoff Summary"
        className="w-full rounded-lg border border-primary bg-primary/5 p-6"
      >
        <h2 className="text-base font-semibold text-foreground">
          We&apos;ll carry your context forward
        </h2>
        <p className="mt-1 text-sm text-muted">
          You won&apos;t need to start over. Here&apos;s what a human
          representative will see.
        </p>

        <dl className="mt-4 flex flex-col gap-3 text-sm">
          {summary.disaster && (
            <div>
              <dt className="font-semibold text-foreground">Disaster</dt>
              <dd className="text-muted">{titleCase(summary.disaster)}</dd>
            </div>
          )}
          {summary.location && (
            <div>
              <dt className="font-semibold text-foreground">Location</dt>
              <dd className="text-muted">{summary.location}</dd>
            </div>
          )}
          <div>
            <dt className="font-semibold text-foreground">Household</dt>
            <dd className="text-muted">{summary.household_summary}</dd>
          </div>
          {summary.immediate_needs.length > 0 && (
            <div>
              <dt className="font-semibold text-foreground">
                Immediate needs
              </dt>
              <dd className="text-muted">
                {summary.immediate_needs.map(titleCase).join(", ")}
              </dd>
            </div>
          )}
          {summary.barriers.length > 0 && (
            <div>
              <dt className="font-semibold text-foreground">Barriers</dt>
              <dd className="text-muted">
                {summary.barriers.map(titleCase).join(", ")}
              </dd>
            </div>
          )}
          {summary.actions_taken.length > 0 && (
            <div>
              <dt className="font-semibold text-foreground">
                Already reviewed
              </dt>
              <dd className="text-muted">
                {summary.actions_taken.join(", ")}
              </dd>
            </div>
          )}
          <div>
            <dt className="font-semibold text-foreground">
              Reason for escalation
            </dt>
            <dd className="text-muted">{summary.reason_for_escalation}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Your privacy</dt>
            <dd className="text-muted">{summary.sensitive_data_collected}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section
      aria-label="Get human help"
      className="w-full rounded-lg border border-border bg-surface p-6"
    >
      <h2 className="text-base font-semibold text-foreground">
        Talk to a person
      </h2>
      <p className="mt-1 text-sm text-muted">
        We&apos;ll pass along what you&apos;ve already told us so you
        don&apos;t have to repeat yourself.
      </p>

      <form onSubmit={handleSubmit} className="mt-4" noValidate>
        <label
          htmlFor={textareaId}
          className="mb-2 block text-sm font-medium text-foreground"
        >
          What do you need help with?
        </label>
        <textarea
          id={textareaId}
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Documentation requirements are unclear."
          className="w-full rounded-md border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted focus-visible:outline-none"
          aria-invalid={status === "error"}
          aria-describedby={
            status === "error" ? `${textareaId}-error` : undefined
          }
          disabled={status === "submitting"}
        />

        {status === "error" && errorMessage && (
          <p
            id={`${textareaId}-error`}
            role="alert"
            className="mt-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Connecting…" : "Get human help"}
        </button>
      </form>
    </section>
  );
}
