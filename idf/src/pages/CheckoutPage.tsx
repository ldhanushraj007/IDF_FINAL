import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Trash2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BUSINESS, UPI, inr } from '../lib/constants';
import {
  newOrderId,
  ownerMessage,
  upiLink,
  waOrderLink,
  type Customer,
  type OrderPayload,
} from '../lib/order';
import { clearPending, writePending } from '../lib/pendingOrder';
import { saveOrder } from '../lib/customerApi';
import { trackInteraction } from '../lib/useTrackInteraction';
import AuthGate from '../components/AuthGate';

const EMPTY: Customer = {
  name: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
  notes: '',
  fulfilment: 'delivery',
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, discount, shipping, total, isWholesale, setMetres, remove, clear } = useCart();
  const { enabled: accountsEnabled, user, profile, saveProfile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [customer, setCustomer] = useState<Customer>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});
  const [orderId, setOrderId] = useState(newOrderId);
  const [paid, setPaid] = useState(false);
  const [reference, setReference] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);

  const order = useMemo<OrderPayload>(
    () => ({
      orderId,
      customer,
      items,
      subtotal,
      discount,
      shipping,
      total,
      isWholesale,
      method: paid ? 'upi' : 'later',
      paid,
      reference: reference.trim(),
    }),
    [orderId, customer, items, subtotal, discount, shipping, total, isWholesale, paid, reference],
  );

  useEffect(() => {
    if (step !== 2 || UPI.staticQrImage) return;
    QRCode.toDataURL(upiLink(order), {
      width: 450,
      margin: 1,
      color: { dark: '#1c0505', light: '#dec3b4' },
    })
      .then(setQr)
      .catch(() => setQr(''));
  }, [step, order]);

  useEffect(() => {
    if (!profile) return;
    setCustomer((c) => ({
      ...c,
      name: c.name || profile.name,
      phone: c.phone || profile.phone.replace(/^\+91/, ''),
      city: c.city || profile.city,
    }));
  }, [profile]);

  const validate = () => {
    const e: Partial<Record<keyof Customer, string>> = {};
    if (customer.name.trim().length < 2) e.name = 'Please enter your full name';
    if (!/^[6-9]\d{9}$/.test(customer.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid 10-digit mobile number';
    if (customer.fulfilment === 'delivery') {
      if (customer.address.trim().length < 6) e.address = 'Please enter your delivery address';
      if (customer.city.trim().length < 2) e.city = 'Please enter your city';
      if (!/^\d{6}$/.test(customer.pincode.trim())) e.pincode = 'Enter a valid 6-digit PIN code';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const field = (k: keyof Customer) => ({
    value: customer[k] as string,
    onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setCustomer((c) => ({ ...c, [k]: ev.target.value })),
  });

  const inputClass = (k: keyof Customer) =>
    `w-full rounded-[3px] border bg-night/50 px-4 py-3.5 text-[14px] text-ivory placeholder-ivory/35 outline-none transition-colors focus:border-gold ${
      errors[k] ? 'border-maroon' : 'border-gold/20'
    }`;

  const openWhatsApp = () => {
    const link = waOrderLink(order);
    writePending({
      orderId,
      total,
      message: ownerMessage(order),
      waLink: link,
      createdAt: Date.now(),
      attempts: 1,
    });

    items.forEach((line) => {
      trackInteraction(line.item.id, 'purchase');
    });

    if (accountsEnabled && user) {
      saveProfile({ name: customer.name, phone: customer.phone, city: customer.city });
      saveOrder({
        orderCode: orderId,
        items,
        subtotal,
        discount,
        shipping,
        total,
        requirement: customer.notes,
        fulfilment: customer.fulfilment,
        address: customer.address,
        city: customer.city,
        pincode: customer.pincode,
        paymentMethod: paid ? 'upi' : 'later',
        paid,
        paymentReference: reference.trim(),
      });
    }

    window.open(link, '_blank', 'noopener');
    setStep(3);
  };

  const retryWhatsApp = () => {
    window.open(waOrderLink(order), '_blank', 'noopener');
  };

  const confirmSent = () => {
    clearPending();
    setStep(4);
  };

  const finish = () => {
    clear();
    setCustomer(EMPTY);
    setStep(1);
    setPaid(false);
    setReference('');
    setOrderId(newOrderId());
    navigate('/');
  };

  const needsAuth = accountsEnabled && !user;

  if (items.length === 0 && step !== 4) {
    return (
      <div className="min-h-screen bg-night pt-28 pb-20 text-center flex items-center justify-center">
        <div className="container-lux max-w-md">
          <ShoppingBag className="mx-auto h-16 w-16 text-gold/40" strokeWidth={1} />
          <h1 className="mt-4 font-serif text-3xl text-ivory">Your cart is empty</h1>
          <p className="mt-2 text-[14px] text-ivory/60">
            Browse our haute couture & bridal fabrics to add items to your cart.
          </p>
          <Link to="/#shop" className="btn btn-gold btn-sheen mt-6 inline-flex">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night pt-24 pb-20 text-ivory">
      {/* Checkout Navigation Bar */}
      <div className="border-b border-gold/15 bg-chocolate/30 py-4">
        <div className="container-lux flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-[13px] text-ivory/60 hover:text-gold transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Store</span>
          </Link>

          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure Direct Checkout · Order {orderId}</span>
          </div>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="border-b border-gold/10 bg-night/80 py-6">
        <div className="container-lux max-w-4xl">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-gold/15 -z-0" />

            {[
              { num: 1, label: 'Details' },
              { num: 2, label: 'Payment' },
              { num: 3, label: 'WhatsApp Send' },
              { num: 4, label: 'Order Complete' },
            ].map((s) => {
              const active = step === s.num;
              const completed = step > s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center gap-2 bg-night px-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full font-nums text-[13px] font-bold transition-all ${
                      completed
                        ? 'bg-gold text-night'
                        : active
                          ? 'border-2 border-gold bg-night text-gold shadow-[0_0_15px_rgba(211,170,50,0.5)]'
                          : 'border border-ivory/20 bg-chocolate text-ivory/40'
                    }`}
                  >
                    {completed ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-[0.14em] hidden sm:block ${
                      active ? 'text-gold' : completed ? 'text-ivory/80' : 'text-ivory/40'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Page Layout */}
      <div className="container-lux mt-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Column: Interactive Form Steps (8 Cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-[4px] border border-gold/20 bg-chocolate/40 p-6 sm:p-8 shadow-xl">
              {/* STEP 1: Details */}
              {step === 1 && (
                <div>
                  {needsAuth ? (
                    <div>
                      <h2 className="font-serif text-2xl text-ivory">Sign in to checkout</h2>
                      <p className="mt-2 mb-6 text-[13px] text-ivory/60">
                        Sign in to save your order history, access your customer profile, and track your purchase.
                      </p>
                      <AuthGate compact />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-serif text-2xl text-ivory">Fulfillment Preference</h2>
                        <p className="mt-1 text-[13px] text-ivory/60">Choose how you wish to receive your luxury fabrics.</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {[
                            { id: 'delivery', label: 'Ship to Address', icon: Truck },
                            { id: 'pickup', label: 'Store Pickup', icon: Store },
                          ].map((f) => {
                            const Icon = f.icon;
                            const active = customer.fulfilment === f.id;
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setCustomer((c) => ({ ...c, fulfilment: f.id as any }))}
                                className={`flex items-center justify-center gap-2.5 rounded-[3px] border p-4 text-[12px] font-semibold uppercase tracking-[0.14em] transition-all ${
                                  active
                                    ? 'border-gold bg-gold/15 text-gold shadow-md'
                                    : 'border-gold/20 text-ivory/60 hover:border-gold/40'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{f.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <h2 className="font-serif text-2xl text-ivory">Customer Information</h2>
                        <div>
                          <input {...field('name')} placeholder="Full name *" className={inputClass('name')} />
                          {errors.name && <p className="mt-1 text-[11px] text-maroon">{errors.name}</p>}
                        </div>

                        <div>
                          <input
                            {...field('phone')}
                            inputMode="numeric"
                            placeholder="WhatsApp mobile number (10 digits) *"
                            className={inputClass('phone')}
                          />
                          {errors.phone && <p className="mt-1 text-[11px] text-maroon">{errors.phone}</p>}
                        </div>

                        {customer.fulfilment === 'delivery' && (
                          <div className="space-y-4 pt-2">
                            <h3 className="font-serif text-lg text-ivory">Shipping Address</h3>
                            <div>
                              <textarea
                                {...field('address')}
                                rows={2}
                                placeholder="Street address, building, apartment *"
                                className={inputClass('address')}
                              />
                              {errors.address && <p className="mt-1 text-[11px] text-maroon">{errors.address}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <input {...field('city')} placeholder="City *" className={inputClass('city')} />
                                {errors.city && <p className="mt-1 text-[11px] text-maroon">{errors.city}</p>}
                              </div>
                              <div>
                                <input
                                  {...field('pincode')}
                                  inputMode="numeric"
                                  placeholder="6-digit PIN code *"
                                  className={inputClass('pincode')}
                                />
                                {errors.pincode && <p className="mt-1 text-[11px] text-maroon">{errors.pincode}</p>}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <textarea
                            {...field('notes')}
                            rows={2}
                            placeholder="Order notes — color preference, tailoring requirement, urgency (optional)"
                            className={inputClass('notes')}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => validate() && setStep(2)}
                        className="btn btn-gold btn-sheen w-full text-[13px] py-4"
                      >
                        Continue to Payment & Review →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Payment */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-serif text-2xl text-ivory">Payment Method</h2>
                    <p className="mt-1 text-[13px] text-ivory/60">
                      Scan the dynamic QR code encoding exact order total of <span className="font-semibold text-gold">{inr(total)}</span>.
                    </p>
                  </div>

                  <div className="text-center rounded-[4px] border border-gold/20 bg-night/50 p-6">
                    <img
                      src={UPI.staticQrImage || qr}
                      alt="UPI payment QR code"
                      className="mx-auto h-64 w-64 rounded-[4px] border border-gold/30 bg-ivory object-contain p-3 shadow-lg"
                    />
                    <p className="mt-3 text-[12px] text-ivory/60">
                      Scan with Google Pay, PhonePe, Paytm, or any UPI App
                    </p>

                    <a href={upiLink(order)} className="btn btn-gold btn-sheen mt-4 w-full sm:hidden">
                      Open UPI App to Pay
                    </a>

                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(UPI.vpa);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1800);
                        }}
                        className="inline-flex items-center gap-2 rounded border border-gold/30 px-3 py-1.5 text-[12px] text-ivory/80 hover:text-gold transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-gold" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>UPI VPA: {UPI.vpa}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-gold/20 bg-night/30 p-4">
                      <input
                        type="checkbox"
                        checked={paid}
                        onChange={(e) => setPaid(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#d3aa32]"
                      />
                      <span className="text-[13px] leading-relaxed text-ivory/80">
                        I have completed the UPI payment of <strong className="text-gold">{inr(total)}</strong>.
                      </span>
                    </label>

                    {paid && (
                      <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="UPI Transaction ID / Ref No. (optional)"
                        className="w-full rounded-[3px] border border-gold/20 bg-night/50 px-4 py-3 text-[14px] text-ivory placeholder-ivory/35 outline-none focus:border-gold"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={openWhatsApp}
                    className="btn btn-gold btn-sheen w-full text-[13px] py-4"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {paid ? 'Send Order via WhatsApp' : 'Place Order — Pay at Showroom'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-2 text-[12px] text-ivory/50 hover:text-gold transition-colors"
                  >
                    ← Edit Details
                  </button>
                </div>
              )}

              {/* STEP 3: Confirm WhatsApp Send */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="rounded-[4px] border border-gold/40 bg-gold/10 p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-gold shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-serif text-xl text-ivory">One final action required</h3>
                        <p className="mt-2 text-[13px] leading-relaxed text-ivory/80">
                          WhatsApp has opened with your order requirement pre-typed. Please press <strong>Send</strong> in WhatsApp to dispatch your order directly to our Commercial Street showroom staff.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button type="button" onClick={confirmSent} className="btn btn-gold btn-sheen w-full text-[13px] py-4">
                    <Check className="h-5 w-5" />
                    Yes — I Pressed Send in WhatsApp
                  </button>

                  <div className="rounded-[4px] border border-gold/15 bg-night/40 p-4 space-y-3">
                    <p className="text-[12px] uppercase tracking-[0.14em] text-gold">Didn't open automatically?</p>
                    <button type="button" onClick={retryWhatsApp} className="btn btn-ghost-light w-full">
                      <MessageCircle className="h-4 w-4" /> Re-open WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(ownerMessage(order));
                        setMsgCopied(true);
                        setTimeout(() => setMsgCopied(false), 2200);
                      }}
                      className="w-full text-center text-[12px] text-ivory/60 hover:text-gold py-1"
                    >
                      {msgCopied ? '✓ Copy successful — paste in WhatsApp' : 'Copy order message manually'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Success */}
              {step === 4 && (
                <div className="py-8 text-center space-y-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-gold/15 shadow-[0_0_25px_rgba(211,170,50,0.4)]">
                    <Check className="h-10 w-10 text-gold" />
                  </div>

                  <div>
                    <h2 className="font-serif text-3xl text-ivory">Order Placed Successfully</h2>
                    <p className="mt-2 text-gold font-mono text-lg">Order ID: {orderId}</p>
                    <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-ivory/70">
                      Our showroom staff at Commercial Street have received your order details and will confirm stock cutting and dispatch instructions.
                    </p>
                  </div>

                  <button type="button" onClick={finish} className="btn btn-gold btn-sheen w-full text-[13px] py-4">
                    Return to Storefront
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary Sidebar (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-[4px] border border-gold/20 bg-chocolate/30 p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-gold/15 pb-4">
                <h3 className="font-serif text-xl text-ivory">Order Summary</h3>
                <span className="text-[12px] font-mono text-gold">{items.length} items</span>
              </div>

              {/* Items List */}
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {items.map(({ item, metres, lineTotal }) => (
                  <div key={item.id} className="flex gap-3 border-b border-ivory/10 pb-3">
                    <img src={item.image} alt={item.name} className="h-16 w-14 shrink-0 rounded object-cover border border-gold/20" />
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-[14px] text-ivory leading-tight truncate">{item.name}</p>
                      <p className="mt-1 text-[11px] text-ivory/50">{inr(item.pricePerMetre)} / m</p>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded border border-ivory/15 bg-night/40">
                          <button
                            onClick={() => setMetres(item.id, Math.max(item.minMetres, metres - 1))}
                            className="h-6 w-6 flex items-center justify-center text-ivory/60 hover:text-gold"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-[11px] text-ivory font-nums">{metres} m</span>
                          <button
                            onClick={() => setMetres(item.id, metres + 1)}
                            className="h-6 w-6 flex items-center justify-center text-ivory/60 hover:text-gold"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button onClick={() => remove(item.id)} className="text-ivory/40 hover:text-maroon p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-nums text-[13px] text-gold">{inr(lineTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Totals */}
              <dl className="space-y-2 border-t border-gold/15 pt-4 text-[13px]">
                <div className="flex justify-between text-ivory/60">
                  <dt>Subtotal</dt>
                  <dd className="font-nums">{inr(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <dt>Wholesale Discount (15%)</dt>
                    <dd className="font-nums">−{inr(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-ivory/60">
                  <dt>Shipping</dt>
                  <dd>{shipping === 0 ? <span className="text-gold font-semibold">FREE</span> : inr(shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-gold/15 pt-3 font-serif text-xl text-ivory">
                  <dt>Total Amount</dt>
                  <dd className="font-nums text-gold font-bold">{inr(total)}</dd>
                </div>
              </dl>

              {/* Trust Badges */}
              <div className="rounded border border-gold/15 bg-night/40 p-4 space-y-2 text-[11px] text-ivory/60">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span>Haute Couture Quality Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span>Direct Showroom Dispatch from Bengaluru</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span>GST Invoice & Swatch Samples Included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
