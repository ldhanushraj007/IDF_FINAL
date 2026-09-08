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
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Layers,
  Send,
  Pencil,
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
  adminDirectLogin,
  checkIsAdmin,
  adminSignOut,
  fetchProducts,
  fetchProductById,
  saveProduct,
  fetchOffer,
  publishProducts,
  fetchAllReviews,
  setReviewStatus,
  deleteReview,
  addManualReview,
  fetchOrders,
  setOrderStatus,
  fetchCustomers,
  addManualCustomer,
  addManualOrder,
  fetchCategories,
  saveCategories,
  fetchSettings,
  saveSettings,
  reconcileDatabaseConflicts,
  auditDatabase,
  type AdminReviewRow,
  type AdminOrderRow,
  type CustomerRow,
} from '../lib/adminApi';
import { ADMIN_STATIC_PIN, BUSINESS, ORDER, UPI, inr } from '../lib/constants';
import { DEFAULT_CATEGORIES, type CategoryConfig } from '../lib/categories';

type TabId = 'dashboard' | 'orders' | 'catalog' | 'reviews' | 'customers' | 'categories' | 'combos' | 'payments' | 'settings';

function formatSafeDate(d?: string): string {
  if (!d) return '—';
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? String(d) : parsed.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

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
 * Direct Admin Login (using Email + Admin Password).
 */
function SupabaseLogin({ onUnlocked }: { onUnlocked: () => void }) {
  const [email, setEmail]         = useState('indesignluxuryfabrics@gmail.com');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email) return setError('Enter admin email.');
    if (!password) return setError('Enter admin password.');
    setBusy(true);
    try {
      await adminDirectLogin(password, email);
      if (!checkIsAdmin()) throw new Error('Session not created.');
      onUnlocked();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed.');
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

  return (
    <div className="w-full max-w-md bg-[#180e0c]/90 border border-[#d4af37]/30 rounded-3xl p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
      <Header />
      <p className="mb-4 text-[11px] text-white/50 tracking-[0.2em] uppercase font-bold text-center">
        Admin Portal Login
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold tracking-[0.14em] text-[#d4af37]/80 uppercase mb-1.5">
            Admin Email
          </label>
          <div className="rounded-2xl border border-[#d4af37]/30 bg-black/40 focus-within:border-[#d4af37] focus-within:ring-2 focus-within:ring-[#d4af37]/20 transition-all flex items-center overflow-hidden">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="indesignluxuryfabrics@gmail.com"
              className="flex-1 bg-transparent px-4 py-3 text-[13px] text-white placeholder-white/30 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold tracking-[0.14em] text-[#d4af37]/80 uppercase mb-1.5">
            Admin Password
          </label>
          <div className="rounded-2xl border border-[#d4af37]/30 bg-black/40 focus-within:border-[#d4af37] focus-within:ring-2 focus-within:ring-[#d4af37]/20 transition-all flex items-center overflow-hidden">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter password"
              className="flex-1 bg-transparent px-4 py-3 text-[13px] text-white placeholder-white/30 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide' : 'Show'}
              className="px-4 text-white/40 hover:text-white transition-colors"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogin}
        disabled={busy}
        className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[11px] tracking-[0.22em] uppercase shadow-lg hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In to Admin Portal →'}
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
    if (pin === ADMIN_STATIC_PIN) {
      sessionStorage.setItem('idf_admin_jwt', 'admin_static_pin_session');
      onUnlocked();
    } else {
      setWrong(true);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#180e0c]/90 border border-[#d4af37]/30 rounded-3xl p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
      <div className="text-center pb-6 mb-6 border-b border-[#d4af37]/20 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mb-3 shadow-md">
          <img src="/images/logo/logo-mark.png" alt="" aria-hidden="true" className="h-10 w-auto object-contain" />
        </div>
        <span className="text-[9px] tracking-[0.3em] text-[#d4af37] uppercase font-bold px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 mb-2">
          Admin Portal · Connected
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
  const [backendCustomers, setBackendCustomers] = useState<CustomerRow[]>([]);
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
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [savingCardId, setSavingCardId] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string>('');
  const [reconcilingConflicts, setReconcilingConflicts] = useState(false);
  const [dbAudit, setDbAudit] = useState<{
    ordersRawCount?: number;
    catalogRawCount?: number;
    conflictTabs?: any[];
  } | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('idf_admin_theme') === 'dark';
  });

  const handleReconcileConflicts = async () => {
    setReconcilingConflicts(true);
    try {
      const res = await reconcileDatabaseConflicts();
      const count = res.report ? res.report.length : 0;
      alert(`Database Health Check & Reconciliation Complete:\n${count} conflict tab(s) detected, missing items merged into canonical sheet, and redundant tabs permanently deleted.`);
      loadAllData();
    } catch (err) {
      alert('Failed to reconcile conflicts: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setReconcilingConflicts(false);
    }
  };

  const loadAllData = () => {
    if (!unlocked) return;
    setDataLoading(true);

    if (isAdminConfigured) {
      const prodsPromise = fetchProducts().catch((err) => {
        console.warn('fetchProducts error:', err);
        return [] as Item[];
      });
      const offerPromise = fetchOffer().catch((err) => {
        console.warn('fetchOffer error:', err);
        return EMPTY_OFFER;
      });
      const reviewsPromise = fetchAllReviews().catch((err) => {
        console.warn('fetchAllReviews error:', err);
        return [] as AdminReviewRow[];
      });
      const ordersPromise = fetchOrders()
        .then((ords) => {
          setOrdersError('');
          return ords;
        })
        .catch((err) => {
          console.error('fetchOrders loud failure:', err);
          setOrdersError(err instanceof Error ? err.message : String(err));
          return [] as AdminOrderRow[];
        });
      const custsPromise = fetchCustomers().catch((err) => {
        console.warn('fetchCustomers error:', err);
        return [] as CustomerRow[];
      });
      const catsPromise = fetchCategories().catch((err) => {
        console.warn('fetchCategories error:', err);
        return DEFAULT_CATEGORIES;
      });
      const auditPromise = auditDatabase()
        .then((res) => {
          setDbAudit({
            ordersRawCount: res.ordersRawCount,
            catalogRawCount: res.catalogRawCount,
            conflictTabs: res.conflictTabs,
          });
          return res;
        })
        .catch(() => null);

      Promise.all([prodsPromise, offerPromise, reviewsPromise, ordersPromise, custsPromise, catsPromise, auditPromise])
        .then(([prods, off, revs, ords, custs, cats]) => {
          // If the sheet has canonical products, set them
          const activeProds = prods && prods.length > 0 ? prods : CATALOG;
          setItems(activeProds);
          setOriginalIds(activeProds.map((p) => p.id));
          setOffer(off || EMPTY_OFFER);
          setLiveReviews(revs || []);
          setOrders(ords || []);
          setBackendCustomers(custs || []);
          if (cats && cats.length > 0) setCategories(cats);
          if (prods.length === 0) {
            setDirty(true);
          }
        })
        .catch((err) => console.error('loadAllData error:', err))
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

  // Guard against closing or reloading tab with unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

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

  // Single write-then-verify path for quick-edits and full modal saves
  const handleQuickSaveProduct = async (itemId: string, changes: Partial<Item>) => {
    const current = items.find((i) => i.id === itemId);
    if (!current) return;
    const updatedItem = { ...current, ...changes };

    // Optimistically update card in UI
    setItems((prev) => prev.map((i) => (i.id === itemId ? updatedItem : i)));
    setSavingCardId(itemId);

    try {
      const verified = await saveProduct(updatedItem, offer);
      setItems((prev) => prev.map((i) => (i.id === itemId ? verified : i)));
      setOriginalIds((prev) => (prev.includes(verified.id) ? prev : [...prev, verified.id]));
    } catch (err) {
      console.error('Quick-save to Sheets failed:', err);
      alert('Failed to sync to Google Sheets database: ' + (err instanceof Error ? err.message : String(err)));
      // Revert to original on error
      setItems((prev) => prev.map((i) => (i.id === itemId ? current : i)));
    } finally {
      setSavingCardId(null);
    }
  };

  const handleDeleteFabric = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to permanently remove "${itemName}" from the catalog?`)) return;
    const updated = items.filter((i) => i.id !== itemId);
    setItems(updated);
    setDirty(true);
    try {
      const fresh = await publishProducts(updated, offer);
      if (fresh && fresh.length > 0) {
        setItems(fresh);
        setOriginalIds(fresh.map((i) => i.id));
      }
      setDirty(false);
    } catch (e) {
      alert('Failed to remove from Google Sheets: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handlePublish = async () => {
    setPublishState('publishing');
    setPublishError('');
    try {
      const fresh = await publishProducts(items, offer);
      if (fresh && fresh.length > 0) {
        setItems(fresh);
        setOriginalIds(fresh.map((i) => i.id));
      }
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

  // Comprehensive merged customer list from direct database records + order history
  const customerList = useMemo(() => {
    const registry: Record<string, { name: string; phone: string; email: string; city: string; signup_method: string }> = {};

    const normalizeKey = (phone?: string, email?: string, name?: string) => {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (cleanEmail && !cleanEmail.includes('idf-customer.com') && !cleanEmail.includes('walkin@idf.com') && cleanEmail !== '—') {
        return cleanEmail;
      }
      const digits = (phone || '').replace(/[^0-9]/g, '');
      if (digits.length >= 10) return digits.slice(-10);
      return (name || '').trim().toLowerCase() || 'unknown';
    };

    // 1. First populate backend customers (Online Accounts & Manual Registry)
    backendCustomers.forEach((c) => {
      const key = normalizeKey(c.phone, c.email, c.name);
      if (key && key !== 'unknown') {
        registry[key] = {
          name: c.name || 'Customer',
          phone: c.phone || '—',
          email: c.email || '—',
          city: c.city || 'Bengaluru',
          signup_method: c.signup_method || 'Online Account',
        };
      }
    });

    // 2. Merge customer details from orders (Online Checkout & Walk-ins)
    orders.forEach((o) => {
      const cust = o.customers;
      const key = normalizeKey(cust?.phone, cust?.email, cust?.name);
      if (key && key !== 'unknown') {
        if (!registry[key] || registry[key].name === 'Walk-in' || registry[key].name === 'Customer') {
          registry[key] = {
            name: cust?.name || registry[key]?.name || 'Walk-in',
            phone: cust?.phone || registry[key]?.phone || '—',
            email: (cust?.email && !cust.email.includes('idf-customer.com')) ? cust.email : (registry[key]?.email || '—'),
            city: o.city || registry[key]?.city || 'Bengaluru',
            signup_method: o.payment_method === 'Cash' ? 'Manual Registry' : 'Online Checkout',
          };
        }
      }
    });

    return Object.values(registry);
  }, [backendCustomers, orders]);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 font-sans ${darkMode ? 'bg-[#0a0504] text-ivory' : 'bg-[#faf7f2] text-night'}`}>
      {/* ================= SIDEBAR (LUXURY ATELIER DOCK) ================= */}
      <aside className={`w-64 shrink-0 border-r flex flex-col justify-between hidden md:flex sticky top-0 h-screen overflow-y-auto z-30 transition-all ${
        darkMode ? 'border-[#d4af37]/15 bg-[#120706]' : 'border-[#1a1a1a]/10 bg-white'
      }`}>
        <div>
          {/* Atelier Brand Header */}
          <div className={`px-6 py-6 border-b flex items-center gap-3.5 ${
            darkMode ? 'border-[#d4af37]/15 bg-black/20' : 'border-[#1a1a1a]/10 bg-[#faf7f2]/50'
          }`}>
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 border border-[#d4af37]/40 flex items-center justify-center shadow-lg shadow-black/40">
                <img src="/images/logo/logo-mark.png" alt="" className="h-6 w-6 object-contain" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#120706]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8.5px] tracking-[0.25em] text-[#d4af37] uppercase font-bold">Atelier Portal</p>
              <h2 className="font-serif text-[17px] font-bold text-white leading-tight tracking-wide truncate">In Design</h2>
              <p className="text-[9px] text-white/40 tracking-wider uppercase font-medium">Boutique &amp; ERP</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="mt-5 px-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, idx: '01' },
              { id: 'orders', label: 'Orders', icon: ShoppingBag, idx: '02', badge: metrics.confirmedOrders },
              { id: 'catalog', label: 'Fabrics Catalog', icon: Package, idx: '03' },
              { id: 'categories', label: 'Taxonomy', icon: FolderOpen, idx: '04' },
              { id: 'combos', label: 'Combo Deals', icon: Percent, idx: '05' },
              { id: 'reviews', label: 'Review Queue', icon: Star, idx: '06', badge: metrics.pendingReviewsCount },
              { id: 'customers', label: 'Client CRM', icon: Users, idx: '07' },
              { id: 'payments', label: 'Ledger', icon: CreditCard, idx: '08' },
              { id: 'settings', label: 'Store Rules', icon: SettingsIcon, idx: '09' },
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
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[12px] font-semibold transition-all duration-200 group ${
                    active
                      ? 'bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold shadow-md shadow-[#d4af37]/20 scale-[1.01]'
                      : (darkMode
                          ? 'text-white/60 hover:text-white hover:bg-white/5'
                          : 'text-night/70 hover:text-night hover:bg-[#d4af37]/10')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-mono tabular-nums transition-colors ${
                      active ? 'text-[#1F0505] font-bold' : (darkMode ? 'text-white/20 group-hover:text-[#d4af37]' : 'text-night/30 group-hover:text-night')
                    }`}>{item.idx}</span>
                    <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      active ? 'text-[#1F0505]' : (darkMode ? 'text-[#d4af37]/70 group-hover:text-[#d4af37]' : 'text-[#d4af37]')
                    }`} />
                    <span className="tracking-wide font-medium">{item.label}</span>
                  </div>
                  {Boolean((item as any).badge) && (
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold tabular-nums shadow-sm ${
                      active ? 'bg-black text-[#d4af37]' : 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30'
                    }`}>
                      {(item as any).badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${
          darkMode ? 'border-[#d4af37]/15 bg-black/20' : 'border-[#1a1a1a]/10 bg-[#faf7f2]/50'
        }`}>
          <div className="rounded-2xl border border-[#d4af37]/20 bg-black/30 p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-white/80 font-semibold tracking-wider uppercase">Live Backend</span>
              </div>
              <span className="text-[9px] text-[#d4af37] font-mono font-bold">Google Sheets</span>
            </div>
            <p className="text-[9.5px] text-white/40 mt-1 truncate">Single Source of Truth Active</p>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 flex items-center justify-center text-[10px] text-[#d4af37] font-bold">
                A
              </div>
              <span className="text-[11px] font-medium text-white/70">Admin HQ</span>
            </div>
            <button
              onClick={() => {
                adminSignOut();
                setUnlocked(false);
              }}
              className="text-[10px] tracking-wider uppercase text-white/40 hover:text-rose-400 font-bold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className={`border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl ${
          darkMode ? 'border-[#d4af37]/15 bg-[#120706]/90' : 'border-[#1a1a1a]/10 bg-white/90'
        }`}>
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] tracking-[0.25em] uppercase font-bold text-[#d4af37]">Atelier Operations</span>
                <span className="text-white/20">/</span>
                <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-white/50">{tab}</span>
              </div>
              <h1 className={`font-serif text-2xl font-bold capitalize mt-0.5 tracking-wide ${
                darkMode ? 'text-white' : 'text-night'
              }`}>{tab === 'dashboard' ? 'Executive Overview' : tab}</h1>
            </div>

            {dirty && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-300 uppercase tracking-widest animate-pulse shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Unsaved Edits
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <button
              type="button"
              onClick={() => handleThemeToggle(!darkMode)}
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
              className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition-all ${
                darkMode
                  ? 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20 shadow-md'
                  : 'border-[#1F0505]/15 bg-white text-[#1F0505] hover:bg-[#FFE6E9]/40 shadow-sm'
              }`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Publish Live Button */}
            <button
              onClick={handlePublish}
              disabled={publishState === 'publishing'}
              className="rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[11px] tracking-[0.2em] uppercase px-6 py-2.5 shadow-lg shadow-[#d4af37]/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              {publishState === 'publishing' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1F0505]" />
                  <span>Syncing Live…</span>
                </>
              ) : publishState === 'done' ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-800" />
                  <span>Published Live ✓</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-[#1F0505]" />
                  <span>Publish Live</span>
                </>
              )}
            </button>

            {/* View Live Store */}
            <a
              href="/"
              target="_blank"
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] border px-4 py-2.5 rounded-2xl transition-all shadow-sm ${
                darkMode
                  ? 'border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 bg-black/30'
                  : 'border-[#1F0505]/20 text-[#1F0505] hover:bg-[#1F0505] hover:text-white bg-white'
              }`}
            >
              <span>View Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {dataLoading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-gold" />
            </div>
          ) : (
            <>
              {/* ============ TAB 1: DASHBOARD ============ */}
              {tab === 'dashboard' && (
                <div className="space-y-7">
                  {/* Atelier Live Telemetry Bar */}
                  <div className={`rounded-3xl border p-5 transition-all shadow-lg backdrop-blur-md relative overflow-hidden ${
                    darkMode
                      ? 'border-[#d4af37]/25 bg-gradient-to-r from-[#180d0b] via-[#120706] to-[#180d0b] text-white'
                      : 'border-[#1a1a1a]/15 bg-gradient-to-r from-white via-[#faf7f2] to-white text-night'
                  }`}>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#d4af37]/10 to-transparent pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-inner">
                          <Sparkles className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#d4af37]">Atelier Telemetry</span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                              Canonical Sync Active
                            </span>
                          </div>
                          <p className={`text-[12px] font-serif tracking-wide mt-0.5 ${darkMode ? 'text-white/80' : 'text-night/80'}`}>
                            Google Sheets Database Connected &bull; Apps Script Engine Online
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`px-4 py-2 rounded-2xl border text-center ${
                          darkMode ? 'border-white/10 bg-black/30' : 'border-black/10 bg-white shadow-sm'
                        }`}>
                          <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Catalog Base</p>
                          <p className="text-[13px] font-bold text-[#d4af37] font-mono">{items.length} Fabrics</p>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl border text-center ${
                          darkMode ? 'border-white/10 bg-black/30' : 'border-black/10 bg-white shadow-sm'
                        }`}>
                          <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Offer Banner</p>
                          <p className={`text-[13px] font-bold ${offer.active ? 'text-emerald-400' : 'text-white/40'}`}>
                            {offer.active ? 'Active' : 'Muted'}
                          </p>
                        </div>
                        <button
                          onClick={() => setTab('catalog')}
                          className="px-4 py-2.5 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37] text-[11px] font-bold uppercase tracking-[0.16em] hover:bg-[#d4af37] hover:text-[#1F0505] transition-all active:scale-[0.98]"
                        >
                          Manage Fabrics →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: 'Orders Needing Action',
                        value: metrics.confirmedOrders,
                        sub: `${metrics.pendingOrders} pending WhatsApp dispatch`,
                        icon: ShoppingBag,
                        accent: 'text-amber-400',
                        bgIcon: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
                        onClick: () => setTab('orders'),
                        idx: '01'
                      },
                      {
                        label: 'Total Revenue',
                        value: inr(metrics.totalRevenue),
                        sub: 'Confirmed customer transactions',
                        icon: TrendingUp,
                        accent: 'text-emerald-400',
                        bgIcon: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
                        onClick: () => setTab('payments'),
                        idx: '02'
                      },
                      {
                        label: 'Stock Alerts',
                        value: metrics.lowStockCount + metrics.outStockCount,
                        sub: `${metrics.outStockCount} out of stock · ${metrics.lowStockCount} low`,
                        icon: AlertTriangle,
                        accent: 'text-rose-400',
                        bgIcon: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
                        onClick: () => setTab('catalog'),
                        idx: '03'
                      },
                      {
                        label: 'Review Queue',
                        value: metrics.pendingReviewsCount,
                        sub: 'Customer testimonials pending review',
                        icon: Star,
                        accent: 'text-[#d4af37]',
                        bgIcon: 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20',
                        onClick: () => setTab('reviews'),
                        idx: '04'
                      },
                    ].map((card) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.idx}
                          onClick={card.onClick}
                          className={`relative p-6 rounded-3xl border transition-all duration-300 shadow-md group ${
                            card.onClick ? 'cursor-pointer hover:-translate-y-1' : ''
                          } ${
                            darkMode
                              ? 'border-[#d4af37]/20 bg-gradient-to-b from-[#180e0c]/90 to-[#100605] hover:border-[#d4af37]/50 shadow-black/50'
                              : 'border-[#1a1a1a]/15 bg-white hover:border-[#d4af37]/50 shadow-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110 ${card.bgIcon}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              darkMode ? 'text-[#d4af37]/60 border-[#d4af37]/20 bg-black/40' : 'text-[#d4af37] border-[#d4af37]/30 bg-[#faf7f2]'
                            }`}>
                              {card.idx}
                            </span>
                          </div>
                          <p className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5 ${
                            darkMode ? 'text-white/50' : 'text-night/60'
                          }`}>{card.label}</p>
                          <h3 className={`font-serif text-3xl font-bold tracking-tight ${card.accent}`}>{card.value}</h3>
                          <p className={`mt-2 text-[11px] font-medium leading-tight ${
                            darkMode ? 'text-white/40' : 'text-night/50'
                          }`}>{card.sub}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent Orders */}
                    <div className={`rounded-3xl border overflow-hidden transition-all shadow-xl ${
                      darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-lg'
                    }`}>
                      <div className={`flex items-center justify-between px-6 py-4 border-b ${
                        darkMode ? 'border-[#d4af37]/15 bg-white/5' : 'border-[#1a1a1a]/10 bg-[#faf7f2]'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                            <ShoppingBag className="h-3.5 w-3.5" />
                          </div>
                          <h3 className={`font-serif text-lg font-bold tracking-wide ${
                            darkMode ? 'text-white' : 'text-night'
                          }`}>Recent Orders</h3>
                        </div>
                        <button onClick={() => setTab('orders')} className="text-[10px] text-[#d4af37] font-bold uppercase tracking-[0.2em] hover:underline flex items-center gap-1">
                          <span>View All</span>
                          <span>→</span>
                        </button>
                      </div>
                      <div className="divide-y divide-white/5">
                        {orders.slice(0, 5).map((o) => {
                          const initials = (o.customers?.name || 'Customer')
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();
                          return (
                            <div
                              key={o.id}
                              onClick={() => setSelectedOrder(o)}
                              className={`flex cursor-pointer items-center justify-between px-6 py-4 transition-all duration-200 group ${
                                darkMode ? 'hover:bg-white/5' : 'hover:bg-[#faf7f2]'
                              }`}
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] font-bold text-[11px] shadow-sm group-hover:border-[#d4af37]">
                                  {initials}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[12px] font-bold text-[#d4af37]">{o.order_code}</span>
                                    <span className={`text-[10px] ${darkMode ? 'text-white/30' : 'text-night/40'}`}>
                                      &bull; {new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className={`text-[12px] font-semibold mt-0.5 ${
                                    darkMode ? 'text-white/90' : 'text-night/90'
                                  }`}>{o.customers?.name || 'Walk-in Client'}</p>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <p className={`font-serif text-[15px] font-bold ${
                                  darkMode ? 'text-white' : 'text-night'
                                }`}>{inr(o.total)}</p>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  o.order_status === 'confirmed'
                                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                    : o.order_status === 'fulfilled'
                                      ? 'bg-sky-500/15 border border-sky-500/30 text-sky-400'
                                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    o.order_status === 'confirmed' ? 'bg-emerald-400' : o.order_status === 'fulfilled' ? 'bg-sky-400' : 'bg-amber-400 animate-pulse'
                                  }`} />
                                  {o.order_status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {orders.length === 0 && (
                          <div className="px-6 py-12 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] mx-auto mb-2 shadow-sm">
                              <ShoppingBag className="h-6 w-6" />
                            </div>
                            <p className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-night'}`}>No Orders Registered Yet</p>
                            <p className={`text-[11px] max-w-xs mx-auto ${darkMode ? 'text-white/40' : 'text-night/50'}`}>
                              Customer checkout orders via WhatsApp and online portal will sync here directly.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pending Reviews */}
                    <div className={`rounded-3xl border overflow-hidden transition-all shadow-xl ${
                      darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-lg'
                    }`}>
                      <div className={`flex items-center justify-between px-6 py-4 border-b ${
                        darkMode ? 'border-[#d4af37]/15 bg-white/5' : 'border-[#1a1a1a]/10 bg-[#faf7f2]'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                            <Star className="h-3.5 w-3.5 fill-current" />
                          </div>
                          <h3 className={`font-serif text-lg font-bold tracking-wide ${
                            darkMode ? 'text-white' : 'text-night'
                          }`}>Customer Reviews</h3>
                        </div>
                        <button onClick={() => setTab('reviews')} className="text-[10px] text-[#d4af37] font-bold uppercase tracking-[0.2em] hover:underline flex items-center gap-1">
                          <span>View Queue</span>
                          <span>→</span>
                        </button>
                      </div>
                      <div className="divide-y divide-white/5">
                        {liveReviews
                          .filter((r) => r.status === 'pending')
                          .slice(0, 4)
                          .map((r) => (
                            <div key={r.id} className="p-5 flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[12px] font-bold ${
                                    darkMode ? 'text-white' : 'text-night'
                                  }`}>{r.name}</span>
                                  <span className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-night/40'}`}>
                                    &bull; {r.city}
                                  </span>
                                  <div className="flex text-[#d4af37] gap-0.5 ml-1">
                                    {Array.from({ length: r.rating }).map((_, i) => (
                                      <Star key={i} className="h-3 w-3 fill-current" />
                                    ))}
                                  </div>
                                </div>
                                <p className={`text-[12px] italic leading-relaxed line-clamp-2 ${
                                  darkMode ? 'text-white/70' : 'text-night/70'
                                }`}>"{r.text}"</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleToggleReview(r.id, 'published')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/25 transition-all"
                                >
                                  Publish
                                </button>
                              </div>
                            </div>
                          ))}
                        {liveReviews.filter((r) => r.status === 'pending').length === 0 && (
                          <div className="px-6 py-12 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-2 shadow-sm">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <p className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-night'}`}>All Reviews Moderated</p>
                            <p className={`text-[11px] max-w-xs mx-auto ${darkMode ? 'text-white/40' : 'text-night/50'}`}>
                              No pending customer reviews in the queue. All submissions have been processed.
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
                <div className="space-y-6">
                  {/* Loud Error Notification for Orders if Google Sheets API fails */}
                  {ordersError && (
                    <div className="rounded-3xl border border-rose-500/40 bg-rose-950/50 p-5 text-[12px] text-rose-300 flex items-start gap-3.5 shadow-xl">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-rose-200 text-[13px]">
                          Google Sheets Database Read Error (Orders Sheet)
                        </p>
                        <p className="text-[11px] text-rose-300/80 leading-relaxed font-mono">
                          {ordersError}
                        </p>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={loadAllData}
                            className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-rose-500/30 flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Retry Reading Orders</span>
                          </button>
                          <button
                            onClick={handleReconcileConflicts}
                            disabled={reconcilingConflicts}
                            className="px-3.5 py-1.5 bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-[#d4af37]/30 flex items-center gap-1"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            <span>Reconcile Database &amp; Purge Conflict Tabs</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Toolbar & Filter Pills */}
                  <div className={`p-6 rounded-3xl border transition-all shadow-md ${
                    darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                  }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Search Bar */}
                      <div className={`relative flex-1 max-w-md rounded-2xl border transition-all flex items-center px-4 py-1 ${
                        darkMode ? 'border-white/15 bg-black/40 focus-within:border-[#d4af37]' : 'border-black/15 bg-[#faf7f2] focus-within:border-[#d4af37]'
                      }`}>
                        <Search className="h-4 w-4 text-[#d4af37] shrink-0 mr-2.5" />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search by order ID, customer name, phone number…"
                          className="w-full bg-transparent py-2 text-[12px] font-medium outline-none placeholder:text-white/30"
                        />
                      </div>

                      {/* Quick Status Pills & Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {(['all', 'pending_whatsapp', 'confirmed', 'fulfilled'] as const).map((st) => {
                          const active = orderFilter === st;
                          const count = st === 'all'
                            ? orders.length
                            : orders.filter((o) => o.order_status === st).length;
                          const label = st === 'all' ? 'All Orders' : st === 'pending_whatsapp' ? 'Pending' : st.charAt(0).toUpperCase() + st.slice(1);
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setOrderFilter(st)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                active
                                  ? 'bg-[#d4af37] text-[#1F0505] shadow-md shadow-[#d4af37]/20'
                                  : (darkMode ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10' : 'bg-black/5 text-night/70 hover:bg-black/10 border border-black/10')
                              }`}
                            >
                              <span>{label}</span>
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                                active ? 'bg-[#1F0505] text-[#d4af37]' : 'bg-black/20 text-white/50'
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}

                        <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

                        {/* Database Health & Conflict Cleanup Button */}
                        <button
                          type="button"
                          onClick={handleReconcileConflicts}
                          disabled={reconcilingConflicts}
                          title="Purge duplicate conflict tabs and ensure canonical locking in Google Sheets"
                          className={`rounded-full border text-[10px] font-bold px-3 py-2 flex items-center gap-1.5 uppercase tracking-wider transition-all ${
                            darkMode
                              ? 'border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10'
                              : 'border-[#1F0505]/20 text-[#1F0505] hover:bg-[#1F0505] hover:text-white shadow-sm'
                          }`}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${reconcilingConflicts ? 'animate-spin' : ''}`} />
                          <span>{reconcilingConflicts ? 'Reconciling…' : 'Heal DB Conflicts'}</span>
                        </button>

                        <button
                          onClick={() => setShowAddOrderModal(true)}
                          className="rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[10px] px-4 py-2 flex items-center gap-1.5 uppercase tracking-[0.18em] shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
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
                          className={`rounded-full border text-[10px] font-bold px-3.5 py-2 flex items-center gap-1.5 uppercase tracking-wider transition-all ${
                            darkMode
                              ? 'border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10'
                              : 'border-[#1F0505]/20 text-[#1F0505] hover:bg-[#1F0505] hover:text-white shadow-sm'
                          }`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Orders Table Container */}
                  <div className={`rounded-3xl border overflow-hidden transition-all shadow-xl ${
                    darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-lg'
                  }`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12px]">
                        <thead className={`border-b text-[9px] uppercase tracking-[0.22em] font-bold ${
                          darkMode ? 'border-[#d4af37]/15 text-[#d4af37] bg-black/40' : 'border-[#1a1a1a]/10 text-night/60 bg-[#faf7f2]'
                        }`}>
                          <tr>
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Total Amount</th>
                            <th className="px-6 py-4">Payment</th>
                            <th className="px-6 py-4">Fulfillment</th>
                            <th className="px-6 py-4 text-right">Dossier</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredOrders.map((o) => {
                            const initials = (o.customers?.name || 'Walk-in')
                              .split(' ')
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase();
                            return (
                              <tr
                                key={o.id}
                                className={`transition-colors group ${
                                  darkMode ? 'hover:bg-white/5' : 'hover:bg-[#faf7f2]'
                                }`}
                              >
                                <td className="px-6 py-4 font-mono font-bold text-[#d4af37]">
                                  {o.order_code}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] font-bold text-[10px]">
                                      {initials}
                                    </div>
                                    <div>
                                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-night'}`}>
                                        {o.customers?.name || 'Walk-in Client'}
                                      </p>
                                      <p className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-night/40'}`}>
                                        {o.customers?.phone || '—'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className={`px-6 py-4 text-[11px] ${
                                  darkMode ? 'text-white/50' : 'text-night/50'
                                }`}>
                                  {formatSafeDate(o.created_at)}
                                </td>
                                <td className="px-6 py-4 font-serif text-[15px] font-bold text-[#d4af37]">
                                  {inr(o.total)}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    o.paid || o.payment_status === 'paid'
                                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${o.paid || o.payment_status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    {o.paid ? 'Paid' : o.payment_status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    o.order_status === 'confirmed'
                                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                      : o.order_status === 'fulfilled'
                                        ? 'bg-sky-500/15 border border-sky-500/30 text-sky-400'
                                        : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                      o.order_status === 'confirmed' ? 'bg-emerald-400' : o.order_status === 'fulfilled' ? 'bg-sky-400' : 'bg-amber-400 animate-pulse'
                                    }`} />
                                    {o.order_status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => setSelectedOrder(o)}
                                    className="px-3.5 py-1.5 rounded-xl border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-bold uppercase tracking-wider hover:bg-[#d4af37] hover:text-[#1F0505] transition-all"
                                  >
                                    Inspect Slip →
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredOrders.length === 0 && (
                            <tr>
                              <td colSpan={7} className={`px-6 py-12 text-center text-[12px] ${
                                darkMode ? 'text-white/30' : 'text-night/40'
                              }`}>
                                No orders matching the current filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============ TAB 3: CATALOG ============ */}
              {tab === 'catalog' && (
                <div className="space-y-6">
                  {/* Offer Banner Control */}
                  <div className={`rounded-3xl border p-6 transition-all shadow-md relative overflow-hidden ${
                    darkMode ? 'border-[#d4af37]/25 bg-gradient-to-r from-[#180d0b] via-[#120706] to-[#180d0b] text-white' : 'border-[#1F0505]/15 bg-white text-[#1F0505]'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-[#d4af37] font-bold uppercase tracking-[0.25em]">
                            Global Promotion Engine
                          </p>
                          <h3 className="font-serif text-base font-bold">Sitewide Storefront Banner</h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOffer((o) => ({ ...o, active: !o.active }));
                          setDirty(true);
                        }}
                        className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] font-bold border transition-all flex items-center gap-2 shadow-sm ${
                          offer.active
                            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                            : (darkMode ? 'border-white/20 text-white/40 bg-black/30' : 'border-[#1F0505]/20 text-[#1F0505]/50 bg-gray-100')
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${offer.active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                        {offer.active ? 'Active on Store' : 'Banner Inactive'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div className={`rounded-2xl border transition-colors ${
                        darkMode ? 'border-white/15 bg-black/40 focus-within:border-[#d4af37]' : 'border-[#1F0505]/20 bg-[#FAFAFA] focus-within:border-[#d4af37]'
                      }`}>
                        <label className="block px-4 pt-2 text-[9px] uppercase tracking-wider text-white/40 font-bold">
                          Headline Text
                        </label>
                        <input
                          value={offer.headline}
                          onChange={(e) => {
                            setOffer((o) => ({ ...o, headline: e.target.value }));
                            setDirty(true);
                          }}
                          placeholder="Headline (e.g. LUXURY BRIDAL PROMOTION)"
                          className="w-full bg-transparent px-4 pb-2.5 text-[12px] font-semibold outline-none placeholder:text-white/30"
                        />
                      </div>
                      <div className={`rounded-2xl border transition-colors ${
                        darkMode ? 'border-white/15 bg-black/40 focus-within:border-[#d4af37]' : 'border-[#1F0505]/20 bg-[#FAFAFA] focus-within:border-[#d4af37]'
                      }`}>
                        <label className="block px-4 pt-2 text-[9px] uppercase tracking-wider text-white/40 font-bold">
                          Subtext / Detail
                        </label>
                        <input
                          value={offer.detail}
                          onChange={(e) => {
                            setOffer((o) => ({ ...o, detail: e.target.value }));
                            setDirty(true);
                          }}
                          placeholder="Details (e.g. Complimentary shipping on orders above ₹4,999)"
                          className="w-full bg-transparent px-4 pb-2.5 text-[12px] font-medium outline-none placeholder:text-white/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className={`p-6 rounded-3xl border transition-all shadow-md ${
                    darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`relative flex-1 max-w-sm rounded-2xl border transition-all flex items-center px-4 py-1 ${
                          darkMode ? 'border-white/15 bg-black/40 focus-within:border-[#d4af37]' : 'border-black/15 bg-[#faf7f2] focus-within:border-[#d4af37]'
                        }`}>
                          <Search className="h-4 w-4 text-[#d4af37] shrink-0 mr-2.5" />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search fabrics by name, composition, tags…"
                            className="w-full bg-transparent py-2 text-[12px] font-medium outline-none placeholder:text-white/30"
                          />
                        </div>
                        <span className={`px-3 py-2 rounded-2xl border text-[11px] font-mono font-bold ${
                          darkMode ? 'border-white/10 text-[#d4af37] bg-black/30' : 'border-black/10 text-night bg-black/5'
                        }`}>
                          {filteredProducts.length} fabrics
                        </span>
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
                              })),
                            )
                          }
                          className={`rounded-full border text-[10px] font-bold px-4 py-2 flex items-center gap-1.5 uppercase tracking-wider transition-all ${
                            darkMode
                              ? 'border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10'
                              : 'border-[#1F0505]/20 text-[#1F0505] hover:bg-[#1F0505] hover:text-white bg-white shadow-sm'
                          }`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>CSV</span>
                        </button>

                        <button
                          onClick={() => setShowAddModal(true)}
                          className="rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[11px] px-5 py-2 flex items-center gap-1.5 uppercase tracking-[0.18em] shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Fabric</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fabrics Grid */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-3xl border overflow-hidden transition-all duration-300 shadow-md group flex flex-col justify-between relative ${
                          darkMode
                            ? 'border-[#d4af37]/20 bg-[#160b09]/90 hover:border-[#d4af37]/60 shadow-black/40'
                            : 'border-[#1a1a1a]/15 bg-white hover:border-[#d4af37]/60 shadow-gray-200'
                        }`}
                      >
                        {/* Saving State Overlay */}
                        {savingCardId === item.id && (
                          <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 rounded-3xl p-4 text-center">
                            <Loader2 className="h-7 w-7 animate-spin text-[#d4af37]" />
                            <p className="text-[11px] font-bold text-[#d4af37] uppercase tracking-[0.15em]">
                              Syncing Row to Google Sheets…
                            </p>
                            <p className="text-[9.5px] text-white/60 font-mono">
                              Verifying database write &amp; refreshing live shop
                            </p>
                          </div>
                        )}

                        {/* Image Banner with Floating Badges */}
                        <div className="relative h-44 w-full bg-black/40 overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                          {/* Top Stock, Visibility & Edit Badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md ${
                              item.stock === 'in'
                                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
                                : item.stock === 'low'
                                  ? 'bg-amber-900/80 text-amber-300 border border-amber-500/40'
                                  : 'bg-rose-900/80 text-rose-300 border border-rose-500/40'
                            }`}>
                              {STOCK_LABELS[item.stock]}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingProductId(item.id)}
                                title="Edit full fabric specifications"
                                className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 backdrop-blur-md shadow-md bg-black/60 text-white/80 hover:text-[#d4af37] border border-white/20 hover:border-[#d4af37]/60"
                              >
                                <Pencil className="h-2.5 w-2.5 text-[#d4af37]" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickSaveProduct(item.id, { hidden: !item.hidden })}
                                title={item.hidden ? 'Click to publish Live' : 'Click to set Draft'}
                                className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 backdrop-blur-md shadow-md ${
                                  !item.hidden
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${!item.hidden ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                                {!item.hidden ? 'Live' : 'Draft'}
                              </button>
                            </div>
                          </div>

                          {/* Category Tag on bottom left of image */}
                          <div className="absolute bottom-2.5 left-3">
                            <span className="px-2.5 py-0.5 rounded-md bg-black/60 border border-[#d4af37]/40 text-[#d4af37] text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                          <div>
                            <input
                              defaultValue={item.name}
                              key={item.id + '-name-' + item.name}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val && val !== item.name) {
                                  handleQuickSaveProduct(item.id, { name: val });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className={`w-full bg-transparent font-serif text-[15px] font-bold outline-none border-b border-transparent focus:border-[#d4af37] transition-colors ${
                                darkMode ? 'text-white' : 'text-night'
                              }`}
                            />
                            <p className={`text-[11px] mt-1 line-clamp-1 ${
                              darkMode ? 'text-white/40' : 'text-night/50'
                            }`}>
                              {item.composition || '100% Luxury Couture Base'} &bull; {item.width || '44 in'}
                            </p>
                          </div>

                          {/* Inline Controls (Price & Stock) */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider font-bold text-[#d4af37] mb-1">
                                Price / Metre
                              </label>
                              <div className="flex items-center rounded-xl border border-white/15 bg-black/30 px-2.5 py-1 focus-within:border-[#d4af37]">
                                <span className="text-[11px] text-[#d4af37] font-bold mr-1">₹</span>
                                <input
                                  type="number"
                                  defaultValue={item.pricePerMetre}
                                  key={item.id + '-price-' + item.pricePerMetre}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    if (val > 0 && val !== item.pricePerMetre) {
                                      handleQuickSaveProduct(item.id, { pricePerMetre: val });
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  className="w-full bg-transparent text-[12px] font-bold text-white outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className={`block text-[9px] uppercase tracking-wider font-bold mb-1 ${
                                darkMode ? 'text-white/40' : 'text-night/50'
                              }`}>
                                Stock Level
                              </label>
                              <select
                                value={item.stock}
                                onChange={(e) => {
                                  const val = e.target.value as Stock;
                                  handleQuickSaveProduct(item.id, { stock: val });
                                }}
                                className="w-full rounded-xl border border-white/15 bg-black/30 px-2.5 py-1 text-[11px] text-white outline-none focus:border-[#d4af37]"
                              >
                                <option value="in" className="bg-[#120706] text-white">In Stock</option>
                                <option value="low" className="bg-[#120706] text-white">Low Stock</option>
                                <option value="out" className="bg-[#120706] text-white">Out of Stock</option>
                              </select>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] text-white/30 font-mono">
                              Min {item.minMetres || 0.5}m
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                title="Edit full fabric specifications"
                                onClick={() => setEditingProductId(item.id)}
                                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/30 hover:bg-[#d4af37]/25 transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                <Pencil className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                              <a
                                href={`/#/fabric/${item.id}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Preview on website"
                                className="p-1.5 rounded-lg text-white/40 hover:text-[#d4af37] transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                              <button
                                type="button"
                                title="Delete fabric"
                                onClick={() => handleDeleteFabric(item.id, item.name)}
                                className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className={`col-span-full py-16 text-center space-y-2 ${
                        darkMode ? 'text-white/40' : 'text-night/40'
                      }`}>
                        <Package className="h-8 w-8 text-[#d4af37]/40 mx-auto" />
                        <p className="text-[13px] font-bold">No Fabrics Match Your Search</p>
                        <p className="text-[11px]">Try clearing your search query or add a new fabric to the atelier collection.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============ TAB 4: REVIEWS ============ */}
              {tab === 'reviews' && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-3xl border transition-all shadow-md ${
                    darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                          <Star className="h-5 w-5 fill-current" />
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#d4af37]">
                            Client Testimonials
                          </p>
                          <h3 className={`font-serif text-lg font-bold ${darkMode ? 'text-white' : 'text-night'}`}>
                            Review Moderation Queue
                          </h3>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]">
                          {liveReviews.length} total
                        </span>
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
                            })),
                          )
                        }
                        className={`rounded-full border text-[10px] font-bold px-4 py-2 flex items-center gap-1.5 uppercase tracking-wider transition-all ${
                          darkMode
                            ? 'border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10'
                            : 'border-[#1F0505]/20 text-[#1F0505] hover:bg-[#1F0505] hover:text-white shadow-sm'
                        }`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {liveReviews.map((rev) => {
                      const initials = rev.name
                        .split(' ')
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      return (
                        <div
                          key={rev.id}
                          className={`p-6 rounded-3xl border transition-all duration-300 shadow-md flex flex-col justify-between space-y-4 ${
                            darkMode
                              ? 'border-[#d4af37]/20 bg-[#160b09]/90 hover:border-[#d4af37]/50 shadow-black/40'
                              : 'border-[#1a1a1a]/15 bg-white hover:border-[#d4af37]/50 shadow-gray-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] font-bold text-[11px]">
                                  {initials}
                                </div>
                                <div>
                                  <h4 className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-night'}`}>
                                    {rev.name}
                                  </h4>
                                  <p className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-night/40'}`}>
                                    {rev.city} &bull; {rev.date}
                                  </p>
                                </div>
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                rev.status === 'published'
                                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                  : rev.status === 'pending'
                                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                                    : 'bg-white/10 text-white/50 border border-white/15'
                              }`}>
                                {rev.status}
                              </span>
                            </div>

                            <div className="flex text-[#d4af37] gap-0.5 mb-2.5">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 fill-current" />
                              ))}
                            </div>

                            <p className={`text-[12px] italic leading-relaxed ${
                              darkMode ? 'text-white/80' : 'text-night/80'
                            }`}>
                              "{rev.text}"
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] text-white/30 truncate max-w-[150px]">
                              {rev.userEmail || 'Storefront Visitor'}
                            </span>

                            <div className="flex items-center gap-2">
                              {rev.status !== 'published' && (
                                <button
                                  onClick={() => handleToggleReview(rev.id, 'published')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/25 transition-all"
                                >
                                  Publish Live
                                </button>
                              )}
                              {rev.status !== 'private' && (
                                <button
                                  onClick={() => handleToggleReview(rev.id, 'private')}
                                  className="px-3 py-1.5 rounded-xl border border-white/20 text-white/50 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all"
                                >
                                  Set Private
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReviewRow(rev.id)}
                                className="p-1.5 text-white/30 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {liveReviews.length === 0 && (
                      <div className={`col-span-full py-16 text-center space-y-2 ${
                        darkMode ? 'text-white/40' : 'text-night/40'
                      }`}>
                        <Star className="h-8 w-8 text-[#d4af37]/40 mx-auto" />
                        <p className="text-[13px] font-bold">No Reviews in Queue</p>
                        <p className="text-[11px]">Customer reviews submitted on product pages will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============ TAB 5: CUSTOMERS ============ */}
              {tab === 'customers' && (
                <div className="space-y-6">
                  {/* Summary & Toolbar */}
                  <div className={`p-6 rounded-3xl border transition-all shadow-md ${
                    darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#d4af37]">
                            Client Database
                          </p>
                          <h3 className={`font-serif text-lg font-bold ${darkMode ? 'text-white' : 'text-night'}`}>
                            Haute-Couture Customer Directory
                          </h3>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]">
                          {customerList.length} clients
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowAddCustomerModal(true)}
                          className="rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[10px] px-4 py-2 flex items-center gap-1.5 uppercase tracking-[0.18em] shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
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
                              })),
                            )
                          }
                          className={`rounded-full border text-[10px] font-bold px-3.5 py-2 flex items-center gap-1.5 uppercase tracking-wider transition-all ${
                            darkMode
                              ? 'border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10'
                              : 'border-[#1F0505]/20 text-[#1F0505] hover:bg-[#1F0505] hover:text-white shadow-sm'
                          }`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Customer Registry Table */}
                  <div className={`rounded-3xl border overflow-hidden transition-all shadow-xl ${
                    darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-lg'
                  }`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12px]">
                        <thead className={`border-b text-[9px] uppercase tracking-[0.22em] font-bold ${
                          darkMode ? 'border-[#d4af37]/15 text-[#d4af37] bg-black/40' : 'border-[#1a1a1a]/10 text-night/60 bg-[#faf7f2]'
                        }`}>
                          <tr>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Phone / WhatsApp</th>
                            <th className="px-6 py-4">Email Address</th>
                            <th className="px-6 py-4">City</th>
                            <th className="px-6 py-4">Acquisition Channel</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {customerList.map((c, idx) => {
                            const initials = c.name
                              .split(' ')
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase();
                            const cleanPhone = c.phone.replace(/[^0-9]/g, '');
                            return (
                              <tr
                                key={idx}
                                className={`transition-colors ${
                                  darkMode ? 'hover:bg-white/5' : 'hover:bg-[#faf7f2]'
                                }`}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] font-bold text-[11px]">
                                      {initials}
                                    </div>
                                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-night'}`}>
                                      {c.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-mono text-[12px] ${darkMode ? 'text-white/80' : 'text-night/80'}`}>
                                      {c.phone}
                                    </span>
                                    {cleanPhone.length >= 10 && (
                                      <a
                                        href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Direct WhatsApp Chat"
                                        className="p-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all"
                                      >
                                        <Send className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className={`px-6 py-4 text-[11px] ${
                                  darkMode ? 'text-white/50' : 'text-night/50'
                                }`}>
                                  {c.email}
                                </td>
                                <td className={`px-6 py-4 capitalize text-[12px] ${
                                  darkMode ? 'text-white/80' : 'text-night/80'
                                }`}>
                                  {c.city}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    c.signup_method === 'Online Account'
                                      ? 'bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]'
                                      : c.signup_method === 'Online Checkout'
                                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                        : 'bg-purple-500/15 border border-purple-500/30 text-purple-300'
                                  }`}>
                                    {c.signup_method}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {customerList.length === 0 && (
                            <tr>
                              <td colSpan={5} className={`px-6 py-12 text-center text-[12px] ${
                                darkMode ? 'text-white/30' : 'text-night/40'
                              }`}>
                                No customer profiles registered yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============ TAB 6: PAYMENTS ============ */}
              {tab === 'payments' && (
                <div className="space-y-6">
                  {/* Financial Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`p-5 rounded-3xl border ${
                      darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                    }`}>
                      <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#d4af37] mb-1">
                        Gross Processed
                      </p>
                      <h4 className="font-serif text-2xl font-bold text-emerald-400">
                        {inr(metrics.totalRevenue)}
                      </h4>
                      <p className={`text-[10px] mt-1 ${darkMode ? 'text-white/40' : 'text-night/50'}`}>
                        All paid & confirmed transactions
                      </p>
                    </div>

                    <div className={`p-5 rounded-3xl border ${
                      darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                    }`}>
                      <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#d4af37] mb-1">
                        Settled Orders
                      </p>
                      <h4 className={`font-serif text-2xl font-bold ${darkMode ? 'text-white' : 'text-night'}`}>
                        {orders.filter((o) => o.paid || o.payment_status === 'paid').length} Orders
                      </h4>
                      <p className={`text-[10px] mt-1 ${darkMode ? 'text-white/40' : 'text-night/50'}`}>
                        Confirmed receipt of funds
                      </p>
                    </div>

                    <div className={`p-5 rounded-3xl border ${
                      darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                    }`}>
                      <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#d4af37] mb-1">
                        Average Ticket (AOV)
                      </p>
                      <h4 className="font-serif text-2xl font-bold text-[#d4af37]">
                        {inr(orders.length > 0 ? Math.round(metrics.totalRevenue / (orders.filter(o => o.paid).length || 1)) : 0)}
                      </h4>
                      <p className={`text-[10px] mt-1 ${darkMode ? 'text-white/40' : 'text-night/50'}`}>
                        Per couture patron order
                      </p>
                    </div>
                  </div>

                  {/* Financial Ledger Container */}
                  <div className="space-y-6">
                    {/* Loud Error Notification for Ledger if Google Sheets API fails */}
                    {ordersError && (
                      <div className="rounded-3xl border border-rose-500/40 bg-rose-950/50 p-5 text-[12px] text-rose-300 flex items-start gap-3.5 shadow-xl">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-bold text-rose-200 text-[13px]">
                            Google Sheets Ledger Sync Error
                          </p>
                          <p className="text-[11px] text-rose-300/80 leading-relaxed font-mono">
                            {ordersError}
                          </p>
                          <button
                            onClick={loadAllData}
                            className="mt-2 px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-rose-500/30 flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Retry Reading Ledger</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`rounded-3xl border overflow-hidden transition-all shadow-xl ${
                      darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-lg'
                    }`}>
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b gap-3 ${
                        darkMode ? 'border-[#d4af37]/15 bg-white/5' : 'border-[#1a1a1a]/10 bg-[#faf7f2]'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className={`font-serif text-lg font-bold tracking-wide ${
                              darkMode ? 'text-white' : 'text-night'
                            }`}>Financial Ledger</h3>
                            <p className="text-[10px] text-[#d4af37] font-mono mt-0.5">
                              Derived directly from complete Google Sheets historical Orders dataset
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                            {orders.length} entries
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleReconcileConflicts}
                            disabled={reconcilingConflicts}
                            title="Audit Google Sheets database and purge conflict tabs"
                            className={`rounded-full border text-[10px] font-bold px-3 py-1.5 flex items-center gap-1.5 uppercase tracking-wider transition-all ${
                              darkMode
                                ? 'border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10'
                                : 'border-[#1F0505]/20 text-[#1F0505] hover:bg-[#1F0505] hover:text-white shadow-sm'
                            }`}
                          >
                            <RefreshCw className={`h-3 w-3 ${reconcilingConflicts ? 'animate-spin' : ''}`} />
                            <span>{reconcilingConflicts ? 'Auditing…' : 'Verify DB Lock'}</span>
                          </button>

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
                                })),
                              )
                            }
                            className={`rounded-full border text-[10px] font-bold px-3.5 py-1.5 flex items-center gap-1.5 uppercase tracking-wider transition-all ${
                              darkMode
                                ? 'border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10'
                                : 'border-[#1F0505]/20 text-[#1F0505] hover:bg-[#1F0505] hover:text-white shadow-sm'
                            }`}
                          >
                            <Download className="h-3 w-3" />
                            <span>Export CSV</span>
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12px]">
                          <thead className={`border-b text-[9px] uppercase tracking-[0.22em] font-bold ${
                            darkMode ? 'border-[#d4af37]/15 text-[#d4af37] bg-black/40' : 'border-[#1a1a1a]/10 text-night/60 bg-[#faf7f2]'
                          }`}>
                            <tr>
                              <th className="px-6 py-4">Order Code</th>
                              <th className="px-6 py-4">Client</th>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Amount</th>
                              <th className="px-6 py-4">Method</th>
                              <th className="px-6 py-4">Ref ID / Txn</th>
                              <th className="px-6 py-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {orders.map((o) => (
                              <tr
                                key={o.id}
                                className={`transition-colors ${
                                  darkMode ? 'hover:bg-white/5' : 'hover:bg-[#faf7f2]'
                                }`}
                              >
                                <td className="px-6 py-4 font-mono font-bold text-[#d4af37]">
                                  {o.order_code}
                                </td>
                                <td className={`px-6 py-4 font-semibold ${
                                  darkMode ? 'text-white' : 'text-night'
                                }`}>
                                  {o.customers?.name || 'Walk-in Patron'}
                                </td>
                                <td className={`px-6 py-4 text-[11px] font-mono ${
                                  darkMode ? 'text-white/50' : 'text-night/50'
                                }`}>
                                  {formatSafeDate(o.created_at)}
                                </td>
                                <td className="px-6 py-4 font-serif text-[15px] font-bold text-emerald-400">
                                  {inr(o.total)}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    o.payment_method === 'UPI'
                                      ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300'
                                      : o.payment_method === 'Cash'
                                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                        : 'bg-sky-500/15 border border-sky-500/30 text-sky-300'
                                  }`}>
                                    {o.payment_method}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 font-mono text-[11px] ${
                                  darkMode ? 'text-white/40' : 'text-night/40'
                                }`}>
                                  {o.payment_reference || '—'}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    o.paid || o.payment_status === 'paid'
                                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${o.paid || o.payment_status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    {o.payment_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {orders.length === 0 && (
                              <tr>
                                <td colSpan={7} className={`px-6 py-12 text-center text-[12px] ${
                                  darkMode ? 'text-white/30' : 'text-night/40'
                                }`}>
                                  No payment records recorded in the ledger yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============ TAB: CATEGORIES ============ */}
              {tab === 'categories' && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-3xl border transition-all shadow-md ${
                    darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                          <FolderOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#d4af37]">
                            Store Taxonomy
                          </p>
                          <h3 className={`font-serif text-lg font-bold ${darkMode ? 'text-white' : 'text-night'}`}>
                            Fabric Categories
                          </h3>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]">
                          {categories.length} categories
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          const name = prompt('Enter new category name:');
                          if (!name) return;
                          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                          if (categories.some(c => c.slug === slug)) return alert('Category already exists!');
                          const newCat = {
                            id: slug,
                            name,
                            slug,
                            description: `Premium ${name} luxury fabrics base.`,
                            active: true
                          };
                          const updated = [...categories, newCat];
                          setCategories(updated);
                          saveCategories(updated).catch(console.error);
                        }}
                        className="rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[10px] px-4 py-2 flex items-center gap-1.5 uppercase tracking-[0.18em] shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Category</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((c) => {
                      const attachedCount = items.filter(
                        (i) => i.categoryId === c.slug || i.category.toLowerCase() === c.name.toLowerCase()
                      ).length;
                      return (
                        <div
                          key={c.slug}
                          className={`p-6 rounded-3xl border transition-all duration-300 shadow-md flex flex-col justify-between space-y-4 ${
                            darkMode
                              ? 'border-[#d4af37]/20 bg-[#160b09]/90 hover:border-[#d4af37]/50 shadow-black/40'
                              : 'border-[#1a1a1a]/15 bg-white hover:border-[#d4af37]/50 shadow-gray-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/20">
                                #{c.slug}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                c.active
                                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${c.active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                {c.active ? 'Active' : 'Disabled'}
                              </span>
                            </div>

                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                const updated = categories.map(item => item.slug === c.slug ? { ...item, name: newName } : item);
                                setCategories(updated);
                                saveCategories(updated).catch(console.error);
                              }}
                              className={`w-full bg-transparent font-serif text-base font-bold outline-none border-b border-transparent focus:border-[#d4af37] transition-colors ${
                                darkMode ? 'text-white' : 'text-night'
                              }`}
                            />
                            <p className={`text-[11px] mt-1 ${darkMode ? 'text-white/40' : 'text-night/50'}`}>
                              {attachedCount} product{attachedCount === 1 ? '' : 's'} assigned
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                            <button
                              onClick={() => {
                                const updated = categories.map(item => item.slug === c.slug ? { ...item, active: !item.active } : item);
                                setCategories(updated);
                                saveCategories(updated).catch(console.error);
                              }}
                              className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                                c.active
                                  ? 'border-white/20 text-white/50 hover:bg-white/10 hover:text-white'
                                  : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                              }`}
                            >
                              {c.active ? 'Deactivate' : 'Enable'}
                            </button>

                            <button
                              onClick={() => {
                                if (attachedCount > 0) {
                                  alert(`Cannot delete category "${c.name}" because it is currently assigned to ${attachedCount} product(s). Reassign them first.`);
                                  return;
                                }
                                if (confirm(`Are you sure you want to permanently delete category "${c.name}"?`)) {
                                  const updated = categories.filter(item => item.slug !== c.slug);
                                  setCategories(updated);
                                  saveCategories(updated).catch(console.error);
                                }
                              }}
                              className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============ TAB: COMBOS ============ */}
              {tab === 'combos' && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-3xl border transition-all shadow-md ${
                    darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                        <Percent className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#d4af37]">
                          Bundle Promotions
                        </p>
                        <h3 className={`font-serif text-lg font-bold ${darkMode ? 'text-white' : 'text-night'}`}>
                          Atelier Combo Deals
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Seeded Combo Spotlight Card */}
                  <div className={`p-6 rounded-3xl border transition-all shadow-xl relative overflow-hidden ${
                    darkMode ? 'border-[#d4af37]/25 bg-gradient-to-br from-[#180d0b] via-[#120706] to-[#180d0b]' : 'border-[#1a1a1a]/15 bg-white shadow-md'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]">
                          Active Checkout Rule
                        </span>
                        <h4 className="font-serif text-xl font-bold text-white mt-2">
                          Royal Wedding Duo (Tulle + Pearl Organza)
                        </h4>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Flat 10% Bundle Discount
                      </span>
                    </div>

                    <p className={`text-[12px] leading-relaxed max-w-2xl ${darkMode ? 'text-white/70' : 'text-night/70'}`}>
                      When a client pairs <strong className="text-[#d4af37]">Aurelia Hand-Embroidered Tulle</strong> together with <strong className="text-[#d4af37]">Noor Pearl Organza</strong> in the same order, the checkout engine automatically computes a flat 10% discount across both fabrics.
                    </p>
                  </div>
                </div>
              )}

              {/* ============ TAB 7: SETTINGS ============ */}
              {tab === 'settings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shipping Rules */}
                    <div className={`p-6 rounded-3xl border transition-all shadow-md ${
                      darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                    }`}>
                      <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#d4af37] mb-1">
                        Logistics
                      </p>
                      <h3 className={`font-serif text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-night'}`}>
                        Shipping &amp; Delivery Rules
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl border border-white/10 bg-black/30">
                          <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-1">Free Shipping Above</p>
                          <p className="font-serif text-xl font-bold text-[#d4af37]">{inr(ORDER.freeShippingAbove)}</p>
                        </div>
                        <div className="p-4 rounded-2xl border border-white/10 bg-black/30">
                          <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-1">Flat Standard Shipping</p>
                          <p className="font-serif text-xl font-bold text-white">{inr(ORDER.shippingFlat)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Wholesale Rules */}
                    <div className={`p-6 rounded-3xl border transition-all shadow-md ${
                      darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                    }`}>
                      <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#d4af37] mb-1">
                        B2B Tier
                      </p>
                      <h3 className={`font-serif text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-night'}`}>
                        Wholesale &amp; Bulk Tiers
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl border border-white/10 bg-black/30">
                          <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-1">Min Wholesale Qty</p>
                          <p className="font-serif text-xl font-bold text-[#d4af37]">{ORDER.wholesaleMinMetres} metres</p>
                        </div>
                        <div className="p-4 rounded-2xl border border-white/10 bg-black/30">
                          <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-1">Wholesale Discount</p>
                          <p className="font-serif text-xl font-bold text-emerald-400">{ORDER.wholesaleDiscount * 100}% off</p>
                        </div>
                      </div>
                    </div>

                    {/* Theme Switcher */}
                    <div className={`p-6 rounded-3xl border transition-all shadow-md ${
                      darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                    }`}>
                      <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#d4af37] mb-1">
                        Appearance
                      </p>
                      <h3 className={`font-serif text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-night'}`}>
                        Portal Visual Theme
                      </h3>
                      <p className={`text-[11px] mb-4 ${darkMode ? 'text-white/40' : 'text-night/50'}`}>
                        Select your preferred atelier working environment.
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleThemeToggle(false)}
                          className={`flex-1 py-3 rounded-2xl border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            !darkMode
                              ? 'bg-[#d4af37] text-[#1F0505] border-[#d4af37] shadow-md shadow-[#d4af37]/25'
                              : 'border-white/15 bg-black/30 text-white/50 hover:border-white/30'
                          }`}
                        >
                          <Sun className="h-4 w-4" />
                          <span>Light Mode</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleThemeToggle(true)}
                          className={`flex-1 py-3 rounded-2xl border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            darkMode
                              ? 'bg-[#d4af37] text-[#1F0505] border-[#d4af37] shadow-md shadow-[#d4af37]/25'
                              : 'border-black/15 bg-[#faf7f2] text-night/50 hover:border-black/30'
                          }`}
                        >
                          <Moon className="h-4 w-4" />
                          <span>Dark Mode</span>
                        </button>
                      </div>
                    </div>

                    {/* Business Info */}
                    <div className={`p-6 rounded-3xl border transition-all shadow-md ${
                      darkMode ? 'border-[#d4af37]/20 bg-[#160b09]/90' : 'border-[#1a1a1a]/15 bg-white shadow-sm'
                    }`}>
                      <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#d4af37] mb-1">
                        Atelier Identity
                      </p>
                      <h3 className={`font-serif text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-night'}`}>
                        {BUSINESS.name}
                      </h3>
                      <p className={`text-[12px] font-semibold text-[#d4af37]`}>
                        {BUSINESS.city}, India
                      </p>
                      <p className={`text-[11px] mt-1 leading-relaxed ${darkMode ? 'text-white/40' : 'text-night/50'}`}>
                        {BUSINESS.addressLine1}, {BUSINESS.addressLine2}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className={`w-full max-w-lg rounded-3xl border overflow-hidden shadow-2xl relative ${
            darkMode ? 'border-[#d4af37]/30 bg-[#160b09]' : 'border-[#1a1a1a]/20 bg-white'
          }`}>
            <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-5 border-b ${
              darkMode ? 'border-white/10 bg-black/20' : 'border-black/10 bg-[#faf7f2]'
            }`}>
              <div>
                <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#d4af37]">
                  Order Dossier
                </span>
                <h3 className="font-mono text-xl font-bold text-white mt-0.5">
                  {selectedOrder.order_code}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-white/10 bg-black/20">
                  <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-0.5">Client</p>
                  <p className="font-semibold text-[13px] text-white">{selectedOrder.customers?.name || 'Walk-in'}</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-white/10 bg-black/20">
                  <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-0.5">Phone</p>
                  <p className="font-mono text-[13px] text-[#d4af37]">{selectedOrder.customers?.phone || '—'}</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-white/10 bg-black/20">
                  <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-0.5">Total Value</p>
                  <p className="font-serif text-lg font-bold text-emerald-400">{inr(selectedOrder.total)}</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-white/10 bg-black/20">
                  <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-0.5">Status</p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]">
                    {selectedOrder.order_status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {selectedOrder.address && (
                <div className="p-4 rounded-2xl border border-white/10 bg-black/20">
                  <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-1">
                    Shipping Destination
                  </p>
                  <p className="text-[12px] text-white/80 leading-relaxed">
                    {selectedOrder.address}, {selectedOrder.city} - {selectedOrder.pincode}
                  </p>
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="pt-2 flex gap-3">
                {selectedOrder.order_status !== 'confirmed' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'confirmed')}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-[10px] uppercase tracking-[0.18em] shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Confirm Order ✓
                  </button>
                )}
                {selectedOrder.order_status !== 'fulfilled' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'fulfilled')}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8024] text-[#1F0505] font-bold text-[10px] uppercase tracking-[0.18em] shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Mark Dispatched / Fulfilled →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal (Loaded fresh by Product ID from Google Sheets) */}
      {editingProductId && (
        <AddProductModal
          productId={editingProductId}
          categories={categories}
          onClose={() => setEditingProductId(null)}
          onSave={async (updatedItem) => {
            setPublishState('publishing');
            setPublishError('');
            try {
              // 1. Single write-then-verify path in Google Sheets matched strictly by unique product ID
              // 2. Verified canonical row returned
              // 3. Immediately invalidates /shop storefront live cache
              const verified = await saveProduct(updatedItem, offer);

              // 4. Update Admin Catalog immediately with verified item
              setItems((prev) => prev.map((i) => (i.id === verified.id ? verified : i)));
              setOriginalIds((prev) => (prev.includes(verified.id) ? prev : [...prev, verified.id]));
              setDirty(false);
              setEditingProductId(null);
              setPublishState('done');
              setTimeout(() => setPublishState('idle'), 2500);
            } catch (e) {
              setPublishState('error');
              setPublishError(e instanceof Error ? e.message : 'Update failed');
              alert('Failed to update fabric in Google Sheets: ' + (e instanceof Error ? e.message : String(e)));
            }
          }}
        />
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSave={async (newItem) => {
            setPublishState('publishing');
            setPublishError('');
            try {
              const verified = await saveProduct(newItem, offer);
              setItems((prev) => [verified, ...prev.filter((i) => i.id !== verified.id)]);
              setOriginalIds((prev) => [verified.id, ...prev]);
              setDirty(false);
              setShowAddModal(false);
              setPublishState('done');
              setTimeout(() => setPublishState('idle'), 2500);
            } catch (e) {
              setPublishState('error');
              setPublishError(e instanceof Error ? e.message : 'Publish failed');
              alert('Failed to save fabric to database: ' + (e instanceof Error ? e.message : String(e)));
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
