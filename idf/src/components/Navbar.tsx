import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LogOut, Menu, Search, ShoppingBag, User, X, MessageCircle } from 'lucide-react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { NAV_LINKS, WA_DEFAULT } from '../lib/constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function initial(label: string) {
  const c = label.trim().charAt(0).toUpperCase();
  return c || '•';
}

// Today's date in editorial newspaper format
const EDITION_DATE = new Date().toLocaleDateString('en-IN', {
  day: '2-digit', month: 'long', year: 'numeric'
});
const EDITION_NUM = `Vol. IV — Est. 2009`;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const { count, setOpen: setCartOpen } = useCart();
  const { user, profile, signOut, enabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const accountLabel = profile?.name || user?.email || 'Account';

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'bg-white/97 backdrop-blur-md' : 'bg-white'
      }`}
    >
      {/* ── Top masthead strip ── */}
      <div
        className="w-full flex items-center justify-between px-5 md:px-10 lg:px-12 py-2"
        style={{ borderBottom: '1px solid #1F0505' }}
      >
        <span className="font-sans text-[9px] tracking-[0.2em] text-[#1F0505]/40 uppercase font-medium hidden sm:block">
          {EDITION_DATE}
        </span>
        <Link to="/" className="flex-1 flex justify-center" aria-label="IN DESIGN — Home">
          <div className="flex items-center gap-3">
            {/* Logo mark — gold face silhouette */}
            <img
              src="/images/logo/logo-mark.png"
              alt=""
              aria-hidden="true"
              className="h-9 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 0px transparent)' }}
            />
            {/* Wordmark */}
            <div className="text-left">
              <div
                className="font-serif text-[20px] md:text-[24px] tracking-[0.12em] text-[#1F0505] uppercase leading-none font-medium"
                style={{ letterSpacing: '0.16em' }}
              >
                In Design
              </div>
              <div className="font-sans text-[7px] tracking-[0.34em] text-[#1F0505]/45 uppercase mt-0.5 font-semibold">
                Luxury Fabrics
              </div>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3.5 shrink-0">
          <span className="font-sans text-[9px] tracking-[0.2em] text-[#1F0505]/40 uppercase font-medium hidden sm:block">
            {EDITION_NUM}
          </span>
          {/* Right icons */}
          <div className="flex items-center gap-3" style={{ borderLeft: '1px solid rgba(31,5,5,0.15)', paddingLeft: '12px' }}>
            {/* Account */}
            <div className="relative" ref={accountRef}>
              {user ? (
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-label="Your account"
                  className="flex items-center justify-center text-[#1F0505]/50 hover:text-[#1F0505] transition-colors"
                >
                  <span className="flex h-6 w-6 items-center justify-center border border-[#1F0505]/30 text-[10px] font-semibold text-[#1F0505]">
                    {initial(accountLabel)}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  aria-label="Sign in"
                  className="flex items-center justify-center text-[#1F0505]/50 hover:text-[#1F0505] transition-colors"
                >
                  <User className="h-[16px] w-[16px]" strokeWidth={1.5} />
                </button>
              )}

              <AnimatePresence>
                {accountOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 w-56 overflow-hidden bg-white shadow-xl z-[70]"
                    style={{ border: '1px solid #1F0505' }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(31,5,5,0.1)' }}>
                      <p className="truncate text-[13px] font-medium text-[#1F0505]">{accountLabel}</p>
                      {profile?.email && <p className="truncate text-[11px] text-[#1F0505]/40">{profile.email}</p>}
                    </div>
                    <Link to="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-[12px] text-[#1F0505]/60 hover:bg-[#FFE6E9]/30 hover:text-[#1F0505]">
                      My Orders
                    </Link>
                    <Link to="/wishlist" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-[12px] text-[#1F0505]/60 hover:bg-[#FFE6E9]/30 hover:text-[#1F0505]">
                      Wishlist
                    </Link>
                    <button
                      type="button"
                      onClick={() => { signOut(); setAccountOpen(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[12px] text-[#1F0505]/60 hover:bg-[#FFE6E9]/30 hover:text-red-600"
                      style={{ borderTop: '1px solid rgba(31,5,5,0.08)' }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist */}
            {enabled && (
              <Link to="/wishlist" aria-label="Wishlist" className="hidden md:flex items-center justify-center text-[#1F0505]/50 hover:text-[#1F0505] transition-colors">
                <Heart className="h-[16px] w-[16px]" strokeWidth={1.5} />
              </Link>
            )}

            {/* Cart */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping bag — ${count} items`}
              className="relative flex items-center justify-center text-[#1F0505]/50 hover:text-[#1F0505] transition-colors"
            >
              <ShoppingBag className="h-[16px] w-[16px]" strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#1F0505] text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>

            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex items-center justify-center text-[#1F0505]/60 hover:text-[#1F0505] lg:hidden"
              style={{ borderLeft: '1px solid rgba(31,5,5,0.15)', paddingLeft: '12px', marginLeft: '4px' }}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop Navigation Bar ── */}
      <nav
        className="hidden lg:flex items-stretch w-full"
        aria-label="Primary"
        style={{ borderBottom: '1px solid #1F0505' }}
      >
        {/* WhatsApp left flush */}
        <a
          href={WA_DEFAULT}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-5 font-sans text-[9px] font-semibold tracking-[0.18em] uppercase text-[#1F0505]/40 hover:bg-[#FFE6E9]/40 hover:text-[#1F0505] transition-colors shrink-0"
          style={{ borderRight: '1px solid #1F0505' }}
        >
          <MessageCircle className="h-3 w-3 mr-1.5" />
          WhatsApp
        </a>

        {/* Nav items — each separated by 1px vertical border */}
        <div className="flex items-stretch flex-1">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.href}
              to={l.href}
              end={l.href === '/'}
              className={({ isActive }) =>
                `relative flex items-center justify-center px-5 py-2.5 font-sans text-[10px] font-semibold tracking-[0.18em] uppercase transition-colors duration-150 whitespace-nowrap group ${
                  isActive
                    ? 'bg-[#1F0505] text-white'
                    : 'text-[#1F0505]/60 hover:bg-[#FFE6E9]/40 hover:text-[#1F0505]'
                }`
              }
              style={{ borderRight: '1px solid #1F0505' }}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right label */}
        <span
          className="flex items-center px-5 font-sans text-[9px] tracking-[0.2em] text-[#1F0505]/30 uppercase font-medium shrink-0 hidden xl:flex"
          style={{ borderLeft: '1px solid #1F0505' }}
        >
          Bengaluru, India
        </span>
      </nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-white"
            style={{ borderLeft: '2px solid #1F0505' }}
          >
            {/* Mobile drawer header */}
            <div
              className="flex shrink-0 items-center justify-between px-6 py-4"
              style={{ borderBottom: '2px solid #1F0505' }}
            >
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3" aria-label="Home">
                <img
                  src="/images/logo/logo-mark.png"
                  alt=""
                  aria-hidden="true"
                  className="h-8 w-auto object-contain"
                />
                <div>
                  <div className="font-serif text-[17px] tracking-[0.14em] text-[#1F0505] uppercase leading-none font-medium">
                    In Design
                  </div>
                  <div className="font-sans text-[8px] tracking-[0.32em] text-[#1F0505]/40 uppercase mt-0.5">
                    Luxury Fabrics
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center text-[#1F0505]/60 hover:text-[#1F0505] border border-[#1F0505]/20 hover:border-[#1F0505] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile nav links */}
            <nav className="flex flex-col flex-1" aria-label="Mobile primary">
              {/* Account strip */}
              <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(31,5,5,0.12)' }}>
                {user ? (
                  <div className="flex gap-3">
                    <Link to="/account" onClick={() => setOpen(false)} className="border border-[#1F0505]/25 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1F0505] flex-1 text-center hover:bg-[#FFE6E9]/40 transition-colors">
                      My Account
                    </Link>
                    <button type="button" onClick={() => { signOut(); setOpen(false); }} className="border border-[#1F0505]/25 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1F0505] flex-1 hover:bg-red-50 transition-colors">
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 border border-[#1F0505] px-4 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#1F0505] w-full hover:bg-[#1F0505] hover:text-white transition-colors">
                    <User className="h-4 w-4" /> Sign In
                  </Link>
                )}
              </div>

              {/* Nav links */}
              {NAV_LINKS.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{ borderBottom: '1px solid rgba(31,5,5,0.1)' }}
                >
                  <Link
                    to={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-6 py-5 font-serif text-[24px] text-[#1F0505] hover:text-[#1F0505]/70 hover:bg-[#FFE6E9]/20 transition-colors"
                  >
                    {l.label}
                    <span className="font-sans text-[10px] tracking-[0.18em] text-[#1F0505]/30 font-medium">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </Link>
                </motion.div>
              ))}

              {/* Footer strip */}
              <div className="px-6 py-5 mt-auto" style={{ borderTop: '1px solid rgba(31,5,5,0.12)' }}>
                <a
                  href={WA_DEFAULT}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 border border-[#1F0505] px-4 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#1F0505] w-full hover:bg-[#1F0505] hover:text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp Us
                </a>
                <p className="text-center text-[9px] tracking-[0.18em] text-[#1F0505]/30 uppercase mt-4">
                  {EDITION_DATE} — {EDITION_NUM}
                </p>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
