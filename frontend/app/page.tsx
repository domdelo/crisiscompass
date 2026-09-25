"use client";

import { useState } from "react";
import { IntakeForm } from "@/components/IntakeForm";
import type { RecoveryPassport } from "@/lib/types";

export default function Home() {
  const [passport, setPassport] = useState<RecoveryPassport | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center px-6 py-16 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Tell us what happened
      </h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        Describe your situation in your own words. CrisisCompass will help
        figure out your next step.
      </p>

      <div className="mt-8 w-full">
        <IntakeForm onSuccess={setPassport} />
      </div>

      {passport && (
        <div className="mt-8 w-full rounded-md border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted">
          <p className="mb-2 font-medium text-foreground">
            Received (Recovery Passport UI coming in Phase 3):
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(passport, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
