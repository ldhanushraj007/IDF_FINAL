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
import { ORDER, UPI, inr } from '../lib/constants';
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
      saveOrder(user.id, user.email, {
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
      <div className="min-h-screen flex items-center justify-center bg-surface border-x border-[#1a1a1a] mx-margin-page">
        <div className="text-center p-8 border border-[#1a1a1a]/10 max-w-sm">
          <span className="material-symbols-outlined text-5xl text-brand-gold mb-4">shopping_bag</span>
          <h1 className="font-headline-md text-2xl mb-4 font-serif">Your cart is empty</h1>
          <p className="font-body-sm text-secondary mb-6">Add fabrics from the shop to start checkout.</p>
          <Link to="/" className="btn-primary w-full p-4 bg-primary text-on-primary font-label-caps text-label-caps block hover:bg-opacity-95 transition-colors uppercase">
            RETURN TO SHOP
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid-container w-full mx-auto max-w-[1600px] relative bg-surface border-x border-[#1a1a1a] min-h-screen flex flex-row">
      {/* Left Sidebar (Hidden on mobile) */}
      <div className="hairline-r relative hidden md:flex flex-col items-center py-4 w-12 border-r border-[#1a1a1a] shrink-0">
        <div className="font-index-num text-index-num mb-auto">01</div>
        <div className="font-label-caps text-label-caps tracking-widest text-secondary rotate-[-90deg] whitespace-nowrap mb-32 uppercase">CHECKOUT</div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen min-w-0">
        {/* TopAppBar (Transactional) */}
        <header className="flex justify-between items-center w-full px-4 sm:px-8 py-4 border-b border-[#1a1a1a] bg-surface">
          <Link to="/" className="font-headline-md text-base sm:text-xl md:text-2xl tracking-widest text-primary font-serif uppercase">
            IN DESIGN<span className="text-[10px] sm:text-sm tracking-[0.3em] text-brand-gold block font-sans">LUXURY FABRICS</span>
          </Link>
          <Link to="/" className="font-label-caps text-[10px] sm:text-xs flex items-center gap-1 hover:text-primary text-secondary transition-colors duration-200 shrink-0">
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">close</span> CANCEL
          </Link>
        </header>

        {/* Stepper Steps Header */}
        <div className="border-b border-[#1a1a1a] bg-surface-bright py-4 sm:py-6 px-3 sm:px-8">
          <div className="flex items-center justify-between relative max-w-xl mx-auto">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-1/2 bg-[#1a1a1a]/20 -z-0" />
            {[
              { num: 1, label: 'Details' },
              { num: 2, label: 'Payment' },
              { num: 3, label: 'WhatsApp Send' },
              { num: 4, label: 'Complete' },
            ].map((s) => {
              const active = step === s.num;
              const completed = step > s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5 bg-surface-bright px-2 sm:px-4">
                  <div
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full font-index-num text-[11px] sm:text-[12px] font-bold border transition-all ${
                      completed
                        ? 'bg-primary border-primary text-on-primary'
                        : active
                          ? 'border-brand-gold bg-surface text-brand-gold font-bold ring-4 ring-brand-gold/10'
                          : 'border-[#1a1a1a]/20 bg-surface-container text-secondary'
                    }`}
                  >
                    {completed ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] font-label-caps tracking-widest uppercase hidden sm:block ${
                      active ? 'text-primary font-bold' : completed ? 'text-secondary' : 'text-secondary/55'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Checkout Panel */}
        <main className="flex-grow flex flex-col lg:flex-row w-full bg-surface-bright divide-y lg:divide-y-0 lg:divide-x divide-[#1a1a1a]">
          {/* Left Column: Interactive Form Steps (60% Width) */}
          <div className="w-full lg:w-3/5 p-4 sm:p-8 lg:p-12 space-y-6 sm:space-y-12">
            {/* STEP 1: Details */}
            {step === 1 && (
              <div className="space-y-8">
                {needsAuth ? (
                  <div className="border border-[#1a1a1a] p-8 bg-surface">
                    <h2 className="font-serif text-2xl text-primary mb-2">Sign in to checkout</h2>
                    <p className="font-body-sm text-secondary mb-6">
                      Sign in to save your order history, access your customer profile, and track your purchase.
                    </p>
                    <AuthGate compact />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-baseline mb-6 border-b border-[#1a1a1a] pb-2">
                        <h2 className="font-headline-md text-[20px] font-serif uppercase">Fulfillment Preference</h2>
                        <span className="font-label-caps text-label-caps text-secondary">02.1</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'delivery', label: 'Ship to Address', icon: 'local_shipping' },
                          { id: 'pickup', label: 'Store Pickup', icon: 'storefront' },
                        ].map((f) => {
                          const active = customer.fulfilment === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setCustomer((c) => ({ ...c, fulfilment: f.id as any }))}
                              className={`border p-6 flex flex-col gap-2 text-left transition-all ${
                                active ? 'border-[#1a1a1a] bg-surface-variant' : 'border-outline hover:border-primary bg-transparent'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[24px] text-brand-gold">{f.icon}</span>
                              <span className="font-label-caps text-label-caps text-primary font-bold">{f.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-6 pt-4">
                      <div className="flex justify-between items-baseline mb-6 border-b border-[#1a1a1a] pb-2">
                        <h2 className="font-headline-md text-[20px] font-serif uppercase">Customer Information</h2>
                        <span className="font-label-caps text-label-caps text-secondary">02.2</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                          <label className="block font-label-caps text-label-caps mb-2 text-secondary">FULL NAME</label>
                          <input
                            {...field('name')}
                            placeholder="Enter full name"
                            className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                          />
                          {errors.name && <p className="mt-1 text-[11px] text-error">{errors.name}</p>}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-label-caps text-label-caps mb-2 text-secondary">WHATSAPP PHONE NUMBER</label>
                          <input
                            {...field('phone')}
                            inputMode="numeric"
                            placeholder="10-digit number"
                            className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                          />
                          {errors.phone && <p className="mt-1 text-[11px] text-error">{errors.phone}</p>}
                        </div>

                        {customer.fulfilment === 'delivery' && (
                          <>
                            <div className="sm:col-span-2">
                              <label className="block font-label-caps text-label-caps mb-2 text-secondary">STREET ADDRESS</label>
                              <textarea
                                {...field('address')}
                                rows={2}
                                placeholder="House/Apartment, Street name"
                                className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                              />
                              {errors.address && <p className="mt-1 text-[11px] text-error">{errors.address}</p>}
                            </div>
                            <div>
                              <label className="block font-label-caps text-label-caps mb-2 text-secondary">CITY</label>
                              <input
                                {...field('city')}
                                placeholder="e.g. Bangalore"
                                className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                              />
                              {errors.city && <p className="mt-1 text-[11px] text-error">{errors.city}</p>}
                            </div>
                            <div>
                              <label className="block font-label-caps text-label-caps mb-2 text-secondary">PINCODE</label>
                              <input
                                {...field('pincode')}
                                inputMode="numeric"
                                placeholder="6-digit PIN"
                                className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                              />
                              {errors.pincode && <p className="mt-1 text-[11px] text-error">{errors.pincode}</p>}
                            </div>
                          </>
                        )}

                        <div className="sm:col-span-2">
                          <label className="block font-label-caps text-label-caps mb-2 text-secondary">ORDER NOTES (OPTIONAL)</label>
                          <textarea
                            {...field('notes')}
                            rows={2}
                            placeholder="Color preference, tailoring requirement, urgency..."
                            className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => validate() && setStep(2)}
                      className="btn-primary w-full p-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase hover:bg-opacity-95 transition-colors text-center"
                    >
                      CONTINUE TO PAYMENT & REVIEW →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-baseline mb-6 border-b border-[#1a1a1a] pb-2">
                    <h2 className="font-headline-md text-[20px] font-serif uppercase">Payment Method</h2>
                    <span className="font-label-caps text-label-caps text-secondary">02.2</span>
                  </div>
                  <p className="font-body-sm text-secondary mb-6">
                    Scan the dynamic QR code encoding exact order total of <span className="font-semibold text-brand-gold">{inr(total)}</span>.
                  </p>
                </div>

                <div className="text-center border border-[#1a1a1a] p-8 bg-surface max-w-sm mx-auto">
                  <img
                    src={UPI.staticQrImage || qr}
                    alt="UPI QR Code"
                    className="mx-auto h-64 w-64 border border-[#1a1a1a]/20 bg-white object-contain p-2 shadow-sm"
                  />
                  <p className="mt-4 font-body-sm text-secondary">Scan with Google Pay, PhonePe, Paytm or any UPI App</p>
                  
                  <a href={upiLink(order)} className="btn-primary mt-4 w-full p-3 bg-brand-gold text-white font-label-caps text-label-caps block sm:hidden">
                    OPEN UPI APP TO PAY
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(UPI.vpa);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    }}
                    className="mt-4 inline-flex items-center gap-2 border border-outline px-4 py-2 font-label-caps text-label-caps hover:bg-surface-variant transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-brand-gold" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>UPI VPA: {UPI.vpa}</span>
                  </button>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#1a1a1a]/10">
                  <label className="flex items-start gap-3 border border-outline p-4 bg-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={paid}
                      onChange={(e) => setPaid(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-outline text-primary focus:ring-primary accent-[#B8860B]"
                    />
                    <span className="font-body-sm text-primary">
                      I have completed the UPI payment of <strong className="text-brand-gold">{inr(total)}</strong>.
                    </span>
                  </label>

                  {paid && (
                    <div>
                      <label className="block font-label-caps text-label-caps mb-2 text-secondary">UPI TRANSACTION REFERENCE ID</label>
                      <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Enter transaction reference ID"
                        className="w-full border border-outline p-3 text-body-sm bg-transparent outline-none focus:border-primary font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={openWhatsApp}
                    className="btn-primary w-full p-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase hover:bg-opacity-95 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {paid ? 'SEND ORDER VIA WHATSAPP' : 'PLACE ORDER — PAY AT SHOWROOM'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center font-label-caps text-label-caps text-secondary hover:text-primary py-2"
                  >
                    ← EDIT ADDRESS & DETAILS
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Confirm WhatsApp Send */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="border border-brand-gold bg-brand-gold/5 p-6 flex gap-4">
                  <span className="material-symbols-outlined text-4xl text-brand-gold shrink-0">alert_warning</span>
                  <div>
                    <h3 className="font-serif text-xl text-primary font-bold">One final action required</h3>
                    <p className="font-body-sm text-secondary mt-2">
                      WhatsApp has opened with your order requirement pre-typed. Please press <strong>Send</strong> in WhatsApp to dispatch your order directly to our Commercial Street showroom staff.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={confirmSent}
                  className="btn-primary w-full p-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase hover:bg-opacity-95 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  YES — I PRESSED SEND IN WHATSAPP
                </button>

                <div className="border border-[#1a1a1a]/10 p-6 space-y-4 bg-surface">
                  <p className="font-label-caps text-label-caps text-brand-gold font-bold">DIDN'T OPEN AUTOMATICALLY?</p>
                  <button
                    type="button"
                    onClick={retryWhatsApp}
                    className="w-full border border-primary p-3 font-label-caps text-label-caps hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" /> RE-OPEN WHATSAPP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(ownerMessage(order));
                      setMsgCopied(true);
                      setTimeout(() => setMsgCopied(false), 2200);
                    }}
                    className="w-full text-center font-label-caps text-label-caps text-secondary hover:text-primary py-2 block"
                  >
                    {msgCopied ? '✓ COPY SUCCESSFUL — PASTE IN WHATSAPP' : 'COPY ORDER MESSAGE MANUALLY'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success */}
            {step === 4 && (
              <div className="py-12 text-center space-y-8 max-w-md mx-auto">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-gold/10 border-2 border-brand-gold">
                  <Check className="h-10 w-10 text-brand-gold" />
                </div>

                <div>
                  <h2 className="font-serif text-3xl text-primary font-bold">Order Placed Successfully</h2>
                  <p className="mt-2 text-brand-gold font-index-num text-lg">Order ID: {orderId}</p>
                  <p className="font-body-sm text-secondary mt-4">
                    Our showroom staff at Commercial Street have received your order details and will confirm stock cutting and dispatch instructions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={finish}
                  className="btn-primary w-full p-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase hover:bg-opacity-95 transition-colors"
                >
                  RETURN TO STOREFRONT
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary (40% Width) */}
          <div className="w-full lg:w-2/5 p-4 sm:p-8 lg:p-12 bg-surface flex flex-col gap-6 sm:gap-8">
            <div className="flex justify-between items-baseline border-b border-[#1a1a1a] pb-2">
              <h2 className="font-headline-md text-[20px] font-serif uppercase">Order Summary</h2>
              <span className="font-label-caps text-label-caps text-secondary">{items.length} items</span>
            </div>

            {/* Cart Items List */}
            <div className="flex flex-col gap-4 divide-y divide-[#1a1a1a]/10 max-h-[300px] overflow-y-auto pr-2">
              {items.map(({ item, metres, lineTotal }) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0">
                  <img src={item.image} alt="" className="w-16 h-16 object-cover border border-[#1a1a1a]/20" />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-headline-md text-[16px] font-serif truncate text-primary">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {step === 1 && (
                        <div className="flex border border-primary bg-white h-7 items-center">
                          <button
                            onClick={() => setMetres(item.id, Math.max(item.minMetres, Number((metres - 0.5).toFixed(1))))}
                            className="w-6 h-full flex items-center justify-center hover:bg-surface-variant"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 font-index-num text-[11px]">{metres} m</span>
                          <button
                            onClick={() => setMetres(item.id, Number((metres + 0.5).toFixed(1)))}
                            className="w-6 h-full flex items-center justify-center hover:bg-surface-variant border-l border-primary"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      {step > 1 && (
                        <span className="font-index-num text-[12px] text-secondary">{metres} m</span>
                      )}
                      {step === 1 && (
                        <button onClick={() => remove(item.id)} className="text-secondary hover:text-error ml-auto">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="font-headline-md text-[16px] font-serif text-primary">
                    {inr(lineTotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="flex flex-col gap-3 py-6 border-y border-[#1a1a1a] text-body-sm text-secondary">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((acc, c) => acc + c.metres, 0)} metres)</span>
                <span className="font-index-num text-primary">{inr(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Wholesale Discount ({Math.round(ORDER.wholesaleDiscount * 100)}% off)</span>
                  <span className="font-index-num">- {inr(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-index-num text-primary">{shipping === 0 ? 'FREE' : inr(shipping)}</span>
              </div>
              <div className="flex justify-between font-headline-md text-[20px] text-primary border-t border-[#1a1a1a]/10 pt-4 font-serif">
                <span>Total Amount</span>
                <span>{inr(total)}</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 font-body-sm text-secondary">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span> Direct Showroom Dispatch from Bengaluru
              </div>
              <div className="flex items-center gap-3 font-body-sm text-secondary">
                <span className="material-symbols-outlined text-[20px]">verified_user</span> Secure UPI direct transfer to business VPA
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Right Sidebar */}
      <div className="hairline-l relative flex flex-col items-center py-4 w-12 border-l border-[#1a1a1a] shrink-0">
        <div className="font-index-num text-index-num mb-auto">A/12</div>
      </div>
    </div>
  );
}
