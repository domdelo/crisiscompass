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
import type {
  RecoveryPassport as RecoveryPassportData,
  RecoveryState,
  ResourceRecommendation,
} from "@/lib/types";

export default function Home() {
  const [recovery, setRecovery] = useState<RecoveryState | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [resources, setResources] = useState<ResourceRecommendation[]>([]);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [showScamShield, setShowScamShield] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [startedAction, setStartedAction] = useState<string | null>(null);
  const recoveryHeadingRef = useRef<HTMLHeadingElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  function handleStart(action: string) {
    setStartedAction(action);
    resourcesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  useEffect(() => {
    if (recovery) {
      recoveryHeadingRef.current?.focus();
    }
  }, [recovery]);

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
      return;
    }

    try {
      const { resources: found } = await getResources({
        location: passport.location ?? "",
        needs: passport.immediate_needs,
        barriers: passport.barriers,
      });
      setResources(found);
    } catch (error) {
      setResourcesError(
        error instanceof ApiError
          ? error.message
          : "Couldn't load trusted resources right now."
      );
    }
  }

  const nextBestAction = recovery?.next_best_action ?? null;

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
          <h1 ref={recoveryHeadingRef} tabIndex={-1} className="sr-only">
            Your recovery plan
          </h1>

          <RecoveryPassport passport={recovery.passport} />

          {nextBestAction && (
            <NextBestAction
              action={nextBestAction}
              started={startedAction === nextBestAction}
              onStart={() => handleStart(nextBestAction)}
            />
          )}

          <RecoveryJourney steps={recovery.plan} />

          <section
            ref={resourcesRef}
            aria-label="Trusted Resources"
            className="w-full scroll-mt-4"
          >
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
