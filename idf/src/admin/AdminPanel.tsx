import { useEffect, useMemo, useState } from 'react';
import AddProductModal from './AddProductModal';
import AddCustomerModal from './AddCustomerModal';
import AddOrderModal from './AddOrderModal';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Plus,
  Search,
  Star,
  Tag as TagIcon,
  Trash2,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  DollarSign,
  FolderOpen, // For Categories tab
  Percent, // For Combos tab
  Sun,
  Moon,
} from 'lucide-react';
import {
  CATALOG,
  STOCK_LABELS,
  STOCK_VALUES,
  TAG_LABELS,
  TAG_VALUES,
  CATEGORY_VALUES,
  type Item,
  type Stock,
  type Tag,
} from '../data/catalog';
import { type Review } from '../data/reviews';
import { loadCatalog, EMPTY_OFFER, type Offer } from '../lib/catalogSource';
import { loadReviews } from '../lib/reviewSource';
import { isAdminConfigured } from '../lib/adminApi';
import {
  adminRequestOtp,
  adminVerifyOtp,
  checkIsAdmin,
  adminSignOut,
  fetchProducts,
  fetchOffer,
  publishProducts,
  fetchAllReviews,
  setReviewStatus,
  deleteReview,
  addManualReview,
  fetchOrders,
  setOrderStatus,
  addManualCustomer,
  addManualOrder,
  type AdminReviewRow,
  type AdminOrderRow,
} from '../lib/adminApi';
import { ADMIN_STATIC_PIN, BUSINESS, ORDER, UPI, inr } from '../lib/constants';
import { DEFAULT_CATEGORIES, type CategoryConfig } from '../lib/categories';

type TabId = 'dashboard' | 'orders' | 'catalog' | 'reviews' | 'customers' | 'categories' | 'combos' | 'payments' | 'settings';

const blankItem = (): Item => ({
  id: `fabric-${Math.random().toString(36).slice(2, 7)}`,
  name: 'New Fabric',
  category: 'Contemporary',
  composition: '100% Pure Silk',
  width: '44 in',
  pricePerMetre: 2500,
  minMetres: 0.5,
  stock: 'in',
  tags: ['new-arrival'],
  image: '/images/fabrics/f01.jpg',
  blurb: 'Luxurious silk fabric with fine craftsmanship.',
});

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsv(filename: string, rows: Record<string, string | number | boolean>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ================================================================== *
 * LOGIN SCREENS
 * ================================================================== */

/**
 * OTP-based Admin Login (when Apps Script backend is deployed).
 * Step 1: enter admin password → OTP sent to indesignluxuryfabrics@gmail.com
 * Step 2: enter OTP → session token saved → panel unlocked
 */
function SupabaseLogin({ onUnlocked }: { onUnlocked: () => void }) {
  const [step, setStep]           = useState<'password' | 'otp'>('password');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [otpVal, setOtpVal]       = useState('');
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');
  const [info, setInfo]           = useState('');

  // Step 1: validate password → send OTP
  const handlePassword = async () => {
    setError('');
    if (!password) return setError('Enter the admin password.');
    setBusy(true);
    try {
      await adminRequestOtp(password);
      setInfo('A 6-digit verification code was sent to virtuosodhanush@gmail.com');
      setStep('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  // Step 2: verify OTP → unlock panel
  const handleOtp = async () => {
    setError('');
    if (otpVal.length < 6) return setError('Enter the 6-digit code.');
    setBusy(true);
    try {
      await adminVerifyOtp(otpVal.trim());
      if (!checkIsAdmin()) throw new Error('Session not created.');
      onUnlocked();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code.');
    } finally {
      setBusy(false);
    }
  };

  const Header = () => (
    <div className="text-center pb-6 mb-6 border-b border-[#d4af37]/20 flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mb-3 shadow-md">
        <img src="/images/logo/logo-mark.png" alt="" aria-hidden="true" className="h-10 w-auto object-contain" />
      </div>
      <span className="text-[9px] tracking-[0.3em] text-[#d4af37] uppercase font-bold px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 mb-2">
        Admin Portal
      </span>
      <h1 className="font-serif text-2xl text-white tracking-wide">In Design Luxury Fabrics</h1>
    </div>
  );

  if (step === 'otp') {
    return (
      <div className="w-full max-w-md bg-[#180e0c]/90 border border-[#d4af37]/30 rounded-3xl p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
        <Header />
        {info && (
          <p className="mb-5 text-[11px] text-[#ffe6e9]/90 border border-[#d4af37]/30 bg-[#d4af37]/10 rounded-xl px-4 py-3 text-center leading-relaxed">
            {info}
          </p>
        )}
        <p className="mb-4 text-[11px] text-white/50 tracking-[0.2em] uppercase font-bold text-center">
          Enter Verification Code
        </p>
        <div className="rounded-2xl border border-[#d4af37]/30 bg-black/40 focus-within:border-[#d4af37] focus-within:ring-2 focus-within:ring-[#d4af37]/20 transition-all overflow-hidden">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpVal}
            autoFocus
            onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleOtp()}
            placeholder="• • • • • •"
            className="w-full bg-transparent px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-[#d4af37] placeholder-white/20 outline-none font-bold"
          />
        </div>
        <button
          type="button"
          onClick={handleOtp}
          disabled={busy}
          className="mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[11px] tracking-[0.22em] uppercase shadow-lg hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Unlock →'}
        </button>
        {error && (
          <p className="mt-4 text-[11px] text-red-300 border border-red-500/30 bg-red-950/40 rounded-xl px-4 py-2.5 text-center font-medium">
            {error}
          </p>
        )}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setStep('password'); setError(''); setOtpVal(''); }}
            className="text-[11px] text-white/40 hover:text-[#d4af37] transition-colors font-medium"
          >
            ← Resend / Change password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-[#180e0c]/90 border border-[#d4af37]/30 rounded-3xl p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
      <Header />
      <p className="mb-4 text-[11px] text-white/50 tracking-[0.2em] uppercase font-bold text-center">
        Sign In With Admin Password
      </p>
      <div className="rounded-2xl border border-[#d4af37]/30 bg-black/40 focus-within:border-[#d4af37] focus-within:ring-2 focus-within:ring-[#d4af37]/20 transition-all flex items-center overflow-hidden">
        <input
          type={showPw ? 'text' : 'password'}
          value={password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePassword()}
          placeholder="Admin password"
          className="flex-1 bg-transparent px-4 py-3.5 text-[13px] text-white placeholder-white/30 outline-none"
        />
        <button
          type="button"
          onClick={() => setShowPw(v => !v)}
          aria-label={showPw ? 'Hide' : 'Show'}
          className="px-4 text-white/40 hover:text-white transition-colors"
        >
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <button
        type="button"
        onClick={handlePassword}
        disabled={busy}
        className="mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[11px] tracking-[0.22em] uppercase shadow-lg hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Verification Code →'}
      </button>
      {error && (
        <p className="mt-4 text-[11px] text-red-300 border border-red-500/30 bg-red-950/40 rounded-xl px-4 py-2.5 text-center font-medium">
          {error}
        </p>
      )}
      <div className="mt-8 border-t border-white/10 pt-4 text-center">
        <a href="/" className="text-[10px] text-white/40 hover:text-[#d4af37] tracking-[0.18em] uppercase font-bold transition-colors">
          ← Back to website
        </a>
      </div>
    </div>
  );
}

function PinLogin({ onUnlocked }: { onUnlocked: () => void }) {
  const [pin, setPin] = useState('');
  const [wrong, setWrong] = useState(false);

  const tryUnlock = () => {
    if (pin === ADMIN_STATIC_PIN) onUnlocked();
    else setWrong(true);
  };

  return (
    <div className="w-full max-w-md bg-[#180e0c]/90 border border-[#d4af37]/30 rounded-3xl p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
      <div className="text-center pb-6 mb-6 border-b border-[#d4af37]/20 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mb-3 shadow-md">
          <img src="/images/logo/logo-mark.png" alt="" aria-hidden="true" className="h-10 w-auto object-contain" />
        </div>
        <span className="text-[9px] tracking-[0.3em] text-[#d4af37] uppercase font-bold px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 mb-2">
          Admin Portal · Static Mode
        </span>
        <h1 className="font-serif text-2xl text-white tracking-wide">In Design Luxury Fabrics</h1>
      </div>

      <p className="mb-4 text-[11px] text-white/50 tracking-[0.2em] uppercase font-bold text-center">
        Enter Shop PIN To Continue
      </p>

      <div className="rounded-2xl border border-[#d4af37]/30 bg-black/40 focus-within:border-[#d4af37] focus-within:ring-2 focus-within:ring-[#d4af37]/20 transition-all overflow-hidden">
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          autoFocus
          onChange={(e) => {
            setPin(e.target.value);
            setWrong(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
          placeholder="• • • • • •"
          className="w-full bg-transparent px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-[#d4af37] placeholder-white/20 outline-none font-bold"
        />
      </div>

      <button
        type="button"
        onClick={tryUnlock}
        className="mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[11px] tracking-[0.22em] uppercase shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
      >
        Unlock Dashboard →
      </button>
      {wrong && (
        <p className="mt-4 text-[11px] text-red-300 border border-red-500/30 bg-red-950/40 rounded-xl px-4 py-2.5 text-center font-medium">
          Incorrect PIN — try again
        </p>
      )}

      <div className="mt-8 border-t border-white/10 pt-4 text-center">
        <a href="/" className="text-[10px] text-white/40 hover:text-[#d4af37] tracking-[0.18em] uppercase font-bold transition-colors">
          ← Back to website
        </a>
      </div>
    </div>
  );
}

/* ================================================================== *
 * MAIN ADMIN PORTAL DASHBOARD & SECTIONS
 * ================================================================== */

export default function AdminPanel() {
  const [unlocked, setUnlocked] = useState(() => checkIsAdmin());
  const [tab, setTab] = useState<TabId>('dashboard');
  const [dataLoading, setDataLoading] = useState(true);

  // Core state
  const [items, setItems] = useState<Item[]>(CATALOG);
  const [originalIds, setOriginalIds] = useState<string[]>([]);
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [liveReviews, setLiveReviews] = useState<AdminReviewRow[]>([]);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);

  // UI state
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending_whatsapp' | 'confirmed' | 'fulfilled'>('all');
  const [dirty, setDirty] = useState(false);
  const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'done' | 'error'>('idle');
  const [publishError, setPublishError] = useState('');
  const [testWebhookStatus, setTestWebhookStatus] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('idf_admin_theme') === 'dark';
  });

  const loadAllData = () => {
    if (!unlocked) return;
    setDataLoading(true);

    if (isAdminConfigured) {
      Promise.all([fetchProducts(), fetchOffer(), fetchAllReviews(), fetchOrders()])
        .then(([prods, off, revs, ords]) => {
          // If the sheet has no products, fallback to default local CATALOG
          const activeProds = prods.length > 0 ? prods : CATALOG;
          setItems(activeProds);
          setOriginalIds(activeProds.map((p) => p.id));
          setOffer(off);
          setLiveReviews(revs);
          setOrders(ords);
          if (prods.length === 0) {
            setDirty(true); // Mark as dirty so user can hit "Publish Live" to sync defaults
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setDataLoading(false));
    } else {
      Promise.all([loadCatalog(), loadReviews()])
        .then(([c, r]) => {
          setItems(c.items);
          setOffer(c.offer);
          setReviews(r);
        })
        .finally(() => setDataLoading(false));
    }
  };

  useEffect(() => {
    loadAllData();
  }, [unlocked]);

  // Calculated Metrics for Dashboard
  const metrics = useMemo(() => {
    const pendingOrders = orders.filter((o) => o.order_status === 'pending_whatsapp').length;
    const confirmedOrders = orders.filter((o) => o.order_status === 'confirmed').length;
    const fulfilledOrders = orders.filter((o) => o.order_status === 'fulfilled').length;

    const totalRevenue = orders
      .filter((o) => o.paid || o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    const lowStockCount = items.filter((i) => i.stock === 'low').length;
    const outStockCount = items.filter((i) => i.stock === 'out').length;
    const pendingReviewsCount = liveReviews.filter((r) => r.status === 'pending').length;

    return {
      pendingOrders,
      confirmedOrders,
      fulfilledOrders,
      totalRevenue,
      lowStockCount,
      outStockCount,
      pendingReviewsCount,
    };
  }, [orders, items, liveReviews]);

  // Filtered Catalog
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) : items;
  }, [items, query]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (orderFilter !== 'all') {
      list = list.filter((o) => o.order_status === orderFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.order_code.toLowerCase().includes(q) ||
          (o.customers?.name || '').toLowerCase().includes(q) ||
          (o.customers?.phone || '').includes(q),
      );
    }
    return list;
  }, [orders, orderFilter, query]);

  const patchFabric = (id: string, changes: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
    setDirty(true);
  };

  const handlePublish = async () => {
    setPublishState('publishing');
    setPublishError('');
    try {
      await publishProducts(items, offer);
      setOriginalIds(items.map((i) => i.id));
      setDirty(false);
      setPublishState('done');
      setTimeout(() => setPublishState('idle'), 2500);
    } catch (e) {
      setPublishState('error');
      setPublishError(e instanceof Error ? e.message : 'Publish failed');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'confirmed' | 'fulfilled') => {
    try {
      await setOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, order_status: status } : null));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const handleToggleReview = async (id: string, newStatus: 'published' | 'private') => {
    try {
      await setReviewStatus(id, newStatus);
      setLiveReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Review action failed');
    }
  };

  const handleDeleteReviewRow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(id);
      setLiveReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0806] px-4">
        {/* Decorative grid lines */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04]">
          <div className="absolute left-1/4 top-0 h-full w-px bg-ivory" />
          <div className="absolute left-3/4 top-0 h-full w-px bg-ivory" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-ivory" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-ivory" />
        </div>
        <div className="relative">
          {isAdminConfigured ? (
            <SupabaseLogin onUnlocked={() => setUnlocked(true)} />
          ) : (
            <PinLogin onUnlocked={() => setUnlocked(true)} />
          )}
        </div>
      </div>
    );
  }

  const handleThemeToggle = (dark: boolean) => {
    setDarkMode(dark);
    localStorage.setItem('idf_admin_theme', dark ? 'dark' : 'light');
  };

  // Extract all unique customers from orders for customer list (registry fallback)
  const customerList = useMemo(() => {
    const registry: Record<string, { name: string; phone: string; email: string; city: string; signup_method: string }> = {};
    orders.forEach((o) => {
      if (o.customers?.phone) {
        registry[o.customers.phone] = {
          name: o.customers.name || 'Walk-in',
          phone: o.customers.phone,
          email: o.customers.email || 'walkin@idf.com',
          city: o.city || 'Bengaluru',
          signup_method: o.payment_method === 'Cash' ? 'Manual Registry' : 'Online checkout',
        };
      }
    });
    return Object.values(registry);
  }, [orders]);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0d0806] text-ivory' : 'bg-[#f7f4f0] text-night'}`}>
      {/* ================= SIDEBAR (FIXED ON SCROLL) ================= */}
      <aside className={`w-60 shrink-0 border-r flex flex-col justify-between hidden md:flex sticky top-0 h-screen overflow-y-auto ${
        darkMode ? 'border-gold/10 bg-[#150a0a]' : 'border-[#1a1a1a]/10 bg-white'
      }`}>
        {/* Logo area */}
        <div>
          <div className={`px-6 py-5 border-b flex items-center gap-3 ${
            darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
          }`}>
            <img src="/images/logo/logo-mark.png" alt="" className="h-9 w-9 object-contain" />
            <div>
              <p className="text-[9px] tracking-[0.22em] text-gold uppercase font-semibold">Admin Portal</p>
              <h2 className="font-serif text-[15px] text-ivory leading-tight">In Design</h2>
            </div>
          </div>

          <nav className="mt-4 px-3">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, idx: '01' },
              { id: 'orders', label: 'Orders', icon: ShoppingBag, idx: '02', badge: metrics.confirmedOrders },
              { id: 'catalog', label: 'Catalog', icon: Package, idx: '03' },
              { id: 'categories', label: 'Categories', icon: FolderOpen, idx: '04' },
              { id: 'combos', label: 'Combos', icon: Percent, idx: '05' },
              { id: 'reviews', label: 'Reviews', icon: Star, idx: '06', badge: metrics.pendingReviewsCount },
              { id: 'customers', label: 'Customers', icon: Users, idx: '07' },
              { id: 'payments', label: 'Payments', icon: CreditCard, idx: '08' },
              { id: 'settings', label: 'Settings', icon: SettingsIcon, idx: '09' },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id as TabId);
                    setQuery('');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 mb-1.5 rounded-2xl text-[12px] font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] shadow-md font-bold'
                      : (darkMode
                          ? 'text-ivory/60 hover:text-white hover:bg-[#d4af37]/10'
                          : 'text-night/70 hover:text-night hover:bg-[#d4af37]/10')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-mono tabular-nums ${
                      active ? 'text-[#1F0505]' : (darkMode ? 'text-ivory/30' : 'text-night/30')
                    }`}>{item.idx}</span>
                    <Icon className="h-4 w-4" />
                    <span className="tracking-wide">{item.label}</span>
                  </div>
                  {Boolean((item as any).badge) && (
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold tabular-nums ${
                      active ? 'bg-black text-gold' : 'bg-gold/20 text-gold'
                    }`}>
                      {(item as any).badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[9px] uppercase tracking-widest font-semibold ${
                isAdminConfigured ? 'text-gold' : (darkMode ? 'text-ivory/30' : 'text-night/30')
              }`}>
                {isAdminConfigured ? '● Connected' : '● Static'}
              </p>
            </div>
            <button
              onClick={() => {
                adminSignOut();
                setUnlocked(false);
              }}
              className={`text-[11px] tracking-wide uppercase hover:text-gold transition-colors ${
                darkMode ? 'text-ivory/30' : 'text-night/30'
              }`}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className={`border-b px-6 py-4 flex items-center justify-between ${
          darkMode ? 'border-gold/10 bg-[#150a0a]' : 'border-[#1a1a1a]/10 bg-white'
        }`}>
          <div className="flex items-center gap-4">
            <div>
              <p className={`text-[9px] uppercase tracking-[0.2em] font-semibold mb-0.5 ${
                darkMode ? 'text-ivory/30' : 'text-night/30'
              }`}>In Design Admin</p>
              <h1 className={`font-serif text-xl capitalize ${
                darkMode ? 'text-ivory' : 'text-night'
              }`}>{tab}</h1>
            </div>
            {dirty && (
              <span className="border border-gold/40 bg-gold/8 px-2.5 py-1 text-[10px] text-gold tracking-widest uppercase">
                Unsaved Changes
              </span>
            )}
            {!isAdminConfigured && (
              <div className="hidden lg:flex items-center border border-maroon/30 bg-maroon/5 px-3 py-1.5 text-[11px] text-maroon uppercase tracking-wider font-semibold">
                ⚠️ PIN-gated (Static Mode). Sensitive customer data and orders require Connected Mode.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <button
              type="button"
              onClick={() => handleThemeToggle(!darkMode)}
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                darkMode
                  ? 'border-gold/30 bg-gold/10 text-gold hover:bg-gold/20'
                  : 'border-[#1F0505]/20 bg-white text-[#1F0505] hover:bg-[#FFE6E9]/40 shadow-sm'
              }`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={handlePublish}
              disabled={publishState === 'publishing'}
              className="rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[11px] tracking-[0.2em] uppercase px-5 py-2.5 shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {publishState === 'publishing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : publishState === 'done' ? (
                'Published ✓'
              ) : (
                'Publish Live'
              )}
            </button>
            <a href="/" target="_blank" className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] border px-4 py-2.5 rounded-full transition-all ${
              darkMode
                ? 'border-gold/30 text-gold hover:bg-gold/10'
                : 'border-[#1F0505]/20 text-[#1F0505] hover:bg-[#1F0505] hover:text-white bg-white shadow-sm'
            }`}>
              <span>View Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {dataLoading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-gold" />
            </div>
          ) : (
            <>
              {/* ============ TAB 1: DASHBOARD ============ */}
              {tab === 'dashboard' && (
                <div className="space-y-6">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: 'Orders Needing Action', value: metrics.confirmedOrders,
                        sub: `${metrics.pendingOrders} pending WhatsApp send`, accent: 'text-gold',
                        onClick: () => setTab('orders'), idx: '01'
                      },
                      {
                        label: 'Total Revenue', value: inr(metrics.totalRevenue),
                        sub: 'From confirmed paid orders', accent: darkMode ? 'text-ivory' : 'text-night',
                        idx: '02'
                      },
                      {
                        label: 'Stock Alerts', value: metrics.lowStockCount + metrics.outStockCount,
                        sub: `${metrics.outStockCount} out · ${metrics.lowStockCount} low`, accent: 'text-maroon',
                        onClick: () => setTab('catalog'), idx: '03'
                      },
                      {
                        label: 'Pending Reviews', value: metrics.pendingReviewsCount,
                        sub: 'Awaiting moderation', accent: 'text-gold',
                        onClick: () => setTab('reviews'), idx: '04'
                      },
                    ].map((card) => (
                      <div
                        key={card.idx}
                        onClick={card.onClick}
                        className={`relative p-6 rounded-3xl border transition-all duration-300 shadow-md ${
                          card.onClick ? 'cursor-pointer hover:-translate-y-1' : ''
                        } ${
                          darkMode
                            ? 'border-gold/20 bg-[#160b09]/80 hover:border-gold/50 shadow-black/40'
                            : 'border-[#1a1a1a]/15 bg-white hover:border-gold/50 shadow-gray-200'
                        }`}
                      >
                        <p className={`text-[10px] font-mono font-bold absolute top-4 right-4 ${
                          darkMode ? 'text-gold/40' : 'text-gold'
                        }`}>{card.idx}</p>
                        <p className={`text-[10px] uppercase tracking-[0.18em] font-bold mb-2 ${
                          darkMode ? 'text-ivory/50' : 'text-night/50'
                        }`}>{card.label}</p>
                        <h3 className={`font-nums text-3xl font-bold ${card.accent}`}>{card.value}</h3>
                        <p className={`mt-2 text-[11px] font-medium ${
                          darkMode ? 'text-ivory/40' : 'text-night/40'
                        }`}>{card.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent Orders */}
                    <div className={`rounded-3xl border ${
                      darkMode ? 'border-gold/20 bg-[#160b09]/80 shadow-xl' : 'border-[#1a1a1a]/15 bg-white shadow-lg'
                    } overflow-hidden`}>
                      <div className={`flex items-center justify-between px-6 py-4 border-b ${
                        darkMode ? 'border-gold/15 bg-white/5' : 'border-[#1a1a1a]/10 bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-gold" />
                          <h3 className={`font-serif text-lg font-medium ${
                            darkMode ? 'text-white' : 'text-night'
                          }`}>Recent Orders</h3>
                        </div>
                        <button onClick={() => setTab('orders')} className="text-[10px] text-gold font-bold uppercase tracking-[0.18em] hover:underline">
                          View all orders →
                        </button>
                      </div>
                      <div className="divide-y divide-gold/10">
                        {orders.slice(0, 5).map((o) => (
                          <div
                            key={o.id}
                            onClick={() => setSelectedOrder(o)}
                            className={`flex cursor-pointer items-center justify-between px-6 py-3.5 transition-colors ${
                              darkMode ? 'hover:bg-gold/10' : 'hover:bg-gold/10'
                            }`}
                          >
                            <div>
                              <p className="font-mono text-[12px] font-bold text-gold">{o.order_code}</p>
                              <p className={`text-[11px] font-medium ${
                                darkMode ? 'text-ivory/60' : 'text-night/60'
                              }`}>{o.customers?.name || 'Customer'}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-nums text-[14px] font-bold ${
                                darkMode ? 'text-white' : 'text-night'
                              }`}>{inr(o.total)}</p>
                              <span className="inline-block rounded-full bg-gold/15 border border-gold/30 px-2 py-0.5 text-[9px] font-bold text-gold uppercase tracking-wider">
                                {o.order_status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                        {orders.length === 0 && (
                          <div className="px-6 py-10 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mx-auto mb-2">
                              <ShoppingBag className="h-6 w-6" />
                            </div>
                            <p className={`text-[13px] font-bold ${darkMode ? 'text-ivory' : 'text-night'}`}>No Orders Placed Yet</p>
                            <p className={`text-[11px] ${darkMode ? 'text-ivory/40' : 'text-night/40'}`}>
                              Customer checkout orders will appear here automatically in real time.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pending Reviews */}
                    <div className={`rounded-3xl border ${
                      darkMode ? 'border-gold/20 bg-[#160b09]/80 shadow-xl' : 'border-[#1a1a1a]/15 bg-white shadow-lg'
                    } overflow-hidden`}>
                      <div className={`flex items-center justify-between px-6 py-4 border-b ${
                        darkMode ? 'border-gold/15 bg-white/5' : 'border-[#1a1a1a]/10 bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-gold fill-gold" />
                          <h3 className={`font-serif text-lg font-medium ${
                            darkMode ? 'text-white' : 'text-night'
                          }`}>Reviews to Moderate</h3>
                        </div>
                        <button onClick={() => setTab('reviews')} className="text-[10px] text-gold font-bold uppercase tracking-[0.18em] hover:underline">
                          View queue →
                        </button>
                      </div>
                      <div className="divide-y divide-gold/10">
                        {liveReviews
                          .filter((r) => r.status === 'pending')
                          .slice(0, 4)
                          .map((r) => (
                            <div key={r.id} className="px-6 py-3.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-[12px] font-bold ${
                                  darkMode ? 'text-white' : 'text-night'
                                }`}>{r.name}</span>
                                <div className="flex text-gold gap-0.5">
                                  {Array.from({ length: r.rating }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-current" />
                                  ))}
                                </div>
                              </div>
                              <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                                darkMode ? 'text-ivory/60' : 'text-night/60'
                              }`}>{r.text}</p>
                            </div>
                          ))}
                        {liveReviews.filter((r) => r.status === 'pending').length === 0 && (
                          <div className="px-6 py-10 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-2">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <p className={`text-[13px] font-bold ${darkMode ? 'text-ivory' : 'text-night'}`}>All Reviews Moderated</p>
                            <p className={`text-[11px] ${darkMode ? 'text-ivory/40' : 'text-night/40'}`}>
                              No pending customer reviews in the approval queue.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============ TAB 2: ORDERS ============ */}
              {tab === 'orders' && (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <div className={`relative flex-1 max-w-sm border focus-within:border-gold transition-colors ${
                      darkMode ? 'border-ivory/10' : 'border-[#1a1a1a]/15'
                    }`}>
                      <Search className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
                        darkMode ? 'text-ivory/30' : 'text-night/30'
                      }`} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search order ID, name, phone…"
                        className="w-full bg-transparent py-2 pl-9 pr-4 text-[12px] outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value as any)}
                        className={`border text-[11px] px-3 py-2 outline-none ${
                          darkMode ? 'border-ivory/10 bg-transparent text-ivory/70' : 'border-[#1a1a1a]/15 bg-transparent text-night/70'
                        }`}
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending_whatsapp">Pending WhatsApp</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="fulfilled">Fulfilled</option>
                      </select>

                      <button
                        onClick={() => setShowAddOrderModal(true)}
                        className="btn btn-gold text-[10px] px-3 py-2 flex items-center gap-1.5 uppercase tracking-widest"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Order</span>
                      </button>

                      <button
                        onClick={() =>
                          exportCsv(
                            'idf-orders.csv',
                            filteredOrders.map((o) => ({
                              OrderID: o.order_code,
                              Customer: o.customers?.name || '',
                              Phone: o.customers?.phone || '',
                              Total: o.total,
                              PaymentStatus: o.payment_status,
                              OrderStatus: o.order_status,
                              CreatedAt: o.created_at,
                            })),
                          )
                        }
                        className={`border text-[10px] px-3 py-2 flex items-center gap-1.5 uppercase tracking-widest transition-colors ${
                          darkMode
                            ? 'border-ivory/15 text-ivory/50 hover:border-gold hover:text-gold'
                            : 'border-[#1a1a1a]/15 text-night/50 hover:border-gold hover:text-gold'
                        }`}
                      >
                        <Download className="h-3 w-3" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className={`overflow-x-auto border ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <table className="w-full text-left text-[12px]">
                      <thead className={`border-b text-[9px] uppercase tracking-widest font-semibold ${
                        darkMode ? 'border-gold/10 text-ivory/30 bg-[#1a0e0a]' : 'border-[#1a1a1a]/10 text-night/40 bg-[#f0ece8]'
                      }`}>
                        <tr>
                          <th className="px-4 py-3">Order ID</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Payment</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${
                        darkMode ? 'divide-gold/8' : 'divide-[#1a1a1a]/8'
                      }`}>
                        {filteredOrders.map((o) => (
                          <tr key={o.id} className={`transition-colors ${
                            darkMode ? 'hover:bg-gold/5' : 'hover:bg-gold/5'
                          }`}>
                            <td className="px-4 py-3 font-mono text-gold">{o.order_code}</td>
                            <td className={`px-4 py-3 ${
                              darkMode ? 'text-ivory' : 'text-night'
                            }`}>{o.customers?.name || 'Walk-in'}</td>
                            <td className={`px-4 py-3 ${
                              darkMode ? 'text-ivory/40' : 'text-night/40'
                            }`}>
                              {new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 font-nums font-semibold text-gold">{inr(o.total)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                o.paid || o.payment_status === 'paid'
                                  ? 'bg-green-900/30 text-green-400 border border-green-500/20'
                                  : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {o.paid ? 'Paid' : o.payment_status}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-[11px] capitalize ${
                              darkMode ? 'text-ivory/60' : 'text-night/60'
                            }`}>{o.order_status.replace('_', ' ')}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="text-[10px] text-gold uppercase tracking-widest hover:underline"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr><td colSpan={7} className={`px-4 py-8 text-center text-[12px] ${
                            darkMode ? 'text-ivory/30' : 'text-night/30'
                          }`}>No orders found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============ TAB 3: CATALOG ============ */}
              {tab === 'catalog' && (
                <div className="space-y-5">
                  {/* Offer Banner Control */}
                  <div className={`rounded-3xl border p-6 transition-all shadow-md ${
                    darkMode ? 'border-gold/20 bg-[#160b09]/90 text-white' : 'border-[#1F0505]/15 bg-white text-[#1F0505]'
                  }`}>
                    <p className="text-[10px] text-gold font-bold uppercase tracking-[0.2em] mb-1">
                      Sitewide Offer Banner
                    </p>
                    <h3 className="font-serif text-lg font-bold mb-4">Promotional Message Control</h3>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                      <div className={`rounded-2xl border focus-within:border-gold transition-colors ${
                        darkMode ? 'border-ivory/20 bg-black/40' : 'border-[#1F0505]/20 bg-[#FAFAFA]'
                      }`}>
                        <input
                          value={offer.headline}
                          onChange={(e) => {
                            setOffer((o) => ({ ...o, headline: e.target.value }));
                            setDirty(true);
                          }}
                          placeholder="Headline (e.g. FESTIVAL SPECIAL)"
                          className="w-full bg-transparent px-4 py-3 text-[12px] font-medium outline-none placeholder:text-gray-400"
                        />
                      </div>
                      <div className={`rounded-2xl border focus-within:border-gold transition-colors ${
                        darkMode ? 'border-ivory/20 bg-black/40' : 'border-[#1F0505]/20 bg-[#FAFAFA]'
                      }`}>
                        <input
                          value={offer.detail}
                          onChange={(e) => {
                            setOffer((o) => ({ ...o, detail: e.target.value }));
                            setDirty(true);
                          }}
                          placeholder="Details (e.g. 15% off on 20+ metres)"
                          className="w-full bg-transparent px-4 py-3 text-[12px] font-medium outline-none placeholder:text-gray-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOffer((o) => ({ ...o, active: !o.active }));
                          setDirty(true);
                        }}
                        className={`rounded-2xl text-[11px] uppercase tracking-[0.16em] font-bold border py-3 transition-all flex items-center justify-center gap-2 shadow-sm ${
                          offer.active
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500'
                            : (darkMode ? 'border-ivory/20 text-ivory/40 bg-black/30' : 'border-[#1F0505]/20 text-[#1F0505]/50 bg-gray-100')
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${offer.active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                        {offer.active ? 'Banner Active' : 'Banner Off'}
                      </button>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className={`rounded-full border focus-within:border-gold transition-colors w-72 flex items-center px-4 ${
                      darkMode ? 'border-ivory/20 bg-black/40' : 'border-[#1F0505]/20 bg-white shadow-sm'
                    }`}>
                      <Search className="h-4 w-4 text-gold shrink-0 mr-2" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search fabrics by name..."
                        className="w-full bg-transparent py-2.5 text-[12px] font-medium outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          exportCsv(
                            'idf-catalog.csv',
                            items.map((i) => ({
                              ID: i.id,
                              Name: i.name,
                              Category: i.category,
                              Composition: i.composition,
                              Width: i.width,
                              PricePerMetre: i.pricePerMetre,
                              MRP: i.mrp || '',
                              MinMetres: i.minMetres,
                              StockStatus: i.stock,
                              Tags: i.tags.join(', '),
                              Blurb: i.blurb,
                            }))
                          )
                        }
                        className={`border rounded-full text-[10px] font-bold px-4 py-2 flex items-center gap-1.5 uppercase tracking-[0.16em] transition-all ${
                          darkMode
                            ? 'border-gold/30 text-gold hover:bg-gold/10'
                            : 'border-[#1F0505]/20 text-[#1F0505] hover:bg-[#1F0505] hover:text-white bg-white shadow-sm'
                        }`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>CSV</span>
                      </button>

                      <button
                        onClick={() => setShowAddModal(true)}
                        className="rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[11px] px-4 py-2 flex items-center gap-1.5 uppercase tracking-[0.18em] shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Fabric</span>
                      </button>
                    </div>
                  </div>

                  {/* Fabrics Grid */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((item) => (
                      <div key={item.id} className={`p-5 rounded-3xl border transition-all duration-300 shadow-md space-y-4 ${
                        darkMode ? 'border-gold/20 bg-[#160b09]/80 hover:border-gold/50 shadow-black/40' : 'border-[#1a1a1a]/15 bg-white hover:border-gold/50 shadow-gray-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="" className="h-14 w-14 object-cover border border-gold/15" />
                          <div className="flex-1 min-w-0">
                            <input
                              value={item.name}
                              onChange={(e) => patchFabric(item.id, { name: e.target.value })}
                              className={`w-full bg-transparent font-serif text-sm font-semibold outline-none border-b border-transparent focus:border-gold transition-colors ${
                                darkMode ? 'text-ivory' : 'text-night'
                              }`}
                            />
                            <p className="text-[10px] text-gold uppercase tracking-wider mt-0.5">{item.category}</p>
                          </div>
                          <button
                            type="button"
                            title="Delete fabric"
                            onClick={() => {
                              if (confirm(`Delete "${item.name}"?`)) {
                                setItems((prev) => prev.filter((i) => i.id !== item.id));
                                setDirty(true);
                              }
                            }}
                            className={`p-1.5 transition-colors ${
                              darkMode ? 'text-ivory/20 hover:text-maroon' : 'text-night/20 hover:text-maroon'
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className={`grid grid-cols-2 gap-3 text-[11px] pt-2 border-t ${
                          darkMode ? 'border-gold/8' : 'border-[#1a1a1a]/8'
                        }`}>
                          <div>
                            <p className={`text-[9px] uppercase tracking-widest mb-1 font-bold ${
                              darkMode ? 'text-ivory/40' : 'text-night/40'
                            }`}>Price/m (₹)</p>
                            <input
                              type="number"
                              value={item.pricePerMetre}
                              onChange={(e) => patchFabric(item.id, { pricePerMetre: Number(e.target.value) })}
                              className={`w-full border rounded-xl bg-transparent px-2.5 py-1 text-[12px] font-bold outline-none focus:border-gold transition-colors ${
                                darkMode ? 'border-ivory/15 text-gold' : 'border-[#1a1a1a]/15 text-night'
                              }`}
                            />
                          </div>
                          <div>
                            <p className={`text-[9px] uppercase tracking-widest mb-1 font-bold ${
                              darkMode ? 'text-ivory/40' : 'text-night/40'
                            }`}>Stock</p>
                            <select
                              value={item.stock}
                              onChange={(e) => patchFabric(item.id, { stock: e.target.value as Stock })}
                              className={`w-full border rounded-xl bg-transparent px-2.5 py-1 text-[11px] outline-none focus:border-gold transition-colors ${
                                darkMode ? 'border-ivory/15 text-ivory' : 'border-[#1a1a1a]/15 text-night'
                              }`}
                            >
                              <option value="in">In Stock</option>
                              <option value="low">Low Stock</option>
                              <option value="out">Out of Stock</option>
                            </select>
                          </div>
                        </div>

                        {/* Live / Not Live Visibility Toggle */}
                        <div className="pt-2 flex items-center justify-between border-t border-gold/10">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            darkMode ? 'text-ivory/40' : 'text-night/40'
                          }`}>Website Visibility</span>
                          <button
                            type="button"
                            onClick={() => patchFabric(item.id, { hidden: !item.hidden })}
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                              !item.hidden
                                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 border border-rose-500/40 text-rose-600 hover:bg-rose-500/25'
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${!item.hidden ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {!item.hidden ? 'Live' : 'Not Live'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className={`col-span-3 py-12 text-center text-[12px] ${
                        darkMode ? 'text-ivory/30' : 'text-night/30'
                      }`}>No fabrics found.</div>
                    )}
                  </div>
                </div>
              )}

              {/* ============ TAB 4: REVIEWS ============ */}
              {tab === 'reviews' && (
                <div className="space-y-5">
                  <div className={`flex items-center justify-between border-b pb-4 ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <div>
                      <p className={`text-[9px] uppercase tracking-widest font-semibold mb-0.5 ${
                        darkMode ? 'text-ivory/30' : 'text-night/30'
                      }`}>Moderation Queue</p>
                      <h3 className={`font-serif text-base ${
                        darkMode ? 'text-ivory' : 'text-night'
                      }`}>Customer Reviews</h3>
                    </div>
                    <button
                      onClick={() =>
                        exportCsv(
                          'idf-reviews.csv',
                          liveReviews.map((r) => ({
                            ID: r.id,
                            Name: r.name,
                            City: r.city,
                            Rating: r.rating,
                            ReviewText: r.text,
                            Date: r.date,
                            Status: r.status,
                            UserEmail: r.userEmail,
                          }))
                        )
                      }
                      className={`border text-[10px] px-3 py-2 flex items-center gap-1.5 uppercase tracking-widest transition-colors ${
                        darkMode
                          ? 'border-ivory/15 text-ivory/50 hover:border-gold hover:text-gold'
                          : 'border-[#1a1a1a]/15 text-night/50 hover:border-gold hover:text-gold'
                      }`}
                    >
                      <Download className="h-3 w-3" />
                      <span>CSV</span>
                    </button>
                  </div>

                  <div className={`border divide-y ${
                    darkMode ? 'border-gold/10 divide-gold/8' : 'border-[#1a1a1a]/10 divide-[#1a1a1a]/8'
                  }`}>
                    {liveReviews.map((rev) => (
                      <div key={rev.id} className={`flex items-start justify-between p-4 transition-colors ${
                        darkMode ? 'hover:bg-gold/5' : 'hover:bg-gold/5'
                      }`}>
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[12px] font-semibold ${
                              darkMode ? 'text-ivory' : 'text-night'
                            }`}>{rev.name}</span>
                            <span className={`text-[10px] ${
                              darkMode ? 'text-ivory/30' : 'text-night/30'
                            }`}>{rev.city}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-semibold ${
                              rev.status === 'published'
                                ? 'bg-green-900/30 text-green-400'
                                : rev.status === 'pending'
                                  ? 'bg-yellow-900/30 text-yellow-400'
                                  : (darkMode ? 'bg-ivory/10 text-ivory/40' : 'bg-night/10 text-night/40')
                            }`}>{rev.status}</span>
                            <span className="text-gold flex gap-0.5">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="h-2.5 w-2.5 fill-current" />
                              ))}
                            </span>
                          </div>
                          <p className={`text-[12px] line-clamp-2 ${
                            darkMode ? 'text-ivory/60' : 'text-night/60'
                          }`}>{rev.text}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {rev.status !== 'published' && (
                            <button
                              onClick={() => handleToggleReview(rev.id, 'published')}
                              className="btn btn-gold text-[9px] px-3 py-1.5 uppercase tracking-widest"
                            >
                              Publish
                            </button>
                          )}
                          {rev.status !== 'private' && (
                            <button
                              onClick={() => handleToggleReview(rev.id, 'private')}
                              className={`border text-[9px] px-3 py-1.5 uppercase tracking-widest transition-colors ${
                                darkMode
                                  ? 'border-ivory/15 text-ivory/50 hover:border-gold hover:text-gold'
                                  : 'border-[#1a1a1a]/15 text-night/50 hover:border-gold hover:text-gold'
                              }`}
                            >
                              Private
                            </button>
                          )}
                          <button onClick={() => handleDeleteReviewRow(rev.id)} className="p-1.5 text-maroon/60 hover:text-maroon transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {liveReviews.length === 0 && (
                      <p className={`px-4 py-8 text-[12px] text-center ${
                        darkMode ? 'text-ivory/30' : 'text-night/30'
                      }`}>No reviews in queue.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ============ TAB 5: CUSTOMERS ============ */}
              {tab === 'customers' && (
                <div className="space-y-5">
                  <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <div>
                      <p className={`text-[9px] uppercase tracking-widest font-semibold mb-0.5 ${
                        darkMode ? 'text-ivory/30' : 'text-night/30'
                      }`}>Directory</p>
                      <h3 className={`font-serif text-base ${
                        darkMode ? 'text-ivory' : 'text-night'
                      }`}>Customer Registry</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddCustomerModal(true)}
                        className="btn btn-gold text-[10px] px-3 py-2 flex items-center gap-1.5 uppercase tracking-widest"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Customer</span>
                      </button>

                      <button
                        onClick={() =>
                          exportCsv(
                            'idf-customers.csv',
                            customerList.map((c) => ({
                              Name: c.name,
                              Phone: c.phone,
                              Email: c.email,
                              City: c.city,
                              Source: c.signup_method,
                            }))
                          )
                        }
                        className={`border text-[10px] px-3 py-2 flex items-center gap-1.5 uppercase tracking-widest transition-colors ${
                          darkMode
                            ? 'border-ivory/15 text-ivory/50 hover:border-gold hover:text-gold'
                            : 'border-[#1a1a1a]/15 text-night/50 hover:border-gold hover:text-gold'
                        }`}
                      >
                        <Download className="h-3 w-3" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className={`overflow-x-auto border ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <table className="w-full text-left text-[12px]">
                      <thead className={`border-b text-[9px] uppercase tracking-widest font-semibold ${
                        darkMode ? 'border-gold/10 text-ivory/30 bg-[#1a0e0a]' : 'border-[#1a1a1a]/10 text-night/40 bg-[#f0ece8]'
                      }`}>
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">City</th>
                          <th className="px-4 py-3">Source</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${
                        darkMode ? 'divide-gold/8' : 'divide-[#1a1a1a]/8'
                      }`}>
                        {customerList.map((c, idx) => (
                          <tr key={idx} className={`transition-colors ${
                            darkMode ? 'hover:bg-gold/5' : 'hover:bg-gold/5'
                          }`}>
                            <td className={`px-4 py-3 font-semibold ${
                              darkMode ? 'text-ivory' : 'text-night'
                            }`}>{c.name}</td>
                            <td className={`px-4 py-3 ${
                              darkMode ? 'text-ivory/70' : 'text-night/70'
                            }`}>{c.phone}</td>
                            <td className={`px-4 py-3 ${
                              darkMode ? 'text-ivory/40' : 'text-night/40'
                            }`}>{c.email}</td>
                            <td className={`px-4 py-3 capitalize ${
                              darkMode ? 'text-ivory/60' : 'text-night/60'
                            }`}>{c.city}</td>
                            <td className="px-4 py-3 text-[10px] text-gold uppercase tracking-wider">{c.signup_method}</td>
                          </tr>
                        ))}
                        {customerList.length === 0 && (
                          <tr>
                            <td colSpan={5} className={`px-4 py-8 text-center text-[12px] ${
                              darkMode ? 'text-ivory/30' : 'text-night/30'
                            }`}>
                              No customer profiles registered yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============ TAB 6: PAYMENTS ============ */}
              {tab === 'payments' && (
                <div className="space-y-5">
                  <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <div>
                      <p className={`text-[9px] uppercase tracking-widest font-semibold mb-0.5 ${
                        darkMode ? 'text-ivory/30' : 'text-night/30'
                      }`}>Ledger</p>
                      <h3 className={`font-serif text-base ${
                        darkMode ? 'text-ivory' : 'text-night'
                      }`}>Payment Log</h3>
                      <p className={`text-[11px] mt-0.5 ${
                        darkMode ? 'text-ivory/40' : 'text-night/40'
                      }`}>UPI · Cash · Showroom Card</p>
                    </div>
                    <button
                      onClick={() =>
                        exportCsv(
                          'idf-payments.csv',
                          orders.map((o) => ({
                            OrderID: o.order_code,
                            Customer: o.customers?.name || 'Walk-in',
                            Amount: o.total,
                            Method: o.payment_method,
                            Reference: o.payment_reference || 'N/A',
                            Status: o.payment_status,
                            Date: o.created_at,
                          }))
                        )
                      }
                      className={`border text-[10px] px-3 py-2 flex items-center gap-1.5 uppercase tracking-widest transition-colors ${
                        darkMode
                          ? 'border-ivory/15 text-ivory/50 hover:border-gold hover:text-gold'
                          : 'border-[#1a1a1a]/15 text-night/50 hover:border-gold hover:text-gold'
                      }`}
                    >
                      <Download className="h-3 w-3" />
                      <span>CSV</span>
                    </button>
                  </div>

                  <div className={`overflow-x-auto border ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <table className="w-full text-left text-[12px]">
                      <thead className={`border-b text-[9px] uppercase tracking-widest font-semibold ${
                        darkMode ? 'border-gold/10 text-ivory/30 bg-[#1a0e0a]' : 'border-[#1a1a1a]/10 text-night/40 bg-[#f0ece8]'
                      }`}>
                        <tr>
                          <th className="px-4 py-3">Order Code</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Method</th>
                          <th className="px-4 py-3">Ref ID</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${
                        darkMode ? 'divide-gold/8' : 'divide-[#1a1a1a]/8'
                      }`}>
                        {orders.map((o) => (
                          <tr key={o.id} className={`transition-colors ${
                            darkMode ? 'hover:bg-gold/5' : 'hover:bg-gold/5'
                          }`}>
                            <td className="px-4 py-3 font-mono text-gold">{o.order_code}</td>
                            <td className={`px-4 py-3 ${
                              darkMode ? 'text-ivory' : 'text-night'
                            }`}>{o.customers?.name || 'Walk-in'}</td>
                            <td className="px-4 py-3 font-nums font-semibold text-gold">{inr(o.total)}</td>
                            <td className={`px-4 py-3 uppercase text-[10px] tracking-wider ${
                              darkMode ? 'text-ivory/60' : 'text-night/60'
                            }`}>{o.payment_method}</td>
                            <td className={`px-4 py-3 font-mono text-[11px] ${
                              darkMode ? 'text-ivory/40' : 'text-night/40'
                            }`}>{o.payment_reference || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                o.paid || o.payment_status === 'paid'
                                  ? 'bg-green-900/30 text-green-400 border border-green-500/20'
                                  : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {o.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr><td colSpan={6} className={`px-4 py-8 text-center text-[12px] ${
                            darkMode ? 'text-ivory/30' : 'text-night/30'
                          }`}>No payment records yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============ TAB: CATEGORIES ============ */}
              {tab === 'categories' && (
                <div className="space-y-6">
                  <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <div>
                      <p className={`text-[9px] uppercase tracking-widest font-semibold mb-0.5 ${
                        darkMode ? 'text-ivory/30' : 'text-night/30'
                      }`}>Taxonomy</p>
                      <h3 className={`font-serif text-base ${
                        darkMode ? 'text-ivory' : 'text-night'
                      }`}>Product Categories</h3>
                      <p className={`text-[11px] mt-0.5 ${
                        darkMode ? 'text-ivory/40' : 'text-night/40'
                      }`}>Add, rename, or toggle active status of fabric categories.</p>
                    </div>
                    <button
                      onClick={() => {
                        const name = prompt('Enter new category name:');
                        if (!name) return;
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        if (categories.some(c => c.slug === slug)) return alert('Category already exists!');
                        setCategories(prev => [...prev, {
                          id: slug,
                          name,
                          slug,
                          description: `Premium ${name} luxury fabrics base.`,
                          active: true
                        }]);
                      }}
                      className="btn btn-gold text-[10px] px-3 py-2 flex items-center gap-1.5 uppercase tracking-widest"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Category</span>
                    </button>
                  </div>

                  <div className={`border divide-y ${
                    darkMode ? 'border-gold/10 divide-gold/8' : 'border-[#1a1a1a]/10 divide-[#1a1a1a]/8'
                  }`}>
                    {categories.map((c) => (
                      <div key={c.slug} className={`flex items-start justify-between p-4 transition-colors ${
                        darkMode ? 'hover:bg-gold/5' : 'hover:bg-gold/5'
                      }`}>
                        <div className="flex-1 min-w-0 mr-4">
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setCategories(prev => prev.map(item => item.slug === c.slug ? { ...item, name: newName } : item));
                            }}
                            className={`bg-transparent font-serif text-sm font-semibold outline-none border-b border-transparent focus:border-gold transition-colors ${
                              darkMode ? 'text-ivory' : 'text-night'
                            }`}
                          />
                          <p className={`text-[11px] mt-1 ${
                            darkMode ? 'text-ivory/40' : 'text-night/40'
                          }`}>Slug: {c.slug} | Status: <span className={c.active ? 'text-green-400' : 'text-maroon'}>{c.active ? 'Active' : 'Inactive'}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setCategories(prev => prev.map(item => item.slug === c.slug ? { ...item, active: !item.active } : item));
                            }}
                            className={`border text-[9px] px-3 py-1.5 uppercase tracking-widest transition-colors ${
                              c.active
                                ? 'border-gold bg-gold/10 text-gold hover:bg-gold/20'
                                : (darkMode ? 'border-ivory/15 text-ivory/40' : 'border-[#1a1a1a]/15 text-night/40')
                            }`}
                          >
                            {c.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              // Confirm delete + warn of items attached
                              const attached = items.filter(item => item.categoryId === c.slug || item.category === c.name);
                              if (attached.length > 0) {
                                alert(`Cannot delete category "${c.name}" because it is currently assigned to ${attached.length} product(s) (${attached.map(i => i.name).join(', ')}). Please reassign them first.`);
                                return;
                              }
                              if (confirm(`Are you sure you want to delete category "${c.name}"?`)) {
                                setCategories(prev => prev.filter(item => item.slug !== c.slug));
                              }
                            }}
                            className="p-1.5 text-maroon/60 hover:text-maroon transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============ TAB: COMBOS ============ */}
              {tab === 'combos' && (
                <div className="space-y-6">
                  <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <div>
                      <p className={`text-[9px] uppercase tracking-widest font-semibold mb-0.5 ${
                        darkMode ? 'text-ivory/30' : 'text-night/30'
                      }`}>Offers</p>
                      <h3 className={`font-serif text-base ${
                        darkMode ? 'text-ivory' : 'text-night'
                      }`}>Combo Offers</h3>
                      <p className={`text-[11px] mt-0.5 ${
                        darkMode ? 'text-ivory/40' : 'text-night/40'
                      }`}>Configure special fabric bundle/set combination discounts.</p>
                    </div>
                  </div>
                  <div className={`p-4 border border-dashed rounded ${
                    darkMode ? 'border-gold/20 text-ivory/50 bg-[#150a0a]' : 'border-[#1a1a1a]/20 text-night/50 bg-[#fbf9f6]'
                  } text-center text-[12px]`}>
                    ⚠️ Combo discounts are automatically active and evaluated at checkout. Review current items below.
                  </div>
                  <div className={`border p-4 ${
                    darkMode ? 'border-gold/10 bg-[#150a0a]' : 'border-[#1a1a1a]/10 bg-white'
                  }`}>
                    <h4 className="font-serif text-sm text-gold mb-2">Seeded Combo: Royal Wedding Duo</h4>
                    <p className={`text-[12px] ${
                      darkMode ? 'text-ivory/70' : 'text-night/70'
                    }`}>Buy Aurelia Hand-Embroidered Tulle + Noor Pearl Organza together, get a flat 10% combo discount on both.</p>
                  </div>
                </div>
              )}

              {/* ============ TAB 7: SETTINGS ============ */}
              {tab === 'settings' && (
                <div className="space-y-5">
                  {/* Shipping Rules */}
                  <div className={`border p-5 ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <p className={`text-[9px] uppercase tracking-widest font-semibold mb-1 ${
                      darkMode ? 'text-ivory/30' : 'text-night/30'
                    }`}>Configuration</p>
                    <h3 className={`font-serif text-base mb-4 ${
                      darkMode ? 'text-ivory' : 'text-night'
                    }`}>Shipping & Wholesale Rules</h3>
                    <div className={`grid grid-cols-2 gap-0 border ${
                      darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                    }`}>
                      {[
                        { label: 'Free Shipping Above', value: inr(ORDER.freeShippingAbove), accent: 'text-gold' },
                        { label: 'Flat Shipping Fee', value: inr(ORDER.shippingFlat), accent: darkMode ? 'text-ivory' : 'text-night' },
                        { label: 'Wholesale Min Qty', value: `${ORDER.wholesaleMinMetres} metres`, accent: 'text-gold' },
                        { label: 'Wholesale Discount', value: `${ORDER.wholesaleDiscount * 100}% off`, accent: 'text-gold' },
                      ].map((row) => (
                        <div key={row.label} className={`p-4 border-b border-r last:border-r-0 ${
                          darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                        }`}>
                          <p className={`text-[9px] uppercase tracking-widest font-semibold mb-1.5 ${
                            darkMode ? 'text-ivory/30' : 'text-night/30'
                          }`}>{row.label}</p>
                          <p className={`font-nums text-lg font-bold ${row.accent}`}>{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Theme Switcher */}
                  <div className={`border p-5 ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <p className={`text-[9px] uppercase tracking-widest font-semibold mb-1 ${
                      darkMode ? 'text-ivory/30' : 'text-night/30'
                    }`}>Appearance</p>
                    <h3 className={`font-serif text-base mb-1 ${
                      darkMode ? 'text-ivory' : 'text-night'
                    }`}>Portal Theme</h3>
                    <p className={`text-[11px] mb-4 ${
                      darkMode ? 'text-ivory/40' : 'text-night/40'
                    }`}>Select the visual theme for this admin dashboard.</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleThemeToggle(false)}
                        className={`text-[10px] uppercase tracking-widest font-semibold px-5 py-2.5 border transition-colors ${
                          !darkMode ? 'border-gold bg-gold/12 text-gold' : (darkMode ? 'border-ivory/10 text-ivory/30 hover:border-ivory/30 hover:text-ivory/60' : 'border-[#1a1a1a]/15 text-night/30')
                        }`}
                      >
                        ○ Light Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => handleThemeToggle(true)}
                        className={`text-[10px] uppercase tracking-widest font-semibold px-5 py-2.5 border transition-colors ${
                          darkMode ? 'border-gold bg-gold/12 text-gold' : 'border-[#1a1a1a]/15 text-night/30 hover:border-[#1a1a1a]/40 hover:text-night/60'
                        }`}
                      >
                        ● Dark Mode
                      </button>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className={`border p-5 ${
                    darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
                  }`}>
                    <p className={`text-[9px] uppercase tracking-widest font-semibold mb-1 ${
                      darkMode ? 'text-ivory/30' : 'text-night/30'
                    }`}>Identity</p>
                    <h3 className={`font-serif text-base mb-3 ${
                      darkMode ? 'text-ivory' : 'text-night'
                    }`}>Showroom Business Details</h3>
                    <p className={`text-[13px] font-semibold ${
                      darkMode ? 'text-ivory' : 'text-night'
                    }`}>{BUSINESS.name}</p>
                    <p className={`text-[12px] mt-0.5 ${
                      darkMode ? 'text-ivory/50' : 'text-night/50'
                    }`}>{BUSINESS.city}</p>
                    <p className={`text-[11px] mt-1 ${
                      darkMode ? 'text-ivory/30' : 'text-night/30'
                    }`}>{BUSINESS.addressLine1}, {BUSINESS.addressLine2}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0806]/85 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg border p-0 ${
            darkMode ? 'border-gold/15 bg-[#150a0a]' : 'border-[#1a1a1a]/15 bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
            }`}>
              <div>
                <p className={`text-[9px] uppercase tracking-widest font-semibold mb-0.5 ${
                  darkMode ? 'text-ivory/30' : 'text-night/30'
                }`}>Order Detail</p>
                <h3 className={`font-serif text-lg ${
                  darkMode ? 'text-ivory' : 'text-night'
                }`}>{selectedOrder.order_code}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className={`text-[18px] leading-none transition-colors ${
                darkMode ? 'text-ivory/30 hover:text-ivory' : 'text-night/30 hover:text-night'
              }}`}>
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className={`grid grid-cols-2 gap-0 border-b ${
              darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
            }`}>
              {[
                { label: 'Customer', value: selectedOrder.customers?.name || 'Walk-in' },
                { label: 'Phone', value: selectedOrder.customers?.phone || '—' },
                { label: 'City', value: selectedOrder.city },
                { label: 'Pincode', value: selectedOrder.pincode },
                { label: 'Total', value: inr(selectedOrder.total), accent: 'text-gold font-semibold' },
                { label: 'Status', value: selectedOrder.order_status.replace('_', ' '), className: 'capitalize' },
              ].map((row) => (
                <div key={row.label} className={`px-5 py-3.5 border-b border-r ${
                  darkMode ? 'border-gold/8' : 'border-[#1a1a1a]/8'
                }`}>
                  <p className={`text-[9px] uppercase tracking-widest font-semibold mb-1 ${
                    darkMode ? 'text-ivory/30' : 'text-night/30'
                  }`}>{row.label}</p>
                  <p className={`text-[13px] ${row.accent || ''} ${row.className || ''} ${
                    !row.accent ? (darkMode ? 'text-ivory' : 'text-night') : ''
                  }`}>{row.value}</p>
                </div>
              ))}
            </div>

            {selectedOrder.address && (
              <div className={`px-5 py-3.5 border-b ${
                darkMode ? 'border-gold/10' : 'border-[#1a1a1a]/10'
              }`}>
                <p className={`text-[9px] uppercase tracking-widest font-semibold mb-1 ${
                  darkMode ? 'text-ivory/30' : 'text-night/30'
                }`}>Address</p>
                <p className={`text-[12px] ${
                  darkMode ? 'text-ivory/70' : 'text-night/70'
                }`}>{selectedOrder.address}</p>
              </div>
            )}

            <div className="flex gap-0 p-4">
              {selectedOrder.order_status !== 'confirmed' && (
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'confirmed')}
                  className="btn btn-gold text-[10px] flex-1 py-2.5 uppercase tracking-widest mr-2"
                >
                  Mark Confirmed
                </button>
              )}
              {selectedOrder.order_status !== 'fulfilled' && (
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'fulfilled')}
                  className="btn btn-gold text-[10px] flex-1 py-2.5 uppercase tracking-widest"
                >
                  Mark Fulfilled
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSave={async (newItem) => {
            const updated = [newItem, ...items];
            setItems(updated);
            setDirty(false);
            setShowAddModal(false);
            setPublishState('publishing');
            try {
              await publishProducts(updated, offer);
              setPublishState('done');
              setTimeout(() => setPublishState('idle'), 2500);
            } catch (e) {
              setPublishState('error');
            }
          }}
        />
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <AddCustomerModal
          onClose={() => setShowAddCustomerModal(false)}
          onSave={async (newCust) => {
            try {
              if (isAdminConfigured) {
                await addManualCustomer(newCust);
              }
              // Force local UI refresh
              loadAllData();
              setShowAddCustomerModal(false);
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Failed to register customer');
            }
          }}
        />
      )}

      {/* Add Order Modal */}
      {showAddOrderModal && (
        <AddOrderModal
          catalog={items}
          onClose={() => setShowAddOrderModal(false)}
          onSave={async (newOrder) => {
            try {
              if (isAdminConfigured) {
                await addManualOrder(newOrder);
              } else {
                setOrders((prev) => [newOrder, ...prev]);
              }
              // Refresh details
              loadAllData();
              setShowAddOrderModal(false);
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Failed to save manual order');
            }
          }}
        />
      )}
    </div>
  );
}
