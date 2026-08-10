import { useState } from 'react';
import { X, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { type Item } from '../data/catalog';
import { type AdminOrderRow } from '../lib/adminApi';

interface Props {
  catalog: Item[];
  onSave: (order: AdminOrderRow) => void;
  onClose: () => void;
}

export default function AddOrderModal({ catalog, onSave, onClose }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const [orderItems, setOrderItems] = useState<{ productId: string; metres: number }[]>([]);
  const [fulfilment, setFulfilment] = useState('delivery');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [paymentRef, setPaymentRef] = useState('');
  const [requirement, setRequirement] = useState('');
  const [error, setError] = useState('');

  const addProductRow = () => {
    if (catalog.length > 0) {
      setOrderItems((prev) => [...prev, { productId: catalog[0].id, metres: 1 }]);
    }
  };

  const removeProductRow = (idx: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateProductRow = (idx: number, field: 'productId' | 'metres', val: string | number) => {
    setOrderItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        return {
          ...item,
          [field]: field === 'metres' ? Math.max(0.1, Number(val)) : String(val),
        };
      })
    );
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((acc, current) => {
      const prod = catalog.find((c) => c.id === current.productId);
      if (!prod) return acc;
      return acc + prod.pricePerMetre * current.metres;
    }, 0);
  };

  const handleSave = () => {
    if (!customerName.trim()) return setError('Customer name is required.');
    if (!customerPhone.trim()) return setError('Customer phone is required.');
    if (orderItems.length === 0) return setError('At least one product must be added to the order.');

    setError('');
    const subtotal = calculateSubtotal();
    const finalTotal = Math.max(0, subtotal - discount + shipping);

    const itemsMapped = orderItems
      .map((row) => {
        const prod = catalog.find((c) => c.id === row.productId);
        if (!prod) return null;
        return {
          item: { name: prod.name },
          metres: row.metres,
          lineTotal: prod.pricePerMetre * row.metres,
        };
      })
      .filter((itm): itm is NonNullable<typeof itm> => itm !== null);

    const newOrder: AdminOrderRow = {
      id: `ord-${Math.random().toString(36).slice(2, 7)}`,
      order_code: `ID-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`,
      items: itemsMapped,
      subtotal,
      discount,
      shipping,
      total: finalTotal,
      requirement: requirement.trim(),
      fulfilment,
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      payment_method: paymentMethod,
      paid: paymentStatus === 'paid',
      payment_reference: paymentRef.trim(),
      payment_status: paymentStatus === 'paid' ? 'paid' : 'pending',
      order_status: 'confirmed',
      created_at: new Date().toISOString(),
      customers: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || 'walkin@idf.com',
      },
    };

    onSave(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[4px] border border-gold/20 bg-chocolate shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-chocolate px-6 py-4">
          <div>
            <h2 className="font-serif text-xl text-ivory">Create Manual Order</h2>
            <p className="text-[11px] text-ivory/40 mt-0.5">
              Enter customer details and pick fabrics to record a manual order.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-ivory/50 hover:text-ivory transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded border border-maroon/30 bg-maroon/10 px-4 py-3 text-[12px] text-maroon">
              {error}
            </div>
          )}

          {/* Customer Info */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Customer Details
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Name *</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Phone Number *</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>
            </div>
          </section>

          {/* Order Items */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                Items / Fabrics
              </h3>
              <button
                type="button"
                onClick={addProductRow}
                className="flex items-center gap-1 text-[11px] text-gold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Fabric
              </button>
            </div>

            {orderItems.map((row, idx) => {
              const selectedProd = catalog.find((c) => c.id === row.productId);
              return (
                <div key={idx} className="flex flex-wrap items-end gap-3 rounded border border-ivory/5 bg-night/20 p-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-1 block text-[10px] text-ivory/40">Select Fabric</label>
                    <select
                      value={row.productId}
                      onChange={(e) => updateProductRow(idx, 'productId', e.target.value)}
                      className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none"
                    >
                      {catalog.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (₹{c.pricePerMetre}/m)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="mb-1 block text-[10px] text-ivory/40">Metres</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={row.metres}
                      onChange={(e) => updateProductRow(idx, 'metres', e.target.value)}
                      className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none text-center"
                    />
                  </div>

                  <div className="w-28 text-right py-2 text-[13px] text-ivory/70">
                    <span className="text-[10px] block text-ivory/40 font-mono">Line Total</span>
                    ₹{selectedProd ? (selectedProd.pricePerMetre * row.metres).toLocaleString('en-IN') : 0}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProductRow(idx)}
                    className="flex h-10 w-10 items-center justify-center text-ivory/40 hover:text-maroon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {orderItems.length === 0 && (
              <p className="text-[12px] text-ivory/30 italic text-center py-4">No items added to the order yet.</p>
            )}
          </section>

          {/* Delivery & Notes */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                Fulfilment & Shipping
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfilment('delivery')}
                  className={`rounded border py-2 text-[12px] uppercase font-semibold ${
                    fulfilment === 'delivery'
                      ? 'border-gold bg-gold/15 text-gold'
                      : 'border-ivory/15 text-ivory/50 hover:text-ivory'
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFulfilment('pickup')}
                  className={`rounded border py-2 text-[12px] uppercase font-semibold ${
                    fulfilment === 'pickup'
                      ? 'border-gold bg-gold/15 text-gold'
                      : 'border-ivory/15 text-ivory/50 hover:text-ivory'
                  }`}
                >
                  Showroom Pick
                </button>
              </div>

              {fulfilment === 'delivery' && (
                <div className="space-y-2">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address Line"
                    className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none"
                    />
                    <input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Pincode"
                      className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                Requirements & Notes
              </h3>
              <textarea
                rows={4}
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Special cuts, custom finishes, matching lining fabric, etc."
                className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none resize-none"
              />
            </div>
          </section>

          {/* Pricing Adjustments */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Pricing Details
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Subtotal</label>
                <div className="rounded border border-ivory/15 bg-night/20 px-3 py-2 text-[13px] text-ivory/60 font-mono">
                  ₹{calculateSubtotal().toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Discount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Shipping Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={shipping || ''}
                  onChange={(e) => setShipping(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none font-mono"
                />
              </div>
            </div>
          </section>

          {/* Payment Info */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Payment Details
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none"
                >
                  <option value="UPI">UPI (QR)</option>
                  <option value="Cash">Showroom Cash</option>
                  <option value="Card">Showroom Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-ivory/50">Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-ivory/50">Reference ID</label>
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="UPI Txn ID or Receipt Code"
                  className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-gold/15 bg-chocolate px-6 py-4">
          <div className="text-[14px]">
            Total: <span className="text-gold font-bold">₹{Math.max(0, calculateSubtotal() - discount + shipping).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost-light text-[12px] px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-gold btn-sheen text-[12px] px-6 py-2.5 flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
