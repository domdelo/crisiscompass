export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 sm:px-8">
        <a href="/" className="flex flex-col leading-tight">
          <span className="text-lg font-semibold text-foreground">
            CrisisCompass
          </span>
          <span className="text-sm text-muted">
            Your next step when everything changes.
          </span>
        </a>
      </div>
    </header>
  );
}
