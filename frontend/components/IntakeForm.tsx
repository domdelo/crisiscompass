"use client";

import { useId, useState } from "react";
import { ApiError, submitIntake } from "@/lib/api";
import type { RecoveryPassport } from "@/lib/types";

interface IntakeFormProps {
  onSuccess: (passport: RecoveryPassport) => void | Promise<void>;
}

export function IntakeForm({ onSuccess }: IntakeFormProps) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (message.trim().length === 0) {
      setStatus("error");
      setErrorMessage("Please describe what happened before continuing.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const passport = await submitIntake({ message });
      await onSuccess(passport);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again."
      );
      return;
    }

    setStatus("idle");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl" noValidate>
      <label
        htmlFor={textareaId}
        className="mb-2 block text-sm font-medium text-foreground"
      >
        Tell us what happened
      </label>
      <textarea
        id={textareaId}
        name="message"
        rows={5}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Our apartment flooded. I have two kids and we can't stay there tonight."
        className="w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus-visible:outline-none"
        aria-invalid={status === "error"}
        aria-describedby={status === "error" ? `${textareaId}-error` : undefined}
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
        className="mt-4 inline-flex items-center justify-center rounded-full bg-action px-6 py-3 text-base font-semibold text-action-contrast transition-colors hover:bg-action-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Finding your next step…" : "Find My Next Step →"}
      </button>

      <p className="mt-4 text-sm text-muted">
        We only ask for information needed to guide your recovery.
      </p>
    </form>
  );
}
