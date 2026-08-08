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
    fetchMyOrders()
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
    <div className="min-h-screen bg-ivory pb-24 pt-24 sm:pt-28">
      <div className="container-lux max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-ink">My Account</h1>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted hover:text-maroon"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>

        {/* ---------- Profile ---------- */}
        <section className="mt-8 rounded-[3px] border border-walnut/15 bg-cream p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-serif text-xl text-ink">
            <User className="h-4 w-4 text-gold-dark" />
            Your Details
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="rounded-[2px] border border-walnut/20 bg-ivory px-3.5 py-3 text-[14px] text-ink placeholder-muted/60 outline-none focus:border-gold-dark"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="rounded-[2px] border border-walnut/20 bg-ivory px-3.5 py-3 text-[14px] text-ink placeholder-muted/60 outline-none focus:border-gold-dark"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="rounded-[2px] border border-walnut/20 bg-ivory px-3.5 py-3 text-[14px] text-ink placeholder-muted/60 outline-none focus:border-gold-dark sm:col-span-2"
            />
          </div>
          <p className="mt-2 text-[12px] text-muted">{profile?.email || user.phone || ''}</p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-ghost-dark mt-4 !py-2.5 !text-[11px]"
          >
            {saved ? <Save className="h-3.5 w-3.5" /> : saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saved ? 'Saved' : 'Save Details'}
          </button>
        </section>

        {/* ---------- Orders ---------- */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-serif text-xl text-ink">
            <ListOrdered className="h-4 w-4 text-gold-dark" />
            My Orders
          </h2>

          {ordersLoading ? (
            <div className="mt-4 flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gold-dark" />
            </div>
          ) : orders.length === 0 ? (
            <p className="mt-4 rounded-[3px] border border-walnut/12 bg-cream p-5 text-center text-[13.5px] text-muted">
              No orders yet — your order history will appear here once you check out.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-[3px] border border-walnut/12 bg-cream p-4"
                >
                  <div className="min-w-0">
                    <p className="font-nums text-[13px] font-semibold text-ink">{o.orderCode}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-muted">{o.itemNames}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted/70">{o.createdAt}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-nums text-[15px] font-semibold text-gold-dark">{inr(o.total)}</p>
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${
                        o.paid ? 'text-gold-dark' : 'text-muted'
                      }`}
                    >
                      {o.paid ? 'Paid' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------- Wishlist ---------- */}
        <section id="wishlist" className="mt-10 scroll-mt-24">
          <h2 className="flex items-center gap-2 font-serif text-xl text-ink">
            <Heart className="h-4 w-4 text-gold-dark" />
            Wishlist
          </h2>

          {wishlistItems.length === 0 ? (
            <p className="mt-4 rounded-[3px] border border-walnut/12 bg-cream p-5 text-center text-[13.5px] text-muted">
              Tap the heart on any fabric to save it here.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlistItems.map((item) => (
                <div key={item.id} className="rounded-[3px] bg-night">
                  <ProductCard item={item} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
