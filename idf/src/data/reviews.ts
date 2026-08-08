export interface Review {
  name: string;
  city: string;
  rating: number;
  text: string;
  date: string;
}

/**
 * Approved reviews shown on the site.
 * New reviews submitted through the form reach the showroom on WhatsApp —
 * paste the good ones in here to publish them.
 */
export const REVIEWS: Review[] = [
  {
    name: 'Ananya Rao',
    city: 'Bengaluru',
    rating: 5,
    text: 'Sourced my wedding lehenga fabric here. The zari work is the real thing — my tailor confirmed it. Staff let me sit with six bolts for an hour without rushing me.',
    date: 'Mar 2026',
  },
  {
    name: 'Farhan Qureshi',
    city: 'Bengaluru',
    rating: 5,
    text: 'I buy in bulk for my boutique. Consistent quality across lots, fair wholesale rates, and they actually pick up the phone when I need a reorder.',
    date: 'Feb 2026',
  },
  {
    name: 'Meera Krishnan',
    city: 'Chennai',
    rating: 5,
    text: 'Ordered the Kanjivaram over WhatsApp and paid by UPI. Shipped next day, packed properly, exactly the shade shown. Trustworthy people.',
    date: 'Jan 2026',
  },
  {
    name: 'Priya Nair',
    city: 'Kochi',
    rating: 4,
    text: 'Beautiful tussar and linen-silk. Only wish the shop was bigger — it gets busy on weekends. Worth the trip regardless.',
    date: 'Dec 2025',
  },
];
