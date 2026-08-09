import { useEffect, useMemo, useState } from 'react';
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
  adminLogin,
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
  type AdminReviewRow,
  type AdminOrderRow,
} from '../lib/adminApi';
import { ADMIN_PIN, BUSINESS, ORDER, UPI, inr } from '../lib/constants';

type TabId = 'dashboard' | 'orders' | 'catalog' | 'reviews' | 'customers' | 'payments' | 'settings';

const blankItem = (): Item => ({
  id: `fabric-${Math.random().toString(36).slice(2, 7)}`,
  name: 'New Fabric',
  category: 'Contemporary',
  composition: '100% Pure Silk',
  width: '44 in',
  pricePerMetre: 2500,
  minMetres: 1,
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

type LoginStep = 'credentials' | 'otp';

function SupabaseLogin({ onUnlocked }: { onUnlocked: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password) return setError('Enter your username and password');
    setBusy(true);
    try {
      await adminLogin(username.trim(), password);
      if (!checkIsAdmin()) {
        setError('Authentication failed');
        return;
      }
      onUnlocked();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid credentials');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-xs text-center">
      <img src="/images/logo/logo-mark.png" alt="" aria-hidden="true" className="mx-auto h-16 w-16 object-contain" />
      <h1 className="mt-4 font-serif text-2xl text-ivory">Showroom Admin Portal</h1>
      <p className="mt-2 text-[13px] text-ivory/50">Sign in with admin credentials</p>
      <input
        type="text"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        autoFocus
        autoCapitalize="none"
        placeholder="Username"
        className="mt-5 w-full rounded-[2px] border border-ivory/15 bg-chocolate px-4 py-3 text-center text-ivory outline-none focus:border-gold"
      />
      <div className="relative mt-3">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="Password"
          className="w-full rounded-[2px] border border-ivory/15 bg-chocolate px-4 py-3 pr-11 text-center text-ivory outline-none focus:border-gold"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-ivory/40 hover:text-ivory"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <button type="button" onClick={handleLogin} disabled={busy} className="btn btn-gold btn-sheen mt-4 w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
      </button>

      {error && <p className="mt-3 text-[12px] text-maroon">{error}</p>}
      <a href="/" className="mt-6 inline-block text-[12px] text-ivory/40 hover:text-gold">
        ← Back to website
      </a>
    </div>
  );
}

function PinLogin({ onUnlocked }: { onUnlocked: () => void }) {
  const [pin, setPin] = useState('');
  const [wrong, setWrong] = useState(false);

  const tryUnlock = () => {
    if (pin === ADMIN_PIN) onUnlocked();
    else setWrong(true);
  };

  return (
    <div className="w-full max-w-xs text-center">
      <img src="/images/logo/logo-mark.png" alt="" aria-hidden="true" className="mx-auto h-16 w-16 object-contain" />
      <h1 className="mt-4 font-serif text-2xl text-ivory">Showroom Admin Portal</h1>
      <p className="mt-2 text-[13px] text-ivory/50">Enter the shop PIN to continue (Static Mode)</p>
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
        placeholder="PIN"
        className="mt-5 w-full rounded-[2px] border border-ivory/15 bg-chocolate px-4 py-3 text-center text-lg tracking-[0.4em] text-ivory outline-none focus:border-gold"
      />
      <button type="button" onClick={tryUnlock} className="btn btn-gold btn-sheen mt-4 w-full">
        Unlock
      </button>
      {wrong && <p className="mt-3 text-[12px] text-maroon">That PIN is incorrect</p>}
      <a href="/" className="mt-6 inline-block text-[12px] text-ivory/40 hover:text-gold">
        ← Back to website
      </a>
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

  // UI state
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending_whatsapp' | 'confirmed' | 'fulfilled'>('all');
  const [dirty, setDirty] = useState(false);
  const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'done' | 'error'>('idle');
  const [publishError, setPublishError] = useState('');
  const [testWebhookStatus, setTestWebhookStatus] = useState('');

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
    if (!isAdminConfigured) return;
    setPublishState('publishing');
    setPublishError('');
    try {
      await publishProducts(items, offer, originalIds);
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
      <div className="flex min-h-screen items-center justify-center bg-[#150a0a] px-4">
        {isAdminConfigured ? (
          <SupabaseLogin onUnlocked={() => setUnlocked(true)} />
        ) : (
          <PinLogin onUnlocked={() => setUnlocked(true)} />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#150a0a] text-ivory">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 shrink-0 border-r border-gold/15 bg-chocolate/40 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-3 border-b border-gold/15 pb-5">
            <img src="/images/logo/logo-mark.png" alt="" className="h-10 w-10 object-contain" />
            <div>
              <h2 className="font-serif text-lg text-ivory">In Design</h2>
              <p className="text-[10px] tracking-widest text-gold uppercase">Admin Portal</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: metrics.confirmedOrders },
              { id: 'catalog', label: 'Catalog', icon: Package },
              { id: 'reviews', label: 'Reviews', icon: Star, badge: metrics.pendingReviewsCount },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
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
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[3px] text-[13px] transition-colors ${
                    active ? 'bg-gold/15 text-gold font-semibold border-l-2 border-gold' : 'text-ivory/60 hover:bg-night/40 hover:text-ivory'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {Boolean(item.badge) && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-gold/15 pt-4">
          <div className="flex items-center justify-between text-[12px] text-ivory/50">
            <span>Mode: {isAdminConfigured ? 'Connected' : 'Static'}</span>
            <button
              onClick={() => {
                adminSignOut();
                setUnlocked(false);
              }}
              className="text-gold hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-gold/15 bg-chocolate/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-2xl text-ivory capitalize">{tab}</h1>
            {dirty && (
              <span className="rounded bg-gold/10 px-2.5 py-1 text-[11px] text-gold border border-gold/30">
                Unpublished changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAdminConfigured && (
              <button
                onClick={handlePublish}
                disabled={publishState === 'publishing'}
                className="btn btn-gold btn-sheen text-[13px] px-4 py-2"
              >
                {publishState === 'publishing' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : publishState === 'done' ? (
                  'Published Live ✓'
                ) : (
                  'Publish Live'
                )}
              </button>
            )}
            <a href="/" target="_blank" className="btn btn-ghost-light text-[12px] px-3 py-2 flex items-center gap-1.5">
              <span>Visit Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {dataLoading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : (
            <>
              {/* ============ TAB 1: DASHBOARD ============ */}
              {tab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div
                      onClick={() => setTab('orders')}
                      className="cursor-pointer rounded-[4px] border border-gold/20 bg-chocolate/40 p-5 hover:border-gold/50 transition-colors"
                    >
                      <p className="text-[12px] font-semibold text-ivory/50 uppercase tracking-wider">Orders Needing Action</p>
                      <h3 className="mt-2 font-nums text-3xl font-bold text-gold">{metrics.confirmedOrders}</h3>
                      <p className="mt-1 text-[11px] text-ivory/40">{metrics.pendingOrders} pending WhatsApp send</p>
                    </div>

                    <div className="rounded-[4px] border border-gold/20 bg-chocolate/40 p-5">
                      <p className="text-[12px] font-semibold text-ivory/50 uppercase tracking-wider">Total Revenue</p>
                      <h3 className="mt-2 font-nums text-3xl font-bold text-ivory">{inr(metrics.totalRevenue)}</h3>
                      <p className="mt-1 text-[11px] text-ivory/40">From confirmed paid orders</p>
                    </div>

                    <div
                      onClick={() => setTab('catalog')}
                      className="cursor-pointer rounded-[4px] border border-gold/20 bg-chocolate/40 p-5 hover:border-gold/50 transition-colors"
                    >
                      <p className="text-[12px] font-semibold text-ivory/50 uppercase tracking-wider">Stock Alerts</p>
                      <h3 className="mt-2 font-nums text-3xl font-bold text-maroon">{metrics.lowStockCount + metrics.outStockCount}</h3>
                      <p className="mt-1 text-[11px] text-ivory/40">
                        {metrics.outStockCount} out of stock · {metrics.lowStockCount} low stock
                      </p>
                    </div>

                    <div
                      onClick={() => setTab('reviews')}
                      className="cursor-pointer rounded-[4px] border border-gold/20 bg-chocolate/40 p-5 hover:border-gold/50 transition-colors"
                    >
                      <p className="text-[12px] font-semibold text-ivory/50 uppercase tracking-wider">Pending Reviews</p>
                      <h3 className="mt-2 font-nums text-3xl font-bold text-gold">{metrics.pendingReviewsCount}</h3>
                      <p className="mt-1 text-[11px] text-ivory/40">Awaiting moderation</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent Orders */}
                    <div className="rounded-[4px] border border-gold/15 bg-chocolate/30 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-serif text-lg text-ivory">Recent Orders</h3>
                        <button onClick={() => setTab('orders')} className="text-[12px] text-gold hover:underline">
                          View all
                        </button>
                      </div>
                      <div className="space-y-3">
                        {orders.slice(0, 5).map((o) => (
                          <div
                            key={o.id}
                            onClick={() => setSelectedOrder(o)}
                            className="flex cursor-pointer items-center justify-between border-b border-ivory/10 pb-3 hover:bg-night/30 p-2 rounded"
                          >
                            <div>
                              <p className="font-mono text-[13px] text-gold">{o.order_code}</p>
                              <p className="text-[12px] text-ivory/60">{o.customers?.name || 'Customer'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-nums text-[13px] text-ivory">{inr(o.total)}</p>
                              <span className="text-[10px] uppercase text-ivory/40">{o.order_status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pending Reviews */}
                    <div className="rounded-[4px] border border-gold/15 bg-chocolate/30 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-serif text-lg text-ivory">Reviews to Moderate</h3>
                        <button onClick={() => setTab('reviews')} className="text-[12px] text-gold hover:underline">
                          View queue
                        </button>
                      </div>
                      <div className="space-y-3">
                        {liveReviews
                          .filter((r) => r.status === 'pending')
                          .slice(0, 4)
                          .map((r) => (
                            <div key={r.id} className="border-b border-ivory/10 pb-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[13px] font-semibold text-ivory">{r.name}</span>
                                <div className="flex text-gold">
                                  {Array.from({ length: r.rating }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-current" />
                                  ))}
                                </div>
                              </div>
                              <p className="mt-1 text-[12px] text-ivory/60 line-clamp-2">{r.text}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============ TAB 2: ORDERS ============ */}
              {tab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by Order ID, Name, or Phone..."
                        className="w-full rounded-[2px] border border-ivory/15 bg-night/50 py-2 pl-9 pr-4 text-[13px] text-ivory outline-none focus:border-gold"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value as any)}
                        className="rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2 text-[12px] text-ivory outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending_whatsapp">Pending WhatsApp</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="fulfilled">Fulfilled</option>
                      </select>

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
                        className="btn btn-ghost-light text-[12px] px-3 py-2 flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="overflow-x-auto rounded-[4px] border border-gold/15 bg-chocolate/30">
                    <table className="w-full text-left text-[13px]">
                      <thead className="border-b border-gold/15 bg-night/40 text-[11px] text-ivory/50 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Payment</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ivory/10">
                        {filteredOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-night/30 transition-colors">
                            <td className="p-3 font-mono text-gold">{o.order_code}</td>
                            <td className="p-3">{o.customers?.name || 'Walk-in'}</td>
                            <td className="p-3 text-ivory/50">
                              {new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="p-3 font-nums text-gold">{inr(o.total)}</td>
                            <td className="p-3">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  o.paid || o.payment_status === 'paid'
                                    ? 'bg-green-900/40 text-green-400'
                                    : 'bg-yellow-900/40 text-yellow-400'
                                }`}
                              >
                                {o.paid ? 'Paid' : o.payment_status}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-[11px] text-ivory/70 capitalize">{o.order_status.replace('_', ' ')}</span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="text-[12px] text-gold hover:underline"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============ TAB 3: CATALOG ============ */}
              {tab === 'catalog' && (
                <div className="space-y-6">
                  {/* Offer Banner Control */}
                  <div className="rounded-[4px] border border-gold/25 bg-chocolate/40 p-4">
                    <h3 className="font-serif text-lg text-ivory">Sitewide Offer Banner</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <input
                        value={offer.headline}
                        onChange={(e) => {
                          setOffer((o) => ({ ...o, headline: e.target.value }));
                          setDirty(true);
                        }}
                        placeholder="Offer Headline (e.g. FESTIVAL SPECIAL)"
                        className="rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory"
                      />
                      <input
                        value={offer.detail}
                        onChange={(e) => {
                          setOffer((o) => ({ ...o, detail: e.target.value }));
                          setDirty(true);
                        }}
                        placeholder="Offer Details (e.g. 15% off on 20+ metres)"
                        className="rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory"
                      />
                      <button
                        onClick={() => {
                          setOffer((o) => ({ ...o, active: !o.active }));
                          setDirty(true);
                        }}
                        className={`rounded font-semibold text-[12px] uppercase ${
                          offer.active ? 'bg-gold text-night' : 'bg-night/60 text-ivory/50 border border-ivory/20'
                        }`}
                      >
                        {offer.active ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search fabrics..."
                      className="rounded border border-ivory/15 bg-night/50 px-3 py-2 text-[13px] text-ivory w-64"
                    />
                    <button
                      onClick={() => {
                        const newItem = blankItem();
                        setItems((prev) => [newItem, ...prev]);
                        setOpenId(newItem.id);
                        setDirty(true);
                      }}
                      className="btn btn-gold btn-sheen text-[12px] px-3 py-2 flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Fabric</span>
                    </button>
                  </div>

                  {/* Fabrics List */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((item) => (
                      <div key={item.id} className="rounded border border-gold/15 bg-chocolate/30 p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="" className="h-16 w-16 rounded object-cover border border-gold/20" />
                          <div className="flex-1 min-w-0">
                            <input
                              value={item.name}
                              onChange={(e) => patchFabric(item.id, { name: e.target.value })}
                              className="w-full bg-transparent font-serif text-base text-ivory font-semibold outline-none focus:border-b focus:border-gold"
                            />
                            <p className="text-[11px] text-gold">{item.category}</p>
                          </div>
                          <button
                            type="button"
                            title="Delete fabric"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                                setItems((prev) => prev.filter((i) => i.id !== item.id));
                                setDirty(true);
                              }
                            }}
                            className="p-1.5 text-ivory/40 hover:text-maroon transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[12px]">
                          <div>
                            <span className="text-ivory/40">Price/m: </span>
                            <input
                              type="number"
                              value={item.pricePerMetre}
                              onChange={(e) => patchFabric(item.id, { pricePerMetre: Number(e.target.value) })}
                              className="w-20 rounded border border-ivory/15 bg-night/50 px-2 py-1 text-ivory"
                            />
                          </div>
                          <div>
                            <span className="text-ivory/40">Stock: </span>
                            <select
                              value={item.stock}
                              onChange={(e) => patchFabric(item.id, { stock: e.target.value as Stock })}
                              className="rounded border border-ivory/15 bg-night/50 px-2 py-1 text-ivory"
                            >
                              <option value="in">In Stock</option>
                              <option value="low">Low Stock</option>
                              <option value="out">Out of Stock</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============ TAB 4: REVIEWS ============ */}
              {tab === 'reviews' && (
                <div className="space-y-6">
                  <h3 className="font-serif text-lg text-ivory">Customer Reviews Queue</h3>
                  <div className="space-y-3">
                    {liveReviews.map((rev) => (
                      <div key={rev.id} className="flex items-center justify-between rounded border border-gold/15 bg-chocolate/30 p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ivory">{rev.name}</span>
                            <span className="text-[11px] text-ivory/40">({rev.city})</span>
                            <span className="text-gold flex">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-current" />
                              ))}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] text-ivory/70">{rev.text}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {rev.status !== 'published' && (
                            <button
                              onClick={() => handleToggleReview(rev.id, 'published')}
                              className="btn btn-gold text-[11px] px-3 py-1"
                            >
                              Publish
                            </button>
                          )}
                          {rev.status !== 'private' && (
                            <button
                              onClick={() => handleToggleReview(rev.id, 'private')}
                              className="btn btn-ghost-light text-[11px] px-3 py-1"
                            >
                              Keep Private
                            </button>
                          )}
                          <button onClick={() => handleDeleteReviewRow(rev.id)} className="text-maroon p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============ TAB 5: CUSTOMERS ============ */}
              {tab === 'customers' && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg text-ivory">Customer Registry</h3>
                  <p className="text-[12px] text-ivory/50">
                    Synced automatically from Supabase & Google Sheets (`IDF_CustDetails`).
                  </p>
                  <div className="rounded border border-gold/15 bg-chocolate/30 p-4">
                    <p className="text-center text-[13px] text-ivory/60">
                      Open your connected <strong>IDF_CustDetails</strong> Google Sheet to sort, filter, and view customer records live.
                    </p>
                  </div>
                </div>
              )}

              {/* ============ TAB 6: PAYMENTS ============ */}
              {tab === 'payments' && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg text-ivory">Payment Log</h3>
                  <div className="rounded border border-gold/15 bg-chocolate/30 p-4">
                    <p className="text-[13px] text-ivory/70">
                      UPI QR payments are verified directly by showroom staff. Gateway payment features will populate here once Razorpay integration is activated.
                    </p>
                  </div>
                </div>
              )}

              {/* ============ TAB 7: SETTINGS ============ */}
              {tab === 'settings' && (
                <div className="space-y-6">
                  <div className="rounded border border-gold/15 bg-chocolate/30 p-5 space-y-4">
                    <h3 className="font-serif text-lg text-ivory">Shipping & Wholesale Rules</h3>
                    <div className="grid grid-cols-2 gap-4 text-[13px]">
                      <div>
                        <span className="text-ivory/50">Free Shipping Threshold:</span>
                        <p className="font-bold text-gold">{inr(ORDER.freeShippingAbove)}</p>
                      </div>
                      <div>
                        <span className="text-ivory/50">Flat Shipping Fee:</span>
                        <p className="font-bold text-ivory">{inr(ORDER.shippingFlat)}</p>
                      </div>
                      <div>
                        <span className="text-ivory/50">Wholesale Min Quantity:</span>
                        <p className="font-bold text-gold">{ORDER.wholesaleMinMetres} metres</p>
                      </div>
                      <div>
                        <span className="text-ivory/50">Wholesale Discount:</span>
                        <p className="font-bold text-gold">{ORDER.wholesaleDiscount * 100}% off</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded border border-gold/15 bg-chocolate/30 p-5 space-y-4">
                    <h3 className="font-serif text-lg text-ivory">Showroom Business Details</h3>
                    <p className="text-[13px] text-ivory/70">{BUSINESS.name} · {BUSINESS.city}</p>
                    <p className="text-[12px] text-ivory/50">{BUSINESS.addressLine1}, {BUSINESS.addressLine2}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded border border-gold/20 bg-chocolate p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h3 className="font-serif text-xl text-ivory">Order {selectedOrder.order_code}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-ivory/50 hover:text-ivory">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-[13px]">
              <p><strong>Customer:</strong> {selectedOrder.customers?.name || 'Walk-in'}</p>
              <p><strong>Phone:</strong> {selectedOrder.customers?.phone}</p>
              <p><strong>Address:</strong> {selectedOrder.address}, {selectedOrder.city} - {selectedOrder.pincode}</p>
              <p><strong>Total:</strong> <span className="text-gold font-bold">{inr(selectedOrder.total)}</span></p>
              <p><strong>Status:</strong> <span className="capitalize">{selectedOrder.order_status}</span></p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gold/15">
              {selectedOrder.order_status !== 'confirmed' && (
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'confirmed')}
                  className="btn btn-gold text-[12px] flex-1 py-2"
                >
                  Mark Confirmed
                </button>
              )}
              {selectedOrder.order_status !== 'fulfilled' && (
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'fulfilled')}
                  className="btn btn-gold text-[12px] flex-1 py-2"
                >
                  Mark Fulfilled
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
