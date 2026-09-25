"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ResourceLinkCard } from "@/components/ResourceLinkCard";
import { titleCase } from "@/lib/format";
import {
  askableQuestions,
  getGuideStep,
  initialAnswers,
  type GuideAnswers,
  type GuideQuestion,
} from "@/lib/guideContent";
import {
  setStepComplete,
  updateSession,
  useHydrated,
  useStoredSession,
  type GuideProgress,
  type StoredSession,
} from "@/lib/session";

interface RecoveryGuideProps {
  initialStep: string | null;
}

export function RecoveryGuide({ initialStep }: RecoveryGuideProps) {
  const hydrated = useHydrated();
  const session = useStoredSession();

  if (!hydrated) return null;

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Let&apos;s start with what happened
        </h1>
        <p className="mt-2 text-muted">
          We need a little information about your situation before we can
          guide you through your recovery.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-action px-6 py-3 font-semibold text-action-contrast hover:bg-action-dark"
        >
          Tell us what happened &rarr;
        </Link>
      </div>
    );
  }

  return <GuideFlow session={session} initialStep={initialStep} />;
}

function tabId(category: string) {
  return `guide-tab-${category}`;
}

function saveProgress(category: string, progress: GuideProgress) {
  updateSession((session) => ({
    ...session,
    guideProgress: { ...session.guideProgress, [category]: progress },
  }));
}

interface GuideFlowProps {
  session: StoredSession;
  initialStep: string | null;
}

function GuideFlow({ session, initialStep }: GuideFlowProps) {
  const { plan: steps, passport } = session.recovery;
  const completedSteps = session.completedSteps ?? [];

  const [activeCategory, setActiveCategory] = useState(
    steps.some((step) => step.category === initialStep)
      ? (initialStep as string)
      : steps[0]?.category ?? "general"
  );

  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusHeading = useRef(false);

  const activeIndex = steps.findIndex(
    (step) => step.category === activeCategory
  );
  const activeStep = steps[activeIndex];
  const guide = getGuideStep(activeCategory);
  const saved = session.guideProgress?.[activeCategory];
  const answers = saved?.answers ?? initialAnswers(guide, passport);
  const questions = askableQuestions(guide, passport, answers);
  const position = Math.min(saved?.position ?? 0, questions.length);
  const finished = position >= questions.length;
  const nextStep = steps[activeIndex + 1];

  useEffect(() => {
    if (shouldFocusHeading.current) {
      headingRef.current?.focus();
      shouldFocusHeading.current = false;
    }
  }, [activeCategory, position]);

  function isComplete(category: string): boolean {
    return completedSteps.includes(category);
  }

  function selectTab(category: string) {
    setActiveCategory(category);
    window.history.replaceState(
      null,
      "",
      `/guide?step=${encodeURIComponent(category)}`
    );
  }

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    let nextIndex: number;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % steps.length;
    else if (event.key === "ArrowLeft")
      nextIndex = (index - 1 + steps.length) % steps.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = steps.length - 1;
    else return;

    event.preventDefault();
    const category = steps[nextIndex].category;
    selectTab(category);
    document.getElementById(tabId(category))?.focus();
  }

  function answerQuestion(question: GuideQuestion, value: string) {
    const index = questions.indexOf(question);
    const kept: GuideAnswers = initialAnswers(guide, passport);
    for (const earlier of questions.slice(0, index)) {
      if (answers[earlier.id] !== undefined) {
        kept[earlier.id] = answers[earlier.id];
      }
    }
    kept[question.id] = value;

    const nextPosition = index + 1;
    const nowFinished =
      nextPosition >= askableQuestions(guide, passport, kept).length;

    shouldFocusHeading.current = true;
    saveProgress(activeCategory, { answers: kept, position: nextPosition });
    if (nowFinished) setStepComplete(activeCategory, true);
  }

  function goBack() {
    shouldFocusHeading.current = true;
    saveProgress(activeCategory, {
      answers,
      position: Math.max(0, position - 1),
    });
  }

  function retake() {
    shouldFocusHeading.current = true;
    saveProgress(activeCategory, {
      answers: initialAnswers(guide, passport),
      position: 0,
    });
    setStepComplete(activeCategory, false);
  }

  function goToNextStep() {
    if (!nextStep) return;
    shouldFocusHeading.current = true;
    selectTab(nextStep.category);
  }

  const currentQuestion = questions[position];
  const result = finished ? guide.buildResult(answers, passport) : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:px-8">
      <div>
        <Link
          href="/"
          className="text-sm font-semibold text-primary underline"
        >
          &larr; Back to my plan
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Your recovery guide
        </h1>
        <p className="mt-2 text-muted">
          Answer a few quick questions for each step. We&apos;ll point you to
          resources that fit your situation.
        </p>
      </div>

      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <div
          role="tablist"
          aria-label="Recovery journey steps"
          className="flex min-w-max gap-2 border-b border-border"
        >
          {steps.map((step, index) => {
            const selected = step.category === activeCategory;
            const complete = isComplete(step.category);
            return (
              <button
                key={step.category}
                id={tabId(step.category)}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="guide-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(step.category)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                    complete
                      ? "bg-success text-white"
                      : selected
                        ? "bg-primary text-white"
                        : "bg-border text-muted"
                  }`}
                >
                  {complete ? "✓" : index + 1}
                </span>
                {titleCase(step.category)}
                {complete && <span className="sr-only">(done)</span>}
              </button>
            );
          })}
        </div>
      </div>

      <section
        id="guide-panel"
        role="tabpanel"
        aria-labelledby={tabId(activeCategory)}
        className="rounded-lg border border-border bg-surface p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Step {activeIndex + 1} of {steps.length}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-foreground">
          {activeStep?.action}
        </h2>

        {currentQuestion && (
          <div className="mt-5">
            <p className="text-sm text-muted">{guide.intro}</p>

            <div className="mt-4">
              <p className="text-xs font-semibold text-muted">
                Question {position + 1} of {questions.length}
              </p>
              <div
                aria-hidden="true"
                className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border"
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${(position / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5">
              <h3
                id="guide-question"
                ref={headingRef}
                tabIndex={-1}
                className="text-lg font-semibold text-foreground"
              >
                {currentQuestion.prompt}
              </h3>
              <div
                role="group"
                aria-labelledby="guide-question"
                className="mt-4 flex flex-col gap-2"
              >
                {currentQuestion.options.map((option) => {
                  const chosen = answers[currentQuestion.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={chosen}
                      onClick={() =>
                        answerQuestion(currentQuestion, option.value)
                      }
                      className={`w-full rounded-md border px-4 py-3 text-left font-medium transition-colors hover:border-primary hover:bg-primary/5 ${
                        chosen
                          ? "border-primary bg-primary/5 text-primary-dark"
                          : "border-border bg-background text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {position > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="mt-4 text-sm font-semibold text-primary underline"
              >
                &larr; Previous question
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="mt-5">
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="text-lg font-semibold text-foreground"
            >
              {result.headline}
            </h3>

            {result.tips.length > 0 && (
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-foreground">
                {result.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            )}

            <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted">
              Resources for your situation
            </h4>
            <ul className="mt-2 flex flex-col gap-3">
              {result.links.map((link) => (
                <ResourceLinkCard key={link.url} link={link} />
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              {nextStep ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="rounded-full bg-action px-5 py-2.5 text-sm font-semibold text-action-contrast hover:bg-action-dark"
                >
                  Next: {titleCase(nextStep.category)} &rarr;
                </button>
              ) : (
                <Link
                  href="/"
                  className="rounded-full bg-action px-5 py-2.5 text-sm font-semibold text-action-contrast hover:bg-action-dark"
                >
                  Back to my plan
                </Link>
              )}
              <button
                type="button"
                onClick={retake}
                className="rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                Change my answers
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
