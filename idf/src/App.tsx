import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';

import { CartProvider } from './context/CartContext';
import { CatalogProvider } from './context/CatalogContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import Preloader from './components/Preloader';
import ScrollProgress from './components/ScrollProgress';
import OfferBar from './components/OfferBar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import CartDrawer from './components/CartDrawer';
import PendingOrderBanner from './components/PendingOrderBanner';
import HomePage from './pages/HomePage';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';

/**
 * Only the homepage ships in the main bundle — it's what every first-time
 * visitor sees. Everything else loads on demand, keeping the initial bundle
 * lean and the first-paint fast.
 */
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const VisitPage = lazy(() => import('./pages/VisitPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminPanel = lazy(() => import('./admin/AdminPanel'));

function RouteFallback() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1F0505]/10 border-t-[#1F0505]" />
    </div>
  );
}

/**
 * The shop editor lives behind the #/admin hash rather than a router path, so
 * it keeps working even on hosts with no SPA rewrite rule configured — it
 * never depends on the server sending index.html for an unknown path.
 */
function useIsAdminRoute() {
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash.startsWith('#/admin'));
  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash.startsWith('#/admin'));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return isAdmin;
}

import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Scrolls to top on every real page change (not on in-page hash jumps). */
function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      window.scrollTo(0, 0);
      prevPathname.current = pathname;
    }
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname]);
  return null;
}

function SiteChrome() {
  const { authModalOpen, closeAuthModal } = useAuth();
  const { pathname } = useLocation();
  const isStandalonePage = pathname === '/login' || pathname === '/checkout';

  return (
    <>
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-[#1F0505] focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-widest focus:text-white"
      >
        Skip to content
      </a>
      <Preloader />
      {!isStandalonePage && <ScrollProgress />}
      {!isStandalonePage && <OfferBar />}
      {!isStandalonePage && <Navbar />}
      <main id="main">
        <Suspense fallback={<RouteFallback />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Routes location={location} key={pathname}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/shop/:category" element={<ShopPage />} />
                <Route path="/shop/product/:id" element={<ProductPage />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/visit" element={<VisitPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                {/* Backward compat: old /product/:id → /shop/product/:id */}
                <Route path="/product/:id" element={<RedirectToShopProduct />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      {!isStandalonePage && <Footer />}
      {!isStandalonePage && <FloatingWhatsApp />}
      <CartDrawer />
      <PendingOrderBanner />
      <AuthModal open={authModalOpen} onClose={closeAuthModal} />
    </>
  );
}

/** Redirect old /product/:id URLs to /shop/product/:id for backward compat */
function RedirectToShopProduct() {
  const { pathname } = useLocation();
  const id = pathname.split('/product/')[1];
  return <Navigate to={`/shop/product/${id}`} replace />;
}

export default function App() {
  const isAdmin = useIsAdminRoute();

  if (isAdmin) {
    return (
      <MotionConfig reducedMotion="user">
        <Suspense fallback={<RouteFallback />}>
          <AdminPanel />
        </Suspense>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <CatalogProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <SiteChrome />
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </CatalogProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
