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

export default function AccountPage() {
  const { enabled, user, profile, loading: authLoading, saveProfile, signOut } = useAuth();
  const { byId } = useCatalog();
  const { ids: wishlistIds } = useWishlist();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
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
    await saveProfile({ name, phone, city });
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

  /* -------- Not signed in -------- */
  if (!user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-ivory px-6 pt-24">
        <div className="w-full max-w-xs text-center">
          <User className="mx-auto h-8 w-8 text-gold-dark" strokeWidth={1.5} />
          <h1 className="mt-3 font-serif text-2xl text-ink">Sign in to view your account</h1>
          <p className="mt-2 text-[13.5px] text-muted">Your orders and wishlist live here.</p>
          <div className="mt-6">
            <AuthGate compact />
          </div>
        </div>
      </div>
    );
  }

  /* -------- Signed in -------- */
  return (
    <div className="min-h-screen flex flex-col bg-background relative border-x border-[#1a1a1a] mx-margin-page">
      {/* Header Section */}
      <section className="border-b border-on-background grid-line flex w-full min-h-[200px]">
        <div className="w-12 border-r border-on-background grid-line flex flex-col justify-between py-4 items-center bg-surface-container-lowest shrink-0">
          <span className="font-index-num text-index-num text-secondary">02</span>
          <span className="font-label-caps text-label-caps -rotate-90 tracking-widest whitespace-nowrap uppercase">ACCOUNT</span>
        </div>
        <div className="flex-1 px-12 py-16 flex items-end bg-surface">
          <h1 className="font-display-lg text-display-lg hidden md:block font-serif">My Account.</h1>
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:hidden font-serif">My Account.</h1>
        </div>
      </section>

      {/* Content Grid */}
      <section className="flex flex-1 w-full relative">
        <div className="w-12 border-r border-on-background grid-line flex flex-col items-center py-4 bg-surface-container-lowest shrink-0 z-10 hidden md:flex">
          <span className="font-index-num text-index-num text-secondary">03</span>
        </div>
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 border-r border-on-background grid-line bg-surface shrink-0 hidden md:block">
          <nav className="flex flex-col font-label-caps text-label-caps">
            <a className="px-8 py-6 border-b grid-line-secondary flex items-center justify-between text-primary bg-surface-variant group uppercase" href="#profile">
              PROFILE SETTINGS
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
            <a className="px-8 py-6 border-b grid-line-secondary flex items-center justify-between text-secondary hover:text-primary hover:bg-surface-container transition-colors group uppercase" href="#orders">
              ORDER HISTORY
              <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">arrow_forward</span>
            </a>
            <a className="px-8 py-6 border-b grid-line-secondary flex items-center justify-between text-secondary hover:text-primary hover:bg-surface-container transition-colors group uppercase" href="#wishlist">
              WISHLIST
              <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">arrow_forward</span>
            </a>
            <button
              onClick={signOut}
              className="px-8 py-6 flex items-center justify-between text-secondary hover:text-error transition-colors mt-auto border-t grid-line-secondary w-full text-left uppercase"
            >
              LOGOUT
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-background relative z-0 min-w-0">
          {/* Profile Settings Section */}
          <div className="p-8 md:p-12 max-w-4xl" id="profile">
            <div className="flex justify-between items-baseline mb-8 border-b border-[#1a1a1a] pb-4">
              <h2 className="font-headline-md text-headline-md font-serif">Profile Details</h2>
              <span className="font-label-caps text-label-caps text-secondary">03.1</span>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-secondary">FULL NAME</label>
                <input
                  className="w-full border border-[#1a1a1a] p-3 text-body-sm bg-transparent outline-none focus:border-brand-gold"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-secondary">EMAIL ADDRESS</label>
                <input
                  className="w-full border border-[#1a1a1a] p-3 text-body-sm bg-transparent outline-none text-secondary"
                  disabled
                  type="email"
                  value={profile?.email || user?.email || ''}
                />
                <span className="text-[10px] text-secondary mt-1">Contact support to change email.</span>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-secondary">PHONE NUMBER</label>
                <input
                  className="w-full border border-[#1a1a1a] p-3 text-body-sm bg-transparent outline-none focus:border-brand-gold"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-secondary">CITY</label>
                <input
                  className="w-full border border-[#1a1a1a] p-3 text-body-sm bg-transparent outline-none focus:border-brand-gold"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 mt-4 pt-8 border-t border-[#1a1a1a]/10 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 hover:bg-brand-gold transition-colors"
                >
                  {saved ? 'SAVED ✓' : saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>

          {/* Divider */}
          <div className="w-full h-px border-b border-[#1a1a1a]"></div>

          {/* Order History Section */}
          <div className="p-8 md:p-12" id="orders">
            <div className="flex justify-between items-baseline mb-8 border-b border-[#1a1a1a] pb-4">
              <h2 className="font-headline-md text-headline-md font-serif">Order History</h2>
              <span className="font-label-caps text-label-caps text-secondary">03.2</span>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin border-2 border-secondary border-t-brand-gold rounded-full" />
              </div>
            ) : orders.length === 0 ? (
              <p className="p-6 text-center text-secondary border border-[#1a1a1a]/10">
                No orders yet — your order history will appear here once you check out.
              </p>
            ) : (
              <div className="flex flex-col w-full border border-[#1a1a1a] overflow-x-auto">
                <div className="grid grid-cols-4 bg-surface-container font-label-caps text-label-caps py-4 px-6 border-b border-[#1a1a1a] text-secondary min-w-[600px]">
                  <div>ORDER CODE</div>
                  <div>DATE</div>
                  <div className="text-right">TOTAL</div>
                  <div className="text-right">STATUS</div>
                </div>
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="grid grid-cols-4 items-center py-6 px-6 border-b border-[#1a1a1a]/10 hover:bg-surface-container-lowest transition-colors min-w-[600px]"
                  >
                    <div className="font-body-lg text-primary">{o.orderCode}</div>
                    <div className="font-body-sm text-secondary">{o.createdAt}</div>
                    <div className="font-body-lg text-primary text-right">{inr(o.total)}</div>
                    <div className="flex justify-end items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${o.paid ? 'bg-brand-gold' : 'bg-primary'}`}></span>
                      <span className="font-label-caps text-label-caps">{o.paid ? 'PAID' : 'PENDING'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-full h-px border-b border-[#1a1a1a]"></div>

          {/* Wishlist Section */}
          <div className="p-8 md:p-12" id="wishlist">
            <div className="flex justify-between items-baseline mb-8 border-b border-[#1a1a1a] pb-4">
              <h2 className="font-headline-md text-headline-md font-serif">Wishlist</h2>
              <span className="font-label-caps text-label-caps text-secondary">03.3</span>
            </div>

            {wishlistItems.length === 0 ? (
              <p className="p-6 text-center text-secondary border border-[#1a1a1a]/10">
                Tap the heart on any fabric to save it here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border border-[#1a1a1a] divide-y sm:divide-y-0 sm:divide-x border-[#1a1a1a]/10">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="flex flex-col bg-surface relative group">
                    <div className="aspect-square w-full border-b border-[#1a1a1a] overflow-hidden relative">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={item.image} alt={item.name} />
                      <div className="absolute top-4 left-4 bg-surface px-3 py-1 border border-[#1a1a1a] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        <span className="font-index-num text-index-num tracking-wider">IN STOCK</span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col gap-2">
                      <span className="font-label-caps text-label-caps text-brand-gold">{item.category}</span>
                      <h3 className="font-headline-md text-[24px] leading-tight font-serif">{item.name}</h3>
                      <div className="font-body-lg text-primary mt-2">{inr(item.pricePerMetre)} <span className="text-[12px] text-secondary">/ metre</span></div>
                      <Link to={`/product/${item.id}`} className="mt-4 border border-[#1a1a1a] py-3 w-full font-label-caps text-label-caps hover:bg-primary hover:text-white transition-colors flex justify-center items-center gap-2 text-center">
                        VIEW PRODUCT
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
