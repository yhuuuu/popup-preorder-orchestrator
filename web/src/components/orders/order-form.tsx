import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { menuQuery, pickupSlotsQuery } from "@/lib/orders/queries";
import type { CreateOrderInput } from "@/lib/orders/types";

// One editable line of the order. `menuItemId` is empty until a flavour is
// picked, and quantity is a string so the input can be cleared while typing.
type ItemRow = { menuItemId: string; quantity: string };

type Errors = {
  customerName?: string;
  pickupSlot?: string;
  items?: string;
  rows?: Record<number, string>;
};

const MAX_ITEMS_PER_ORDER = 20;

export function OrderForm({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (input: CreateOrderInput) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const menu = useQuery(menuQuery());
  const slots = useQuery(pickupSlotsQuery());

  const [customerName, setCustomerName] = useState("");
  const [pickupSlot, setPickupSlot] = useState("");
  const [rows, setRows] = useState<ItemRow[]>([{ menuItemId: "", quantity: "1" }]);
  const [errors, setErrors] = useState<Errors>({});

  const menuItems = menu.data ?? [];

  const validate = (): Errors => {
    const next: Errors = {};
    const rowErrors: Record<number, string> = {};

    if (!customerName.trim()) {
      next.customerName = "Customer name is required.";
    } else if (customerName.trim().length < 2) {
      next.customerName = "Enter at least 2 characters.";
    }

    if (!pickupSlot) next.pickupSlot = "Pickup time is required.";

    if (rows.length === 0) next.items = "Add at least one flavour.";
    if (rows.length > MAX_ITEMS_PER_ORDER) {
      next.items = `An order can hold at most ${MAX_ITEMS_PER_ORDER} flavours.`;
    }

    rows.forEach((row, index) => {
      if (!row.menuItemId) {
        rowErrors[index] = "Choose a flavour.";
        return;
      }
      const quantity = Number(row.quantity);
      if (!row.quantity.trim() || !Number.isInteger(quantity) || quantity < 1) {
        rowErrors[index] = "Enter a whole number of 1 or more.";
      } else if (quantity > 500) {
        rowErrors[index] = "Quantity cannot exceed 500.";
      }
    });

    if (Object.keys(rowErrors).length > 0) next.rows = rowErrors;
    return next;
  };

  const updateRow = (index: number, changes: Partial<ItemRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, { menuItemId: "", quantity: "1" }]);

  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  // The API rejects the same flavour twice, so hide the ones already chosen
  // elsewhere rather than letting the user build an order that cannot be saved.
  const optionsFor = (index: number) => {
    const taken = new Set(rows.filter((_, i) => i !== index).map((row) => row.menuItemId));
    return menuItems.filter((item) => !taken.has(String(item.id)));
  };

  const totalQuantity = rows.reduce((sum, row) => {
    const quantity = Number(row.quantity);
    return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
  }, 0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      customer_name: customerName.trim(),
      pickup_slot: pickupSlot,
      items: rows.map((row) => ({
        menu_item_id: Number(row.menuItemId),
        quantity: Number(row.quantity),
      })),
    });
  };

  if (menu.isError || slots.isError) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">Could not load the menu.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check that the API is running, then try again.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            void menu.refetch();
            void slots.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="customerName" className="text-xs font-semibold tracking-wide uppercase">
            Customer name
          </Label>
          <Input
            id="customerName"
            name="customerName"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="e.g. Marion Ellery"
            autoComplete="off"
            aria-invalid={Boolean(errors.customerName)}
            className="h-9 bg-card"
          />
          {errors.customerName ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.customerName}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold tracking-wide uppercase">Pickup time</Label>
          <Select value={pickupSlot} onValueChange={setPickupSlot}>
            <SelectTrigger className="h-9 bg-card" aria-invalid={Boolean(errors.pickupSlot)}>
              <SelectValue placeholder="Select a pickup time" />
            </SelectTrigger>
            <SelectContent>
              {(slots.data ?? []).map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.pickupSlot ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.pickupSlot}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <Label className="text-xs font-semibold tracking-wide uppercase">Flavours</Label>
          <span className="text-xs text-muted-foreground">
            {totalQuantity} item{totalQuantity === 1 ? "" : "s"} total
          </span>
        </div>

        <div className="grid gap-2">
          {rows.map((row, index) => (
            <div key={index} className="grid gap-1.5">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Select
                    value={row.menuItemId}
                    onValueChange={(value) => updateRow(index, { menuItemId: value })}
                  >
                    <SelectTrigger className="h-9 w-full bg-card">
                      <SelectValue
                        placeholder={menu.isLoading ? "Loading menu…" : "Select a flavour"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {optionsFor(index).map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  type="number"
                  min={1}
                  max={500}
                  step={1}
                  value={row.quantity}
                  onChange={(event) => updateRow(index, { quantity: event.target.value })}
                  aria-label={`Quantity for flavour ${index + 1}`}
                  className="h-9 w-20 bg-card text-center"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeRow(index)}
                  disabled={rows.length === 1}
                  aria-label={`Remove flavour ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {errors.rows?.[index] ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.rows[index]}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {errors.items ? (
          <p role="alert" className="text-xs text-destructive">
            {errors.items}
          </p>
        ) : null}

        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={rows.length >= menuItems.length || rows.length >= MAX_ITEMS_PER_ORDER}
          >
            <Plus className="h-4 w-4" />
            Add another flavour
          </Button>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create Order"}
        </Button>
      </div>
    </form>
  );
}
