/** Central business information — everything on the site reads from here. */
export const BUSINESS = {
  name: 'In Design Luxury Fabrics',
  legalName: 'IN DESIGN LUXURY FABRICS',
  tagline: 'Curators of Haute Couture',
  city: 'Bengaluru',

  phoneDisplay: '088848 53153',
  phoneRaw: '+918884853153',
  whatsappNumber: '918884853153',

  email: 'hello@indesignluxuryfabrics.com',

  addressLine1: 'Shop No. 32, Ibrahim Sahib Street',
  addressLine2: 'Parallel to Commercial Street, Shivaji Nagar',
  addressLine3: 'Bengaluru, Karnataka 560001',

  instagram: 'https://www.instagram.com/in_design_luxury_fabrics',
  instagramHandle: '@in_design_luxury_fabrics',

  mapsLink:
    'https://www.google.com/maps/search/?api=1&query=Shop+No.+32%2C+Ibrahim+Sahib+Street%2C+Shivaji+Nagar%2C+Bengaluru%2C+Karnataka+560001',
  mapsEmbed:
    'https://www.google.com/maps?q=Shop+No.+32,+Ibrahim+Sahib+Street,+Shivaji+Nagar,+Bengaluru,+Karnataka+560001&output=embed',

  hours: [
    { days: 'Monday – Saturday', time: '10:30 AM – 8:30 PM' },
    { days: 'Sunday', time: '11:00 AM – 7:00 PM' },
  ],
} as const;

/**
 * UPI payment settings.
 * IMPORTANT: replace `vpa` with the shop's real UPI ID before going live.
 * Any UPI ID works — GPay / PhonePe / Paytm / bank VPA.
 */
export const UPI = {
  vpa: 'indesignfabrics@okhdfcbank',
  payeeName: 'In Design Luxury Fabrics',

  /**
   * By default the site GENERATES a QR code per order, encoding the exact
   * amount and order ID — so the customer's UPI app pre-fills both and
   * nothing has to be typed. This is the more reliable option and needs no
   * image file.
   *
   * If the shop would rather show their own printed/bank-issued QR sticker
   * instead, drop that image at `public/images/upi-qr.jpg` and set this to
   * '/images/upi-qr.jpg'. Trade-off: a static image can't encode the amount,
   * so the customer has to type it in themselves.
   */
  staticQrImage: '',
} as const;

/**
 * Payment.
 *
 * Right now the site takes UPI only (QR code + deep link — no gateway account
 * needed). Card and net banking are switched on later by connecting Razorpay:
 * that needs a Razorpay merchant account (business KYC) and a small checkout
 * integration, both easy to add without touching anything else here.
 */

/** Order settings. */
export const ORDER = {
  freeShippingAbove: 5000,
  shippingFlat: 149,
  wholesaleMinMetres: 20,
  wholesaleDiscount: 0.15, // 15% off at wholesale quantities
} as const;

/**
 * WHERE THE LIVE CATALOG COMES FROM.
 *
 * The site loads prices, stock and offers at page load — NOT at build time.
 * That means the shop can change a price and see it live without rebuilding.
 *
 * Two supported ways to run it:
 *
 *  1. JSON FILE (default). The shop edits the catalog in the built-in editor at
 *     yoursite.com/#/admin, downloads `catalog.json`, and uploads that one file
 *     to the host. No rebuild, no npm, no developer.
 *
 *  2. GOOGLE SHEET. Set `sheetCsvUrl` below to a published-to-web Google Sheet
 *     (File → Share → Publish to web → choose the sheet → CSV). The shop then
 *     edits prices and stock in Google Sheets on their phone and the site
 *     picks it up within a few minutes. Leave as '' to stay on the JSON file.
 */
export const CATALOG_SOURCE = {
  jsonUrl: '/catalog.json',
  reviewsUrl: '/reviews.json',
  sheetCsvUrl: '',
} as const;

/**
 * PIN for the built-in catalog editor at /#/admin.
 *
 * BE CLEAR-EYED ABOUT WHAT THIS IS: it keeps a curious visitor out of the
 * editor screen. It is NOT security — the PIN ships inside the site's
 * JavaScript and anyone determined can read it. That is acceptable here only
 * because the editor cannot change the live site by itself: it just prepares a
 * file that someone with host access still has to upload. Never reuse a PIN
 * here that protects anything else.
 */
export const ADMIN_PIN = '3216';

/** Reviews rated at or above this are offered for publishing. */
export const REVIEW_PUBLISH_THRESHOLD = 4;

export const waLink = (message: string) =>
  `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(message)}`;

export const WA_DEFAULT = waLink(
  'Hello In Design Luxury Fabrics! I would like to enquire about your couture fabrics.',
);

export const WA_VISIT = waLink(
  'Hello! I would like to plan a visit to your Commercial Street showroom.',
);

export const NAV_LINKS = [
  { href: '/#collections', label: 'Collections' },
  { href: '/#shop', label: 'Shop' },
  { href: '/about', label: 'About Us' },
  { href: '/#gallery', label: 'Gallery' },
  { href: '/#reviews', label: 'Reviews' },
  { href: '/#visit', label: 'Visit' },
] as const;

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
