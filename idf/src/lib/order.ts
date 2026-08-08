import type { Item } from '../data/catalog';
import { BUSINESS, UPI, inr } from './constants';

export interface Customer {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  notes: string;
  fulfilment: 'delivery' | 'pickup';
}

/**
 * How the customer chose to pay.
 *  upi   — scanned the QR / opened a UPI app
 *  later — reserving now, settling at the showroom
 *
 * Card, net banking and wallets arrive together with the Razorpay
 * integration — see UPI section of HANDOVER.md.
 */
export type PayMethod = 'upi' | 'later';

export interface OrderPayload {
  orderId: string;
  customer: Customer;
  items: { item: Item; metres: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  isWholesale: boolean;
  method: PayMethod;
  paid: boolean;
  /** UPI transaction ID, if the customer entered one — helps the shop reconcile. */
  reference: string;
}

/** Short human-readable order reference, e.g. IDLF-4F92. */
export const newOrderId = () =>
  `IDLF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

/**
 * The message the SHOWROOM receives on WhatsApp.
 * Opens in the customer's WhatsApp addressed to the shop, so the shop
 * sees the customer's real number attached to the chat.
 */
export function ownerMessage(o: OrderPayload) {
  const lines = o.items
    .map(
      (i, n) =>
        `${n + 1}. ${i.item.name}\n   ${i.metres} m × ${inr(i.item.pricePerMetre)} = ${inr(
          i.lineTotal,
        )}`,
    )
    .join('\n');

  const delivery =
    o.customer.fulfilment === 'pickup'
      ? 'Pickup at showroom'
      : `${o.customer.address}, ${o.customer.city} – ${o.customer.pincode}`;

  const payment = o.paid ? `PAID by UPI to ${UPI.vpa}` : 'To be settled at the showroom';

  return [
    `*NEW ORDER PLACED* — ${o.orderId}`,
    ``,
    `Order is been placed from ${o.customer.phone}. Here is the requirement:`,
    ``,
    `*Customer:* ${o.customer.name}`,
    `*Contact:* ${o.customer.phone}`,
    `*${o.customer.fulfilment === 'pickup' ? 'Collection' : 'Deliver to'}:* ${delivery}`,
    ``,
    `*Items*`,
    lines,
    ``,
    `Subtotal: ${inr(o.subtotal)}`,
    o.discount ? `Wholesale discount: -${inr(o.discount)}` : '',
    `Shipping: ${o.shipping === 0 ? 'Free' : inr(o.shipping)}`,
    `*TOTAL: ${inr(o.total)}*`,
    ``,
    `*Payment:* ${payment}`,
    o.paid && o.reference ? `*Transaction ID:* ${o.reference}` : '',
    o.customer.notes ? `\n*Notes:* ${o.customer.notes}` : '',
    ``,
    `— sent from ${BUSINESS.name} website`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** UPI deep link — opens GPay / PhonePe / Paytm / any UPI app. */
export function upiLink(o: OrderPayload) {
  const p = new URLSearchParams({
    pa: UPI.vpa,
    pn: UPI.payeeName,
    am: String(o.total),
    cu: 'INR',
    tn: `Order ${o.orderId}`,
  });
  return `upi://pay?${p.toString()}`;
}

export const waOrderLink = (o: OrderPayload) =>
  `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(ownerMessage(o))}`;
