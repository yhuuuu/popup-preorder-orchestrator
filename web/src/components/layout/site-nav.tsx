import { Link } from "@tanstack/react-router";

const linkClass =
  "rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function SiteNav() {
  return (
    <header>
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="block truncate font-display text-xl leading-none text-primary">
              Bakery Based
            </span>
            <span className="mt-0.5 block text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
              Pre-order desk
            </span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className={linkClass}
            >
              Orders
            </Link>
            <Link
              to="/webhooks"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className={linkClass}
            >
              Webhook Events
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
