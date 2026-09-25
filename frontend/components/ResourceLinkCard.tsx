import type { ResourceLink } from "@/lib/resourceLinks";

export function ResourceLinkCard({ link }: { link: ResourceLink }) {
  return (
    <li className="rounded-md border border-border bg-background p-3">
      <p className="text-sm font-semibold text-foreground">{link.title}</p>
      <p className="text-xs text-muted">{link.agency}</p>
      <p className="mt-1 text-sm text-foreground">{link.description}</p>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary underline"
      >
        Visit {link.agency} <span aria-hidden="true">&#8599;</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </li>
  );
}
