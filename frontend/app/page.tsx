"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, buildRecoveryPlan, getResources } from "@/lib/api";
import { IntakeForm } from "@/components/IntakeForm";
import { RecoveryPassport } from "@/components/RecoveryPassport";
import { NextBestAction } from "@/components/NextBestAction";
import { RecoveryJourney } from "@/components/RecoveryJourney";
import { ResourceCard } from "@/components/ResourceCard";
import { ScamShield } from "@/components/ScamShield";
import { HumanEscalation } from "@/components/HumanEscalation";
import {
  clearSession,
  saveSession,
  useHydrated,
  useStoredSession,
} from "@/lib/session";
import type {
  RecoveryPassport as RecoveryPassportData,
  RecoveryState,
} from "@/lib/types";

export default function Home() {
  const hydrated = useHydrated();
  const session = useStoredSession();
  const recovery = session?.recovery ?? null;
  const resources = session?.resources ?? [];
  const hasRecovery = recovery !== null;

  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [showScamShield, setShowScamShield] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const recoveryHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (hasRecovery) {
      recoveryHeadingRef.current?.focus();
    }
  }, [hasRecovery]);

  async function handleIntakeSuccess(passport: RecoveryPassportData) {
    setRecoveryError(null);
    setResourcesError(null);

    let state: RecoveryState;
    try {
      state = await buildRecoveryPlan({ passport });
    } catch (error) {
      setRecoveryError(
        error instanceof ApiError
          ? error.message
          : "We saved your situation, but couldn't build your recovery plan. Please try again."
      );
      return;
    }
    saveSession({ recovery: state, resources: [] });

    try {
      const { resources: found } = await getResources({
        location: passport.location ?? "",
        needs: passport.immediate_needs,
        barriers: passport.barriers,
      });
      saveSession({ recovery: state, resources: found });
    } catch (error) {
      setResourcesError(
        error instanceof ApiError
          ? error.message
          : "Couldn't load trusted resources right now."
      );
    }
  }

  function handleStartOver() {
    clearSession();
    setResourcesError(null);
    setShowScamShield(false);
    setShowEscalation(false);
  }

  if (!hydrated) return null;

  const nextBestAction = recovery?.next_best_action ?? null;
  const nextBestActionCategory =
    recovery?.plan.find((step) => step.action === nextBestAction)?.category ??
    recovery?.plan[0]?.category ??
    null;
  const guideHref = nextBestActionCategory
    ? `/guide?step=${encodeURIComponent(nextBestActionCategory)}`
    : "/guide";

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
          <div className="flex items-center justify-between gap-4">
            <h1
              ref={recoveryHeadingRef}
              tabIndex={-1}
              className="text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Your recovery plan
            </h1>
            <button
              type="button"
              onClick={handleStartOver}
              className="text-sm font-semibold text-primary underline"
            >
              Start over
            </button>
          </div>

          <RecoveryPassport passport={recovery.passport} />

          {nextBestAction && (
            <NextBestAction action={nextBestAction} guideHref={guideHref} />
          )}

          <RecoveryJourney steps={recovery.plan} />

          <section aria-label="Trusted Resources" className="w-full">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Trusted Resources
            </h2>

            {resourcesError && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {resourcesError}
              </p>
            )}

            {resources.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-4">
                {resources.map((resource) => (
                  <ResourceCard key={resource.name} resource={resource} />
                ))}
              </ul>
            ) : (
              !resourcesError && (
                <p className="mt-2 text-sm text-muted">
                  No resources found yet for your situation.
                </p>
              )
            )}
          </section>

          <div className="flex w-full flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowScamShield((prev) => !prev)}
              className="rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              {showScamShield
                ? "Hide scam check"
                : "Check a suspicious message"}
            </button>
            <button
              type="button"
              onClick={() => setShowEscalation((prev) => !prev)}
              className="rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              {showEscalation ? "Hide human help" : "Get human help"}
            </button>
          </div>

          {showScamShield && <ScamShield />}

          {showEscalation && (
            <HumanEscalation
              passport={recovery.passport}
              actionsTaken={resources.map(
                (resource) => `${resource.name} resources reviewed`
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
