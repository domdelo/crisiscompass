export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center px-6 py-16 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Tell us what happened
      </h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        Describe your situation in your own words. CrisisCompass will help
        figure out your next step.
      </p>
      <p className="mt-8 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted">
        Intake form coming in Phase 2.
      </p>
    </div>
  );
}
