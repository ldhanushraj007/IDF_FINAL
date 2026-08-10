import { useState } from 'react';
import { X, Plus, UserPlus } from 'lucide-react';
import { type CustomerProfile } from '../lib/customerApi';

interface Props {
  onSave: (customer: CustomerProfile) => void;
  onClose: () => void;
}

export default function AddCustomerModal({ onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [signupMethod, setSignupMethod] = useState('Manual Entry');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) return setError('Customer name is required.');
    if (!phone.trim()) return setError('Customer phone number is required.');

    setError('');
    const newCustomer: CustomerProfile = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || 'walkin@idf.com',
      city: city.trim() || 'Bengaluru',
      signup_method: signupMethod,
    };

    onSave(newCustomer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[4px] border border-gold/20 bg-chocolate shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-chocolate px-6 py-4">
          <div>
            <h2 className="font-serif text-xl text-ivory">Register Customer</h2>
            <p className="text-[11px] text-ivory/40 mt-0.5">
              Add a new customer profile manually.
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
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded border border-maroon/30 bg-maroon/10 px-4 py-3 text-[12px] text-maroon">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] text-ivory/50">Full Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priyanshu Sharma"
              className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-ivory/50">Phone Number *</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9988776655"
              className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-ivory/50">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. priyanshu@gmail.com"
              className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-ivory/50">City / Showroom</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bengaluru"
              className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-ivory/50">Source / Sign-up Method</label>
            <select
              value={signupMethod}
              onChange={(e) => setSignupMethod(e.target.value)}
              className="w-full rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory outline-none"
            >
              <option value="Manual Entry">Manual Showroom Registry</option>
              <option value="Walk-in">Walk-in Inquiry</option>
              <option value="WhatsApp">WhatsApp Lead</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gold/15 bg-chocolate px-6 py-4">
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
            <UserPlus className="h-4 w-4" />
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
