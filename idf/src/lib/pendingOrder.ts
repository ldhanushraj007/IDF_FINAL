/**
 * UNSENT ORDER TRACKING
 *
 * BE HONEST ABOUT THE LIMIT: a website hands the customer off to WhatsApp and
 * then loses all visibility. It cannot press Send for them, and it cannot
 * detect whether they did. Any code claiming otherwise is lying.
 *
 * What it CAN do is refuse to treat the order as finished until the customer
 * says they sent it, and keep nagging until they do. That is what this is:
 *
 *   1. Checkout writes the order here the moment WhatsApp is opened.
 *   2. The cart is NOT cleared and the order is NOT called complete.
 *   3. If they come back — same session or next week — a banner tells them the
 *      order never reached the showroom and offers one tap to send it again.
 *   4. Only the customer confirming "yes, I pressed Send" clears it.
 *
 * This turns the weakest step in the flow into the loudest one.
 */

const KEY = 'idlf_pending_order_v1';

export interface PendingOrder {
  orderId: string;
  total: number;
  /** Pre-built WhatsApp message so the retry needs no recalculation. */
  message: string;
  waLink: string;
  createdAt: number;
  /** How many times the customer opened WhatsApp without confirming. */
  attempts: number;
}

export function readPending(): PendingOrder | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingOrder;
    return p && p.orderId && p.waLink ? p : null;
  } catch {
    return null;
  }
}

export function writePending(p: PendingOrder): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — the in-page prompt still works this session */
  }
  notify();
}

export function bumpAttempt(): void {
  const p = readPending();
  if (!p) return;
  writePending({ ...p, attempts: p.attempts + 1 });
}

export function clearPending(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  notify();
}

/* Lets the banner react immediately, in the same tab, without polling. */
const EVENT = 'idlf:pending-changed';
const notify = () => window.dispatchEvent(new Event(EVENT));

export function subscribePending(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('storage', fn);
  };
}
