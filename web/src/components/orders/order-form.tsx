import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultPickupValue } from "@/lib/format";
import type { CreateOrderInput } from "@/lib/orders/types";

type Fields = {
  customerName: string;
  itemName: string;
  quantity: string;
  pickupTime: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

function validate(values: Fields): Errors {
  const errors: Errors = {};

  if (!values.customerName.trim()) {
    errors.customerName = "Customer name is required.";
  } else if (values.customerName.trim().length < 2) {
    errors.customerName = "Enter at least 2 characters.";
  }

  if (!values.itemName.trim()) errors.itemName = "Item name is required.";

  const quantity = Number(values.quantity);
  if (!values.quantity.trim()) {
    errors.quantity = "Quantity is required.";
  } else if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = "Enter a whole number of 1 or more.";
  } else if (quantity > 500) {
    errors.quantity = "Quantity cannot exceed 500 per order.";
  }

  if (!values.pickupTime) {
    errors.pickupTime = "Pickup time is required.";
  } else if (Number.isNaN(new Date(values.pickupTime).getTime())) {
    errors.pickupTime = "Enter a valid date and time.";
  }

  return errors;
}

export function OrderForm({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (input: CreateOrderInput) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [values, setValues] = useState<Fields>({
    customerName: "",
    itemName: "",
    quantity: "1",
    pickupTime: defaultPickupValue(),
  });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});

  const setField = (key: keyof Fields, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) setErrors(validate(next));
  };

  const blur = (key: keyof Fields) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched({ customerName: true, itemName: true, quantity: true, pickupTime: true });
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      customerName: values.customerName.trim(),
      itemName: values.itemName.trim(),
      quantity: Number(values.quantity),
      pickupTime: values.pickupTime,
    });
  };

  const field = (key: keyof Fields, label: string, extra: React.ReactNode) => (
    <div className="grid gap-1.5">
      <Label htmlFor={key} className="text-xs font-semibold tracking-wide uppercase">
        {label}
      </Label>
      {extra}
      {errors[key] ? (
        <p id={`${key}-error`} role="alert" className="text-xs text-destructive">
          {errors[key]}
        </p>
      ) : null}
    </div>
  );

  const inputProps = (key: keyof Fields) => ({
    id: key,
    name: key,
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setField(key, event.target.value),
    onBlur: () => blur(key),
    "aria-invalid": Boolean(errors[key]),
    ...(errors[key] ? { "aria-describedby": `${key}-error` } : {}),
    className: "h-9 bg-card",
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field(
          "customerName",
          "Customer name",
          <Input {...inputProps("customerName")} placeholder="e.g. Marion Ellery" autoComplete="off" />,
        )}
        {field(
          "itemName",
          "Item name",
          <Input {...inputProps("itemName")} placeholder="e.g. Cardamom Bun" autoComplete="off" />,
        )}
        {field(
          "quantity",
          "Quantity",
          <Input {...inputProps("quantity")} type="number" min={1} max={500} step={1} />,
        )}
        {field("pickupTime", "Pickup time", <Input {...inputProps("pickupTime")} type="datetime-local" />)}
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
