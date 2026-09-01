import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
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
import { useCatalog } from '../context/CatalogContext';
import {
  newOrderId,
  ownerMessage,
  waOrderLink,
  type Customer,
  type OrderPayload,
  type PayMethod,
} from '../lib/order';
import { clearPending, writePending } from '../lib/pendingOrder';
import { createRazorpayOrder, verifyRazorpayPayment, saveOrder } from '../lib/customerApi';
import { openRazorpayCheckout } from '../lib/razorpay';
import { trackInteraction } from '../lib/useTrackInteraction';
import { ORDER, inr } from '../lib/constants';
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
  const { items, subtotal, discount, shipping, total, isWholesale, setMetres, remove, clear, add } = useCart();
  const { enabled: accountsEnabled, user, profile, saveProfile } = useAuth();
  const { available } = useCatalog();

  const suggestedProducts = useMemo(() => {
    const cartIds = new Set(items.map((i) => i.item.id));
    return available.filter((p) => !cartIds.has(p.id)).slice(0, 4);
  }, [available, items]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [customer, setCustomer] = useState<Customer>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>> & { payment?: string }>({});
  const [orderId, setOrderId] = useState(newOrderId);
  const [payMethod, setPayMethod] = useState<PayMethod>('razorpay');
  const [paid, setPaid] = useState(false);
  const [razorpayDetails, setRazorpayDetails] = useState<{
    orderId?: string;
    paymentId?: string;
    signature?: string;
  }>({});

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
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
      method: payMethod,
      paid,
      reference: razorpayDetails.paymentId || '',
      razorpayOrderId: razorpayDetails.orderId,
      razorpayPaymentId: razorpayDetails.paymentId,
      razorpaySignature: razorpayDetails.signature,
    }),
    [orderId, customer, items, subtotal, discount, shipping, total, isWholesale, payMethod, paid, razorpayDetails],
  );

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

  const handleRazorpayPay = async () => {
    setErrors({});
    setIsProcessingPayment(true);

    try {
      // 1. Create Razorpay order on backend
      const amountPaise = Math.round(total * 100);
      const email = user?.email || `${customer.phone}@idlluxuryfabrics.com`;
      const rzpOrder = await createRazorpayOrder(amountPaise, orderId, email);

      // 2. Open Razorpay Modal
      await openRazorpayCheckout({
        amount: rzpOrder.amount,
        orderId: rzpOrder.order_id,
        name: 'IN DESIGN Luxury Fabrics',
        description: `Order ${orderId}`,
        customerName: customer.name,
        customerEmail: email,
        customerPhone: customer.phone,
        onSuccess: async (response) => {
          try {
            // 3. Verify signature on backend
            await verifyRazorpayPayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );

            setPaid(true);
            setPayMethod('razorpay');
            setRazorpayDetails({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            // 4. Save Order and proceed to Step 3
            proceedToWhatsApp({
              ...order,
              paid: true,
              method: 'razorpay',
              reference: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch (err: any) {
            setErrors({ payment: err.message || 'Payment signature verification failed.' });
          } finally {
            setIsProcessingPayment(false);
          }
        },
        onDismiss: () => {
          setIsProcessingPayment(false);
          setErrors({ payment: 'Payment cancelled by user. Please try again to complete order.' });
        },
        onError: (err: any) => {
          setIsProcessingPayment(false);
          setErrors({ payment: err.description || 'Razorpay Payment Failed.' });
        },
      });
    } catch (err: any) {
      setIsProcessingPayment(false);
      setErrors({ payment: err.message || 'Failed to initiate Razorpay order.' });
    }
  };

  const handlePayAtStore = () => {
    setPaid(false);
    setPayMethod('pay_at_store');
    setRazorpayDetails({});

    proceedToWhatsApp({
      ...order,
      paid: false,
      method: 'pay_at_store',
      reference: '',
    });
  };

  const proceedToWhatsApp = (finalOrder: OrderPayload) => {
    const link = waOrderLink(finalOrder);
    writePending({
      orderId: finalOrder.orderId,
      total: finalOrder.total,
      message: ownerMessage(finalOrder),
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
        orderCode: finalOrder.orderId,
        items: finalOrder.items,
        subtotal: finalOrder.subtotal,
        discount: finalOrder.discount,
        shipping: finalOrder.shipping,
        total: finalOrder.total,
        requirement: customer.notes,
        fulfilment: customer.fulfilment,
        address: customer.address,
        city: customer.city,
        pincode: customer.pincode,
        paymentMethod: finalOrder.method,
        paid: finalOrder.paid,
        paymentReference: finalOrder.reference,
        razorpayOrderId: finalOrder.razorpayOrderId,
        razorpayPaymentId: finalOrder.razorpayPaymentId,
        razorpaySignature: finalOrder.razorpaySignature,
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
    <div className="w-full bg-[#FAFAFA] min-h-screen text-[#1F0505]">
      {/* ── Transactional Header Bar ── */}
      <header className="bg-white border-b border-[#1F0505]/15 px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1340px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (step > 1) {
                  setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
                } else {
                  navigate(-1);
                }
              }}
              className="flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-[#1F0505]/70 hover:text-[#1F0505] transition-colors py-1 px-3 rounded-full hover:bg-[#FFE6E9]/40 border border-[#1F0505]/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/images/logo/logo-mark.png" alt="IN DESIGN Logo" className="h-7 sm:h-8 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="font-serif text-[18px] sm:text-[22px] tracking-[0.15em] text-[#1F1916] uppercase font-light leading-none">
                  IN DESIGN
                </span>
                <span className="font-sans text-[7px] sm:text-[8px] tracking-[0.3em] text-[#1F1916]/50 uppercase mt-0.5 font-semibold">
                  LUXURY FABRICS
                </span>
              </div>
            </Link>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#1F0505]/50 hover:text-[#1F0505] transition-colors py-1 px-3 rounded-full hover:bg-[#FFE6E9]/40"
          >
            Cancel ✕
          </Link>
        </div>
      </header>

      {/* ── Stepper Navigation Bar ── */}
      <div className="bg-white border-b border-[#1F0505]/10 py-5 px-4 sm:px-8">
        <div className="max-w-xl mx-auto flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-[#1F0505]/15 z-0" />
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Payment' },
            { num: 3, label: 'WhatsApp Send' },
            { num: 4, label: 'Complete' },
          ].map((s) => {
            const active = step === s.num;
            const completed = step > s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5 bg-white px-2">
                <div
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full font-sans text-[12px] font-bold border-2 transition-all ${
                    completed
                      ? 'bg-[#1F0505] border-[#1F0505] text-white shadow-sm'
                      : active
                      ? 'bg-[#FFE6E9] border-[#1F0505] text-[#1F0505] shadow-md ring-4 ring-[#FFE6E9]/60 font-extrabold'
                      : 'border-[#1F0505]/20 bg-[#FAFAFA] text-[#1F0505]/40'
                  }`}
                >
                  {completed ? <Check className="h-4 w-4 stroke-[3]" /> : s.num}
                </div>
                <span
                  className={`text-[9px] sm:text-[10px] font-sans font-bold tracking-[0.12em] uppercase ${
                    active ? 'text-[#1F0505]' : completed ? 'text-[#1F0505]/70' : 'text-[#1F0505]/40'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Layout (Form + Summary) ── */}
      <div className="max-w-[1340px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Form Steps (60%) */}
          <div className="w-full lg:w-3/5 space-y-8">
            
            {/* STEP 1: Customer Details */}
            {step === 1 && (
              <div className="space-y-8">
                {needsAuth ? (
                  <div className="bg-white rounded-2xl border border-[#1F0505]/15 p-8 shadow-sm">
                    <h2 className="font-serif text-[28px] text-[#1F0505] mb-2">Sign in to complete checkout</h2>
                    <p className="font-sans text-[13px] text-[#1F0505]/60 mb-6">
                      Sign in to save your delivery profile, manage orders, and track your purchase history.
                    </p>
                    <AuthGate compact />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Fulfillment Selection */}
                    <div className="bg-white rounded-2xl border border-[#1F0505]/15 p-6 sm:p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#1F0505]/10">
                        <h2 className="font-serif text-[24px] sm:text-[28px] text-[#1F0505]">Fulfillment Preference</h2>
                        <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-[#1F0505]/40 uppercase">Step 01</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { id: 'delivery', label: 'Ship to Address', sub: 'Direct delivery across India', icon: Truck },
                          { id: 'pickup', label: 'Store Pickup', sub: 'Collect from Commercial St., Bengaluru', icon: Store },
                        ].map((f) => {
                          const active = customer.fulfilment === f.id;
                          const IconComp = f.icon;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setCustomer((c) => ({ ...c, fulfilment: f.id as any }))}
                              className={`p-5 rounded-xl border-2 text-left flex flex-col gap-2 transition-all ${
                                active
                                  ? 'border-[#1F0505] bg-[#FFE6E9]/40 shadow-sm'
                                  : 'border-[#1F0505]/15 hover:border-[#1F0505]/40 bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <IconComp className={`h-6 w-6 ${active ? 'text-[#1F0505]' : 'text-[#1F0505]/40'}`} strokeWidth={1.5} />
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'border-[#1F0505] bg-[#1F0505]' : 'border-[#1F0505]/30'}`}>
                                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </div>
                              <span className="font-sans text-[13px] font-bold text-[#1F0505]">{f.label}</span>
                              <span className="font-sans text-[11px] text-[#1F0505]/50">{f.sub}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Customer Info Form */}
                    <div className="bg-white rounded-2xl border border-[#1F0505]/15 p-6 sm:p-8 shadow-sm space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-[#1F0505]/10">
                        <h2 className="font-serif text-[24px] sm:text-[28px] text-[#1F0505]">Customer Information</h2>
                        <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-[#1F0505]/40 uppercase">Step 02</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2 flex flex-col gap-1.5">
                          <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">Full Name</label>
                          <input
                            {...field('name')}
                            placeholder="Enter your full name"
                            className="w-full border border-[#1F0505]/20 p-3.5 rounded-xl text-[13px] text-[#1F0505] bg-white outline-none focus:border-[#1F0505] focus:ring-1 focus:ring-[#1F0505] transition-all"
                          />
                          {errors.name && <p className="text-[11px] text-red-600 font-sans">{errors.name}</p>}
                        </div>

                        <div className="sm:col-span-2 flex flex-col gap-1.5">
                          <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">WhatsApp Phone Number</label>
                          <input
                            {...field('phone')}
                            inputMode="numeric"
                            placeholder="10-digit mobile number"
                            className="w-full border border-[#1F0505]/20 p-3.5 rounded-xl text-[13px] text-[#1F0505] bg-white outline-none focus:border-[#1F0505] focus:ring-1 focus:ring-[#1F0505] transition-all"
                          />
                          {errors.phone && <p className="text-[11px] text-red-600 font-sans">{errors.phone}</p>}
                        </div>

                        {customer.fulfilment === 'delivery' && (
                          <>
                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                              <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">Delivery Address</label>
                              <textarea
                                {...field('address')}
                                rows={2}
                                placeholder="House/Flat No., Building, Street Name"
                                className="w-full border border-[#1F0505]/20 p-3.5 rounded-xl text-[13px] text-[#1F0505] bg-white outline-none focus:border-[#1F0505] focus:ring-1 focus:ring-[#1F0505] transition-all resize-none"
                              />
                              {errors.address && <p className="text-[11px] text-red-600 font-sans">{errors.address}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">City</label>
                              <input
                                {...field('city')}
                                placeholder="e.g. Bengaluru"
                                className="w-full border border-[#1F0505]/20 p-3.5 rounded-xl text-[13px] text-[#1F0505] bg-white outline-none focus:border-[#1F0505] focus:ring-1 focus:ring-[#1F0505] transition-all"
                              />
                              {errors.city && <p className="text-[11px] text-red-600 font-sans">{errors.city}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">Pincode</label>
                              <input
                                {...field('pincode')}
                                inputMode="numeric"
                                placeholder="6-digit PIN code"
                                className="w-full border border-[#1F0505]/20 p-3.5 rounded-xl text-[13px] text-[#1F0505] bg-white outline-none focus:border-[#1F0505] focus:ring-1 focus:ring-[#1F0505] transition-all"
                              />
                              {errors.pincode && <p className="text-[11px] text-red-600 font-sans">{errors.pincode}</p>}
                            </div>
                          </>
                        )}

                        <div className="sm:col-span-2 flex flex-col gap-1.5">
                          <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">Order Notes (Optional)</label>
                          <textarea
                            {...field('notes')}
                            rows={2}
                            placeholder="Color preferences, tailoring guidance, urgency..."
                            className="w-full border border-[#1F0505]/20 p-3.5 rounded-xl text-[13px] text-[#1F0505] bg-white outline-none focus:border-[#1F0505] focus:ring-1 focus:ring-[#1F0505] transition-all resize-none"
                          />
                        </div>

                        {/* Continue to Payment Button directly after delivery fields */}
                        <div className="sm:col-span-2 mt-4">
                          <button
                            type="button"
                            onClick={() => validate() && setStep(2)}
                            className="btn btn-dark btn-sheen w-full py-4 text-[12px] tracking-[0.2em] font-semibold uppercase text-center rounded-xl shadow-md cursor-pointer hover:bg-black transition-colors"
                          >
                            Continue to Payment →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Suggested Choices Section */}
                    {suggestedProducts.length > 0 && (
                      <div className="bg-white rounded-2xl border border-[#1F0505]/15 p-6 sm:p-8 shadow-sm">
                        <div className="flex justify-between items-baseline mb-4">
                          <h3 className="font-serif text-[20px] text-[#1F0505]">Suggested Choices</h3>
                          <span className="font-sans text-[9px] font-bold tracking-[0.18em] text-[#1F0505]/40 uppercase">Curated For You</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {suggestedProducts.map((prod) => (
                            <div
                              key={prod.id}
                              className="group border border-[#1F0505]/15 rounded-xl p-2 bg-white flex flex-col justify-between hover:border-[#1F0505] transition-all"
                            >
                              <div>
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-full h-24 sm:h-28 object-cover rounded-lg mb-2"
                                />
                                <h4 className="font-serif text-[13px] leading-tight font-medium text-[#1F0505] line-clamp-1">
                                  {prod.name}
                                </h4>
                                <p className="font-sans text-[11px] text-[#1F0505]/50 mt-0.5">
                                  {inr(prod.pricePerMetre)} / m
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => add(prod.id, prod.minMetres || 1)}
                                className="mt-2.5 w-full py-2 px-2 bg-[#FFE6E9]/50 hover:bg-[#1F0505] hover:text-white text-[#1F0505] text-[10px] font-bold tracking-[0.1em] uppercase transition-all flex items-center justify-center gap-1 rounded-lg"
                              >
                                <Plus className="h-3 w-3" /> Add {prod.minMetres || 1}m
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-[#1F0505]/15 p-6 sm:p-8 shadow-sm space-y-8">
                <div>
                  <div className="flex justify-between items-baseline mb-4 pb-3 border-b border-[#1F0505]/10">
                    <h2 className="font-serif text-[24px] sm:text-[28px] text-[#1F0505]">Payment Method</h2>
                    <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-[#1F0505]/40 uppercase">Step 02</span>
                  </div>
                  <p className="font-sans text-[13px] text-[#1F0505]/70">
                    Total order payable: <span className="font-bold text-[#1F0505]">{inr(total)}</span>
                  </p>
                </div>

                {errors.payment && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-[13px] flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{errors.payment}</span>
                  </div>
                )}

                {customer.fulfilment === 'delivery' ? (
                  <div className="space-y-6">
                    <div className="p-5 border border-[#1F0505]/15 rounded-2xl bg-[#FAFAFA] space-y-3">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-[#1F0505]" />
                        <h3 className="font-sans text-[14px] font-bold text-[#1F0505]">Pay Online via Razorpay</h3>
                      </div>
                      <p className="font-sans text-[12px] text-[#1F0505]/60 leading-relaxed">
                        Pay securely using Cards, UPI (GPay, PhonePe, Paytm), Netbanking, or Wallets. Payment must be completed to place delivery orders.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={handleRazorpayPay}
                      className="btn btn-dark btn-sheen w-full py-4 text-[12px] font-bold tracking-[0.16em] uppercase flex items-center justify-center gap-2 rounded-xl shadow-md disabled:opacity-50"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Initiating Razorpay...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Pay {inr(total)} with Razorpay
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        disabled={isProcessingPayment}
                        onClick={handleRazorpayPay}
                        className="p-5 rounded-2xl border-2 border-[#1F0505] bg-[#FFE6E9]/40 hover:bg-[#FFE6E9]/70 transition-all text-left flex flex-col justify-between gap-3 shadow-xs"
                      >
                        <div className="flex justify-between items-center">
                          <CreditCard className="h-6 w-6 text-[#1F0505]" />
                          <span className="text-[10px] font-bold tracking-[0.14em] uppercase bg-[#1F0505] text-white px-2 py-0.5 rounded-full">Recommended</span>
                        </div>
                        <div>
                          <h4 className="font-sans text-[14px] font-bold text-[#1F0505]">Pay Online Now</h4>
                          <p className="font-sans text-[11px] text-[#1F0505]/60 mt-1">UPI, Cards, Netbanking via Razorpay</p>
                        </div>
                        <div className="font-sans text-[12px] font-bold text-[#1F0505] mt-2 flex items-center gap-1">
                          Pay {inr(total)} →
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessingPayment}
                        onClick={handlePayAtStore}
                        className="p-5 rounded-2xl border-2 border-[#1F0505]/20 hover:border-[#1F0505] bg-white transition-all text-left flex flex-col justify-between gap-3"
                      >
                        <Store className="h-6 w-6 text-[#1F0505]/70" />
                        <div>
                          <h4 className="font-sans text-[14px] font-bold text-[#1F0505]">Pay at Store</h4>
                          <p className="font-sans text-[11px] text-[#1F0505]/60 mt-1">Pay when picking up at Commercial St.</p>
                        </div>
                        <div className="font-sans text-[12px] font-bold text-[#1F0505] mt-2 flex items-center gap-1">
                          Reserve & Pay at Store →
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center font-sans text-[11px] font-semibold text-[#1F0505]/50 hover:text-[#1F0505] py-2 transition-colors block"
                >
                  ← Edit Address & Details
                </button>
              </div>
            )}

            {/* STEP 3: Confirm WhatsApp Send */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-[#1F0505]/15 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="bg-[#FFE6E9]/60 rounded-xl p-5 border border-[#1F0505]/15 flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-[#1F0505] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-serif text-[20px] text-[#1F0505]">One final step required</h3>
                    <p className="font-sans text-[13px] text-[#1F0505]/70 mt-1">
                      WhatsApp has launched with your order requirement pre-filled. Please press <strong>Send</strong> inside WhatsApp to transmit your order directly to our Commercial Street team.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={confirmSent}
                  className="btn btn-dark btn-sheen w-full py-4 text-[11px] font-bold tracking-[0.16em] uppercase flex items-center justify-center gap-2 rounded-xl"
                >
                  <Check className="h-4 w-4" />
                  Yes — I Pressed Send in WhatsApp
                </button>

                <div className="border border-[#1F0505]/15 rounded-xl p-5 space-y-3 bg-[#FAFAFA]">
                  <p className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">Didn't open automatically?</p>
                  <button
                    type="button"
                    onClick={retryWhatsApp}
                    className="w-full border border-[#1F0505]/30 py-3 rounded-xl font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-[#1F0505] hover:bg-[#1F0505] hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" /> Re-open WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(ownerMessage(order));
                      setMsgCopied(true);
                      setTimeout(() => setMsgCopied(false), 2200);
                    }}
                    className="w-full text-center font-sans text-[11px] font-semibold text-[#1F0505]/50 hover:text-[#1F0505] py-1 block"
                  >
                    {msgCopied ? '✓ Copied — Paste in WhatsApp' : 'Copy Order Text Manually'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success */}
            {step === 4 && (
              <div className="bg-white rounded-2xl border border-[#1F0505]/15 p-8 sm:p-12 text-center space-y-6 shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600">
                  <Check className="h-8 w-8 stroke-[2.5]" />
                </div>

                <div>
                  <h2 className="font-serif text-[32px] text-[#1F0505]">Order Received</h2>
                  <p className="font-sans text-[13px] font-bold text-[#1F0505]/60 mt-1">Order Code: {orderId}</p>
                  <p className="font-sans text-[13px] text-[#1F0505]/70 mt-3 max-w-sm mx-auto leading-relaxed">
                    Our Commercial Street showroom team has logged your order and will confirm stock cutting and dispatch.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={finish}
                  className="btn btn-dark btn-sheen px-8 py-3.5 text-[11px] font-bold tracking-[0.14em] uppercase rounded-xl"
                >
                  Return to Storefront
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary (40%) */}
          <div className="w-full lg:w-2/5 bg-white rounded-2xl border border-[#1F0505]/15 p-6 sm:p-8 shadow-sm space-y-6 lg:sticky lg:top-24">
            <div className="flex justify-between items-baseline pb-3 border-b border-[#1F0505]/10">
              <h2 className="font-serif text-[24px] text-[#1F0505]">Order Summary</h2>
              <span className="font-sans text-[11px] font-semibold text-[#1F0505]/50">{items.length} items</span>
            </div>

            {/* Cart Items List */}
            <div className="flex flex-col divide-y divide-[#1F0505]/10 max-h-[360px] overflow-y-auto pr-1">
              {items.map(({ item, metres, lineTotal }) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0">
                  <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded-lg border border-[#1F0505]/10 shrink-0" />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-serif text-[15px] font-medium text-[#1F0505] leading-snug line-clamp-1">{item.name}</h3>
                    <p className="font-sans text-[11px] text-[#1F0505]/40 mt-0.5">{inr(item.pricePerMetre)} / m</p>
                    <div className="flex items-center gap-2 mt-2">
                      {step === 1 && (
                        <div className="flex border border-[#1F0505]/20 bg-[#FAFAFA] rounded-md h-7 items-center">
                          <button
                            type="button"
                            onClick={() => setMetres(item.id, Math.max(item.minMetres, Number((metres - 0.5).toFixed(1))))}
                            className="w-6 h-full flex items-center justify-center hover:bg-[#1F0505]/10 text-[#1F0505]/60"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            min={item.minMetres || 0.5}
                            step="0.5"
                            value={metres}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                setMetres(item.id, val);
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val) || val < (item.minMetres || 0.5)) {
                                setMetres(item.id, item.minMetres || 0.5);
                              }
                            }}
                            className="w-10 h-full text-center font-sans text-[11px] font-bold bg-transparent focus:outline-none border-x border-[#1F0505]/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => setMetres(item.id, Number((metres + 0.5).toFixed(1)))}
                            className="w-6 h-full flex items-center justify-center hover:bg-[#1F0505]/10 text-[#1F0505]/60"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      {step > 1 && (
                        <span className="font-sans text-[12px] font-semibold text-[#1F0505]/70">{metres} metres</span>
                      )}
                      {step === 1 && (
                        <button type="button" onClick={() => remove(item.id)} className="text-[#1F0505]/30 hover:text-red-600 transition-colors ml-auto">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="font-sans text-[13px] font-bold text-[#1F0505] shrink-0">
                    {inr(lineTotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 py-4 border-t border-b border-[#1F0505]/10 font-sans text-[13px]">
              <div className="flex justify-between text-[#1F0505]/60">
                <span>Subtotal ({items.reduce((acc, c) => acc + c.metres, 0)} metres)</span>
                <span className="font-semibold text-[#1F0505]">{inr(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Wholesale Discount ({Math.round(ORDER.wholesaleDiscount * 100)}% off)</span>
                  <span className="font-semibold">- {inr(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#1F0505]/60">
                <span>Delivery Charge</span>
                <span className="font-semibold text-[#1F0505]">{shipping === 0 ? 'FREE' : inr(shipping)}</span>
              </div>
              <div className="flex justify-between font-serif text-[22px] text-[#1F0505] pt-3 border-t border-[#1F0505]/10 font-medium">
                <span>Total Amount</span>
                <span>{inr(total)}</span>
              </div>
            </div>

            {/* Step 1 Continue to Payment Sidebar Button */}
            {step === 1 && (
              <button
                type="button"
                onClick={() => validate() && setStep(2)}
                className="w-full py-4 bg-[#1F1916] text-white hover:bg-black transition-colors font-sans text-[12px] font-semibold tracking-[0.2em] uppercase rounded-xl shadow-md cursor-pointer"
              >
                Continue to Payment →
              </button>
            )}

            {/* Trust Footer */}
            <div className="space-y-2 font-sans text-[11px] text-[#1F0505]/50 pt-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#1F0505]/40" /> Showroom dispatch from Commercial St., Bengaluru
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#1F0505]/40" /> Verified business UPI & direct WhatsApp tracking
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
