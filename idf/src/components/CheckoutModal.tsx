import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import { AlertTriangle, Check, Copy, MessageCircle, ShieldCheck, X } from 'lucide-react';
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
import AuthGate from './AuthGate';

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMPTY: Customer = {
  name: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
  notes: '',
  fulfilment: 'delivery',
};

export default function CheckoutModal({ open, onClose }: Props) {
  const { items, subtotal, discount, shipping, total, isWholesale, clear, setOpen } = useCart();
  const { enabled: accountsEnabled, user, profile, saveProfile } = useAuth();

  // 1 details → 2 payment → 3 confirm the WhatsApp send → 4 done
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
      width: 420,
      margin: 1,
      color: { dark: '#1c0505', light: '#EADDD5' },
    })
      .then(setQr)
      .catch(() => setQr(''));
  }, [step, order]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Once signed in, carry over whatever we already know so the customer
  // isn't retyping their own name and number every visit.
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
    if (customer.name.trim().length < 2) e.name = 'Please enter your name';
    if (!/^[6-9]\d{9}$/.test(customer.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid 10-digit mobile number';
    if (customer.fulfilment === 'delivery') {
      if (customer.address.trim().length < 6) e.address = 'Please enter your full address';
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
    `w-full rounded-[2px] border bg-night/40 px-3.5 py-3 text-[14px] text-ivory placeholder-ivory/30 outline-none transition-colors focus:border-gold ${
      errors[k] ? 'border-maroon' : 'border-ivory/15'
    }`;

  /**
   * Opens WhatsApp and records the order as PENDING — deliberately not as
   * complete. We have no way to observe whether the customer actually pressed
   * Send inside WhatsApp, so we assume they did not until they tell us.
   */
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

    // Real order record + a refreshed profile — this is what powers order
    // history on /account and the customer database. Fire-and-forget: a
    // slow network here should never block WhatsApp from opening.
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
    onClose();
    setOpen(false);
  };

  const needsAuth = accountsEnabled && !user;

  const stepLabel =
    step === 1
      ? needsAuth
        ? 'Sign In to Continue'
        : 'Your Details'
      : step === 2
        ? 'Payment'
        : step === 3
          ? 'Confirm Send'
          : 'Order Sent';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-end justify-center bg-night/85 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Checkout"
        >
          <motion.div
            initial={{ y: '4%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '4%', opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[6px] bg-chocolate sm:rounded-[4px]"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-gold/20 px-5 py-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo/logo-mark.png"
                  alt=""
                  aria-hidden="true"
                  className="h-9 w-9 shrink-0 object-contain"
                />
                <div>
                  <h2 className="font-serif text-xl text-ivory">{stepLabel}</h2>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-gold/70">
                    Order {orderId} · Step {Math.min(step, 3)} of 3
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close checkout"
                className="flex h-10 w-10 items-center justify-center text-ivory/70 hover:text-gold"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {/* ============ STEP 1a — sign in first, if accounts are on ============ */}
              {step === 1 && needsAuth && (
                <div>
                  <p className="mb-5 text-center text-[13px] leading-relaxed text-ivory/60">
                    Orders are tied to a verified account — this is what lets you see your order
                    history and keeps the showroom's customer records genuine.
                  </p>
                  <AuthGate compact />
                </div>
              )}

              {/* ============ STEP 1 — details ============ */}
              {step === 1 && !needsAuth && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {(['delivery', 'pickup'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setCustomer((c) => ({ ...c, fulfilment: f }))}
                        className={`rounded-[2px] border px-3 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                          customer.fulfilment === f
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-ivory/15 text-ivory/55 hover:border-ivory/30'
                        }`}
                      >
                        {f === 'delivery' ? 'Ship to me' : 'Pick up in store'}
                      </button>
                    ))}
                  </div>

                  <div>
                    <input {...field('name')} placeholder="Full name" className={inputClass('name')} />
                    {errors.name && <p className="mt-1 text-[11px] text-maroon">{errors.name}</p>}
                  </div>

                  <div>
                    <input
                      {...field('phone')}
                      inputMode="numeric"
                      placeholder="WhatsApp mobile number"
                      className={inputClass('phone')}
                    />
                    {errors.phone && <p className="mt-1 text-[11px] text-maroon">{errors.phone}</p>}
                  </div>

                  {customer.fulfilment === 'delivery' && (
                    <>
                      <div>
                        <textarea
                          {...field('address')}
                          rows={2}
                          placeholder="Delivery address"
                          className={inputClass('address')}
                        />
                        {errors.address && (
                          <p className="mt-1 text-[11px] text-maroon">{errors.address}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input {...field('city')} placeholder="City" className={inputClass('city')} />
                          {errors.city && (
                            <p className="mt-1 text-[11px] text-maroon">{errors.city}</p>
                          )}
                        </div>
                        <div>
                          <input
                            {...field('pincode')}
                            inputMode="numeric"
                            placeholder="PIN code"
                            className={inputClass('pincode')}
                          />
                          {errors.pincode && (
                            <p className="mt-1 text-[11px] text-maroon">{errors.pincode}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <textarea
                    {...field('notes')}
                    rows={2}
                    placeholder="Notes — colour preference, urgency, tailoring requirement (optional)"
                    className={inputClass('notes')}
                  />

                  <button
                    type="button"
                    onClick={() => validate() && setStep(2)}
                    className="btn btn-gold btn-sheen w-full"
                  >
                    Continue to Payment
                  </button>
                </div>
              )}

              {/* ============ STEP 2 — payment ============ */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="rounded-[3px] border border-gold/25 bg-night/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-ivory/60">Amount payable</span>
                      <span className="font-nums text-2xl font-semibold text-gold">{inr(total)}</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <img
                      src={UPI.staticQrImage || qr}
                      alt="UPI payment QR code"
                      className="mx-auto h-56 w-56 rounded-[3px] border border-gold/20 bg-ivory object-contain p-2"
                    />
                    <p className="mt-3 text-[12px] text-ivory/50">
                      Scan with GPay, PhonePe, Paytm or any UPI app
                    </p>

                    <a href={upiLink(order)} className="btn btn-gold btn-sheen mt-4 w-full sm:hidden">
                      Open UPI App to Pay
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(UPI.vpa);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1800);
                      }}
                      className="mt-3 inline-flex items-center gap-2 text-[12px] tracking-wide text-ivory/60 transition-colors hover:text-gold"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {UPI.vpa}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-ivory/15 p-3.5">
                      <input
                        type="checkbox"
                        checked={paid}
                        onChange={(e) => setPaid(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#d3aa32]"
                      />
                      <span className="text-[13px] leading-relaxed text-ivory/70">
                        I have completed the UPI payment of {inr(total)}
                      </span>
                    </label>

                    {paid && (
                      <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="UPI transaction ID (optional but helpful)"
                        className="w-full rounded-[2px] border border-ivory/15 bg-night/40 px-3.5 py-3 text-[14px] text-ivory placeholder-ivory/30 outline-none focus:border-gold"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={openWhatsApp}
                    className="btn btn-gold btn-sheen w-full"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {paid ? 'Send Order on WhatsApp' : 'Place Order — Pay Later'}
                  </button>

                  <p className="flex items-start gap-2 text-[11px] leading-relaxed text-ivory/40">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                    Your order opens in WhatsApp addressed to the showroom, so {BUSINESS.city} staff
                    receive your number and full requirement instantly.
                  </p>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-2 text-[12px] uppercase tracking-[0.16em] text-ivory/45 hover:text-ivory"
                  >
                    ← Back to details
                  </button>
                </div>
              )}

              {/* ============ STEP 3 — did you actually press Send? ============ */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 rounded-[3px] border border-gold/40 bg-gold/10 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <p className="text-[14px] font-semibold text-ivory">
                        One last step — press Send in WhatsApp
                      </p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ivory/65">
                        WhatsApp has opened with your order typed out, but the message is not sent
                        until you press the send button yourself. Until then the showroom has not
                        received anything.
                      </p>
                    </div>
                  </div>

                  <button type="button" onClick={confirmSent} className="btn btn-gold btn-sheen w-full">
                    <Check className="h-4 w-4" />
                    Yes — I pressed Send
                  </button>

                  <div className="space-y-2.5 rounded-[3px] border border-ivory/15 p-4">
                    <p className="text-[12px] uppercase tracking-[0.16em] text-ivory/45">
                      WhatsApp didn't open?
                    </p>
                    <button
                      type="button"
                      onClick={retryWhatsApp}
                      className="btn btn-ghost-light w-full"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Open WhatsApp again
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(ownerMessage(order));
                        setMsgCopied(true);
                        setTimeout(() => setMsgCopied(false), 2200);
                      }}
                      className="w-full py-2 text-[12px] tracking-wide text-ivory/55 transition-colors hover:text-gold"
                    >
                      {msgCopied
                        ? '✓ Order copied — paste it into WhatsApp'
                        : 'Copy the order text instead'}
                    </button>
                    <p className="text-center text-[12px] text-ivory/45">
                      or call{' '}
                      <a href={`tel:${BUSINESS.phoneRaw}`} className="text-gold">
                        {BUSINESS.phoneDisplay}
                      </a>
                    </p>
                  </div>

                  <p className="text-center text-[11px] leading-relaxed text-ivory/35">
                    Your cart is kept safe until you confirm. Nothing is lost if you close this.
                  </p>
                </div>
              )}

              {/* ============ STEP 4 — done ============ */}
              {step === 4 && (
                <div className="space-y-5 py-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                    <Check className="h-7 w-7 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-ivory">Order <span className="font-nums">{orderId}</span> sent</h3>
                    <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ivory/60">
                      The showroom has your requirement on WhatsApp and will confirm availability,
                      cutting and dispatch shortly. Keep your order number handy.
                    </p>
                  </div>
                  <div className="rounded-[3px] border border-ivory/15 p-3 text-[13px] text-ivory/60">
                    Questions? Call{' '}
                    <a href={`tel:${BUSINESS.phoneRaw}`} className="text-gold">
                      {BUSINESS.phoneDisplay}
                    </a>
                  </div>
                  <button type="button" onClick={finish} className="btn btn-gold btn-sheen w-full">
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
