"use client";

import { useState } from "react";
import { ApiError, buildRecoveryPlan } from "@/lib/api";
import { IntakeForm } from "@/components/IntakeForm";
import { RecoveryPassport } from "@/components/RecoveryPassport";
import { NextBestAction } from "@/components/NextBestAction";
import { RecoveryJourney } from "@/components/RecoveryJourney";
import type {
  RecoveryPassport as RecoveryPassportData,
  RecoveryState,
} from "@/lib/types";

export default function Home() {
  const [recovery, setRecovery] = useState<RecoveryState | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  async function handleIntakeSuccess(passport: RecoveryPassportData) {
    setRecoveryError(null);
    try {
      const state = await buildRecoveryPlan({ passport });
      setRecovery(state);
    } catch (error) {
      setRecoveryError(
        error instanceof ApiError
          ? error.message
          : "We saved your situation, but couldn't build your recovery plan. Please try again."
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-8 px-6 py-16 sm:px-8">
      {!recovery && (
        <>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Tell us what happened
            </h1>
            <p className="mt-3 max-w-xl text-lg text-muted">
              Describe your situation in your own words. CrisisCompass will
              help figure out your next step.
            </p>
          </div>

          <IntakeForm onSuccess={handleIntakeSuccess} />

          {recoveryError && (
            <p role="alert" className="text-sm text-danger">
              {recoveryError}
            </p>
          )}
        </>
      )}

      {recovery && (
        <div className="flex w-full flex-col gap-6">
          <RecoveryPassport passport={recovery.passport} />

          {recovery.next_best_action && (
            <NextBestAction action={recovery.next_best_action} />
          )}

          <RecoveryJourney steps={recovery.plan} />
        </div>
      )}
    </div>
  );
}
