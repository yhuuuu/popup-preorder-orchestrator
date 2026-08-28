import type { Order, OrderStatus, WebhookEvent } from "./types";

const items = [
  "Sourdough Loaf",
  "Cardamom Bun",
  "Almond Croissant",
  "Olive Focaccia",
  "Miso Chocolate Cookie",
  "Rye Baguette",
  "Pistachio Danish",
  "Brown Butter Scone",
  "Lemon Poppy Cake",
  "Seeded Milk Bread",
  "Pain au Chocolat",
  "Fig Galette",
];

const customers = [
  "Marion Ellery",
  "Theo Vance",
  "Priya Raman",
  "Nils Bergstrom",
  "Camille Duarte",
  "Jonah Whitfield",
  "Ada Okonkwo",
  "Rosa Lindqvist",
  "Sam Beauchamp",
  "Elena Castellan",
  "Hugo Marchetti",
  "Wren Halloway",
  "Iris Tanaka",
  "Desmond Farr",
  "Noor Haddad",
  "Clara Bissette",
  "Owen Pemberton",
  "Maya Solberg",
  "Felix Aurand",
  "June Ashworth",
  "Otto Brenner",
  "Lila Fontaine",
  "Arun Mehta",
  "Greta Lindholm",
  "Micah Whitlock",
  "Sofia Delacroix",
  "Bennett Kaye",
  "Talia Rosenberg",
];

const statuses: OrderStatus[] = [
  "pending",
  "preparing",
  "ready",
  "pending",
  "ready",
  "cancelled",
  "preparing",
  "pending",
];

const notes = [
  "Pickup at the market stall, north entrance.",
  "Prefers a lighter bake.",
  "Sliced, please.",
  "Paid in advance.",
  "",
  "Gift box requested.",
];

/** Fixed base timestamp so mock data stays stable between renders. */
const BASE = new Date("2026-08-21T07:00:00Z").getTime();
const HOUR = 3_600_000;

const at = <T,>(arr: readonly T[], i: number): T => arr[i % arr.length]!;

export const mockOrders: Order[] = Array.from({ length: 28 }, (_, i) => {
  const id = `PO-${(1042 + i).toString()}`;
  return {
    id,
    customerName: at(customers, i),
    itemName: at(items, i),
    quantity: at([1, 2, 2, 3, 4, 6, 1, 12], i),
    pickupTime: new Date(BASE + (i % 9) * HOUR + (i % 3) * 20 * 60_000).toISOString(),
    status: at(statuses, i),
    createdAt: new Date(BASE - (i + 2) * 3 * HOUR).toISOString(),
    ...(at(notes, i) ? { notes: at(notes, i) } : {}),
  };
});

const eventTypes = [
  "order.created",
  "order.status_changed",
  "order.ready",
  "order.cancelled",
  "order.deleted",
];

const deliveryStatuses = ["success", "success", "failed", "retrying", "success"] as const;

export const mockWebhookEvents: WebhookEvent[] = Array.from({ length: 22 }, (_, i) => {
  const order = at(mockOrders, i);
  const deliveryStatus = at(deliveryStatuses, i);
  const attemptCount = deliveryStatus === "success" ? 1 : deliveryStatus === "retrying" ? 2 : 4;
  const createdAt = new Date(BASE - i * 40 * 60_000).toISOString();

  return {
    id: `evt_${(9001 + i).toString(36)}${i}`,
    orderId: order.id,
    eventType: at(eventTypes, i),
    deliveryStatus,
    attemptCount,
    createdAt,
    endpoint: "https://hooks.popupkitchen.co/orders",
    payload: {
      event: at(eventTypes, i),
      orderId: order.id,
      customerName: order.customerName,
      item: order.itemName,
      quantity: order.quantity,
      status: order.status,
      pickupTime: order.pickupTime,
    },
    attempts: Array.from({ length: attemptCount }, (_, a) => {
      const last = a === attemptCount - 1;
      const ok = deliveryStatus === "success" ? last : false;
      return {
        attempt: a + 1,
        at: new Date(new Date(createdAt).getTime() + a * 90_000).toISOString(),
        responseCode: ok ? 200 : deliveryStatus === "retrying" && last ? null : 503,
        message: ok
          ? "Delivered"
          : deliveryStatus === "retrying" && last
            ? "Queued for retry"
            : "Upstream returned 503 Service Unavailable",
      };
    }),
  };
});
