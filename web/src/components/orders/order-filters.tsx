import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/lib/orders/types";

export type StatusFilter = OrderStatus | "all";

export function OrderFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  resultCount,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  resultCount?: number;
}) {
  const options: StatusFilter[] = ["all", ...ORDER_STATUSES];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search order ID, customer, item"
          aria-label="Search orders"
          className="h-9 bg-card pl-8"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        <div
          role="group"
          aria-label="Filter by status"
          className="flex items-center gap-1 rounded-full border border-border bg-card p-1"
        >
          {options.map((option) => {
            const active = option === status;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusChange(option)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {option === "all" ? "All" : STATUS_LABELS[option]}
              </button>
            );
          })}
        </div>
        {typeof resultCount === "number" ? (
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
            {resultCount} {resultCount === 1 ? "order" : "orders"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
