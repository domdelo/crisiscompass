"use client";

import { useId, useState } from "react";
import { ApiError, checkForScam } from "@/lib/api";
import type { ScamCheckResponse } from "@/lib/types";

const RISK_LABELS: Record<string, string> = {
  possible_scam: "This message has signs of a scam",
  likely_safe: "No major warning signs found",
};

function riskLabel(risk: string): string {
  return (
    RISK_LABELS[risk] ??
    risk.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

interface ScamShieldProps {
  saved: { message: string; result: ScamCheckResponse } | null;
  onChecked: (message: string, result: ScamCheckResponse) => void;
}

export function ScamShield({ saved, onChecked }: ScamShieldProps) {
  const [message, setMessage] = useState(saved?.message ?? "");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const result = status === "submitting" ? null : saved?.result ?? null;
  const textareaId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (message.trim().length === 0) {
      setStatus("error");
      setErrorMessage("Paste the message you want checked.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await checkForScam({ message });
      onChecked(message, response);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Couldn't check that message right now. Please try again."
      );
    }
  }

  return (
    <section
      aria-label="Scam Shield"
      className="w-full rounded-lg border border-border bg-surface p-6"
    >
      <h2 className="text-base font-semibold text-foreground">
        Check a suspicious message
      </h2>
      <p className="mt-1 text-sm text-muted">
        Not sure if a disaster-assistance message is real? Paste it below.
      </p>

      <form onSubmit={handleSubmit} className="mt-4" noValidate>
        <label htmlFor={textareaId} className="sr-only">
          Suspicious message text
        </label>
        <textarea
          id={textareaId}
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="FEMA APPROVED: Pay a $75 processing fee at this link..."
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
          {status === "submitting" ? "Checking…" : "Check this message"}
        </button>
      </form>

      {result && (
        <div className="mt-5 rounded-md bg-warning-bg p-4">
          <p className="font-semibold text-warning">
            {riskLabel(result.risk)}
          </p>

          {result.warning_signs.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-foreground">
              {result.warning_signs.map((sign) => (
                <li key={sign}>{sign}</li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-sm text-foreground">
            {result.recommendation}
          </p>

          <a
            href={result.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-primary underline"
          >
            {result.source_title}
          </a>
        </div>
      )}
    </section>
  );
}
