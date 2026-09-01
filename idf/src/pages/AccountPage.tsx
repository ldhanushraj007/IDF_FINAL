import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ListOrdered, Loader2, LogOut, Save, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useWishlist } from '../context/WishlistContext';
import { fetchMyOrders, type OrderHistoryRow } from '../lib/customerApi';
import { BUSINESS, inr } from '../lib/constants';
import AuthGate from '../components/AuthGate';
import ProductCard from '../components/ProductCard';
import LoginPage from './LoginPage';

export default function AccountPage() {
  const { enabled, user, profile, loading: authLoading, saveProfile, signOut } = useAuth();
  const { byId } = useCatalog();
  const { ids: wishlistIds } = useWishlist();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState<OrderHistoryRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    document.title = `My Account | ${BUSINESS.name}`;
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setCity(profile.city);
      setAddress(profile.address || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    fetchMyOrders(user.id, user.email)
      .then(setOrders)
      .finally(() => setOrdersLoading(false));
  }, [user]);

  useEffect(() => {
    if (window.location.hash === '#wishlist') {
      document.getElementById('wishlist')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveProfile({ name, phone, city, address });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const wishlistItems = [...wishlistIds].map((id) => byId(id)).filter((i): i is NonNullable<typeof i> => !!i);

  /* -------- Accounts not switched on for this site yet -------- */
  if (!enabled) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-ivory px-6 pt-24 text-center">
        <p className="font-serif text-2xl text-ink">Accounts aren't set up yet</p>
        <p className="max-w-sm text-[14px] text-muted">
          The showroom hasn't switched on customer accounts on this site. Reach out on WhatsApp for
          anything order-related in the meantime.
        </p>
        <Link to="/" className="btn btn-ghost-dark mt-2">
          Back to the website
        </Link>
      </div>
    );
  }

  /* -------- Loading -------- */
  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-ivory pt-24">
        <Loader2 className="h-6 w-6 animate-spin text-gold-dark" />
      </div>
    );
  }

  /* -------- Not signed in → Render Sign In / Sign Up page -------- */
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Page Header ── */}
      <section className="bg-[#FFE6E9]/40 border-b border-[#1F0505]/15 px-6 md:px-12 py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-sans text-[9px] tracking-[0.3em] text-[#1F0505]/40 uppercase font-semibold block mb-2">
              Customer Portal
            </span>
            <h1 className="font-serif text-[36px] sm:text-[48px] md:text-[56px] text-[#1F0505] leading-none tracking-tight">
              My Account
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1F0505] text-white flex items-center justify-center font-sans font-bold text-[14px]">
              {(name || user.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-sans text-[13px] font-bold text-[#1F0505] leading-tight">{name || 'Customer'}</p>
              <p className="font-sans text-[11px] text-[#1F0505]/50">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Layout ── */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-12 py-10 md:py-16 flex flex-col md:flex-row gap-10 md:gap-16">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <a
              href="#profile"
              className="flex-shrink-0 md:w-full px-5 py-3 rounded-full md:rounded-xl font-sans text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-[#1F0505] bg-[#FFE6E9]/60 border border-[#1F0505]/15 flex items-center justify-between transition-all"
            >
              <span>Profile Settings</span>
              <span className="hidden md:inline text-[12px]">→</span>
            </a>
            <a
              href="#orders"
              className="flex-shrink-0 md:w-full px-5 py-3 rounded-full md:rounded-xl font-sans text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-[#1F0505]/70 hover:text-[#1F0505] hover:bg-[#FFE6E9]/30 border border-[#1F0505]/15 flex items-center justify-between transition-all"
            >
              <span>Order History ({orders.length})</span>
              <span className="hidden md:inline text-[12px]">→</span>
            </a>
            <a
              href="#wishlist"
              className="flex-shrink-0 md:w-full px-5 py-3 rounded-full md:rounded-xl font-sans text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-[#1F0505]/70 hover:text-[#1F0505] hover:bg-[#FFE6E9]/30 border border-[#1F0505]/15 flex items-center justify-between transition-all"
            >
              <span>Wishlist ({wishlistItems.length})</span>
              <span className="hidden md:inline text-[12px]">→</span>
            </a>
            <button
              onClick={signOut}
              type="button"
              className="flex-shrink-0 md:w-full px-5 py-3 rounded-full md:rounded-xl font-sans text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-red-600 hover:bg-red-50 border border-red-200 flex items-center justify-between transition-all md:mt-6"
            >
              <span>Sign Out</span>
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </nav>
        </aside>

        {/* Right Content Body */}
        <main className="flex-1 min-w-0 space-y-16">

          {/* ── 1. Profile Details ── */}
          <section id="profile" className="bg-white rounded-2xl border border-[#1F0505]/15 p-6 sm:p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1F0505]/10">
              <div>
                <span className="font-sans text-[8px] tracking-[0.25em] text-[#1F0505]/40 uppercase font-bold">01 / Account</span>
                <h2 className="font-serif text-[28px] sm:text-[32px] text-[#1F0505] leading-tight">Profile Details</h2>
              </div>
            </div>

            <form className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">Full Name</label>
                <input
                  className="w-full border border-[#1F0505]/20 p-3.5 rounded-xl font-sans text-[13px] text-[#1F0505] bg-white outline-none focus:border-[#1F0505] focus:ring-1 focus:ring-[#1F0505] transition-all"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">Email Address</label>
                <input
                  className="w-full border border-[#1F0505]/15 p-3.5 rounded-xl font-sans text-[13px] text-[#1F0505]/50 bg-[#FAFAFA] outline-none cursor-not-allowed"
                  disabled
                  type="email"
                  value={profile?.email || user?.email || ''}
                />
                <span className="text-[10px] text-[#1F0505]/40">Verified account email</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">Phone Number</label>
                <input
                  className="w-full border border-[#1F0505]/20 p-3.5 rounded-xl font-sans text-[13px] text-[#1F0505] bg-white outline-none focus:border-[#1F0505] focus:ring-1 focus:ring-[#1F0505] transition-all"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">City</label>
                <input
                  className="w-full border border-[#1F0505]/20 p-3.5 rounded-xl font-sans text-[13px] text-[#1F0505] bg-white outline-none focus:border-[#1F0505] focus:ring-1 focus:ring-[#1F0505] transition-all"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="font-sans text-[10px] font-bold tracking-[0.14em] text-[#1F0505]/60 uppercase">Delivery Address</label>
                <textarea
                  rows={2}
                  className="w-full border border-[#1F0505]/20 p-3.5 rounded-xl font-sans text-[13px] text-[#1F0505] bg-white outline-none focus:border-[#1F0505] focus:ring-1 focus:ring-[#1F0505] transition-all resize-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat/House No., Street, Area, Pincode"
                />
              </div>

              <div className="sm:col-span-2 pt-4 border-t border-[#1F0505]/10 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#1F0505] text-white rounded-xl px-8 py-3.5 text-[11px] hover:bg-[#1F0505]/90 transition-colors"
                >
                  {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          {/* ── 2. Order History ── */}
          <section id="orders" className="bg-white rounded-2xl border border-[#1F0505]/15 p-6 sm:p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1F0505]/10">
              <div>
                <span className="font-sans text-[8px] tracking-[0.25em] text-[#1F0505]/40 uppercase font-bold">02 / Orders</span>
                <h2 className="font-serif text-[28px] sm:text-[32px] text-[#1F0505] leading-tight">Order History</h2>
              </div>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1F0505]/20 border-t-[#1F0505]" />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 px-6 text-center border border-dashed border-[#1F0505]/20 rounded-xl bg-[#FAFAFA]">
                <ListOrdered className="h-8 w-8 mx-auto text-[#1F0505]/30 mb-3" strokeWidth={1.2} />
                <p className="font-serif text-[20px] text-[#1F0505]">No orders found</p>
                <p className="font-sans text-[12px] text-[#1F0505]/50 mt-1">Your order history will automatically appear here after checking out.</p>
                <Link to="/" className="inline-block mt-4 bg-[#1F0505] text-white px-6 py-2.5 rounded-xl text-[10px]">
                  Explore Catalogue
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#1F0505]/15">
                <table className="w-full text-left font-sans min-w-[550px]">
                  <thead>
                    <tr className="bg-[#FFE6E9]/40 border-b border-[#1F0505]/15 font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-[#1F0505]/70">
                      <th className="py-3.5 px-5">Order Code</th>
                      <th className="py-3.5 px-5">Date</th>
                      <th className="py-3.5 px-5 text-right">Total Amount</th>
                      <th className="py-3.5 px-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F0505]/10 text-[13px]">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-4 px-5 font-medium text-[#1F0505]">{o.orderCode}</td>
                        <td className="py-4 px-5 text-[#1F0505]/60">{o.createdAt}</td>
                        <td className="py-4 px-5 text-right font-semibold text-[#1F0505]">{inr(o.total)}</td>
                        <td className="py-4 px-5 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] ${
                            o.paid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${o.paid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {o.paid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── 3. Wishlist ── */}
          <section id="wishlist" className="bg-white rounded-2xl border border-[#1F0505]/15 p-6 sm:p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1F0505]/10">
              <div>
                <span className="font-sans text-[8px] tracking-[0.25em] text-[#1F0505]/40 uppercase font-bold">03 / Saved</span>
                <h2 className="font-serif text-[28px] sm:text-[32px] text-[#1F0505] leading-tight">My Wishlist</h2>
              </div>
              <span className="font-sans text-[11px] font-semibold text-[#1F0505]/50">{wishlistItems.length} items</span>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="py-12 px-6 text-center border border-dashed border-[#1F0505]/20 rounded-xl bg-[#FAFAFA]">
                <Heart className="h-8 w-8 mx-auto text-[#1F0505]/30 mb-3" strokeWidth={1.2} />
                <p className="font-serif text-[20px] text-[#1F0505]">Your wishlist is empty</p>
                <p className="font-sans text-[12px] text-[#1F0505]/50 mt-1">Tap the heart icon on any fabric in the shop to save it here.</p>
                <Link to="/" className="inline-block mt-4 bg-[#1F0505] text-white px-6 py-2.5 rounded-xl text-[10px]">
                  Browse Fabrics
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}
