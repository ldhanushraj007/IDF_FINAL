import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
      }`}
    >
      {/* ── Top masthead strip ── */}
      <div
        className="w-full flex items-center justify-between px-4 sm:px-8 md:px-10 lg:px-12 py-2.5 border-b border-[#1F0505]/15"
      >
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-sans text-[9px] tracking-[0.2em] text-[#1F0505]/40 uppercase font-semibold hidden md:block mr-2">
            Est. 2009
          </span>
          <Link to="/" className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 text-left" aria-label="IN DESIGN — Home">
            <img
              src="/images/logo/logo-mark.png"
              alt=""
              aria-hidden="true"
              className="h-6 xs:h-7 sm:h-8 w-auto object-contain shrink-0"
            />
            <div className="text-left shrink-0">
              <div
                className="font-serif text-[14px] xs:text-[16px] sm:text-[20px] md:text-[22px] tracking-[0.1em] sm:tracking-[0.14em] text-[#1F0505] uppercase leading-none font-medium"
              >
                In Design
              </div>
              <div className="font-sans text-[6px] sm:text-[7px] tracking-[0.25em] sm:tracking-[0.3em] text-[#1F0505]/50 uppercase mt-0.5 font-semibold">
                Luxury Fabrics
              </div>
            </div>
          </Link>
        </div>

        {/* Right: Actions & Menu */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          <span className="font-sans text-[9px] tracking-[0.2em] text-[#1F0505]/40 uppercase font-medium hidden xl:inline-block">
            {EDITION_NUM}
          </span>
          {/* Right icons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 pl-2 sm:pl-3 border-l border-[#1F0505]/15">
            {/* Account */}
            <div className="relative" ref={accountRef}>
              {user ? (
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-label="Your account"
                  className="flex items-center justify-center text-[#1F0505]/70 hover:text-[#1F0505] transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#1F0505]/30 text-[10px] font-semibold text-[#1F0505] bg-[#FFE6E9]/30">
                    {initial(accountLabel)}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  aria-label="Sign in"
                  className="flex items-center justify-center p-1.5 rounded-full text-[#1F0505]/70 hover:text-[#1F0505] hover:bg-[#FFE6E9]/40 transition-colors"
                >
                  <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </button>
              )}

              <AnimatePresence>
                {accountOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 w-56 overflow-hidden bg-white shadow-xl rounded-xl z-[70]"
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
              <Link to="/wishlist" aria-label="Wishlist" className="hidden md:flex items-center justify-center p-1.5 rounded-full text-[#1F0505]/70 hover:text-[#1F0505] hover:bg-[#FFE6E9]/40 transition-colors">
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </Link>
            )}

            {/* Cart */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping bag — ${count} items`}
              className="relative flex items-center justify-center p-1.5 rounded-full text-[#1F0505]/70 hover:text-[#1F0505] hover:bg-[#FFE6E9]/40 transition-colors"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#1F0505] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex items-center justify-center p-1.5 rounded-full text-[#1F0505]/70 hover:text-[#1F0505] hover:bg-[#FFE6E9]/40 lg:hidden ml-1"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop Curved Floating Navigation Bar ── */}
      <div className="hidden lg:block px-4 py-2 bg-white/60 backdrop-blur-md">
        <nav
          className="mx-auto flex items-center justify-between max-w-[1200px] bg-white/90 border border-[#1F0505]/20 rounded-full px-3 py-1.5 shadow-sm transition-all"
          aria-label="Primary"
        >
          {/* WhatsApp left */}
          <a
            href={WA_DEFAULT}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-1.5 rounded-full font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-[#1F0505]/60 hover:bg-[#FFE6E9] hover:text-[#1F0505] transition-all shrink-0"
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-[#1F0505]" />
            WhatsApp
          </a>

          {/* Nav items — rounded pills */}
          <div className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.href}
                to={l.href}
                end={l.href === '/'}
                className={({ isActive }) =>
                  `relative flex items-center justify-center px-4 py-1.5 rounded-full font-sans text-[10px] font-bold tracking-[0.18em] uppercase transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1F0505] text-white shadow-sm'
                      : 'text-[#1F0505]/70 hover:bg-[#FFE6E9]/60 hover:text-[#1F0505]'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right label */}
          <span
            className="px-4 py-1 font-sans text-[9px] tracking-[0.2em] text-[#1F0505]/40 uppercase font-bold shrink-0 hidden xl:inline-block"
          >
            Bengaluru, India
          </span>
        </nav>
      </div>

      {/* ── Mobile Drawer (Portaled to document.body for 100% solid scroll isolation) ── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[9999] flex justify-end">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              />

              {/* Floating Curved Sheet */}
              <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col overflow-y-auto p-5 border-l border-[#1F0505]/20 z-10"
              >
                {/* Mobile drawer header */}
                <div className="flex shrink-0 items-center justify-between pb-4 border-b border-[#1F0505]/15">
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
                      <div className="font-sans text-[8px] tracking-[0.32em] text-[#1F0505]/45 uppercase mt-0.5 font-semibold">
                        Luxury Fabrics
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#1F0505]/70 hover:text-[#1F0505] bg-[#1F0505]/5 hover:bg-[#FFE6E9] transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile nav content */}
                <div className="flex flex-col flex-1 py-4 space-y-4">
                  {/* Account strip */}
                  <div className="p-2 bg-[#FAFAFA] rounded-2xl border border-[#1F0505]/10">
                    {user ? (
                      <div className="flex gap-2">
                        <Link to="/account" onClick={() => setOpen(false)} className="rounded-xl bg-white border border-[#1F0505]/20 px-4 py-2.5 text-[11px] font-bold tracking-[0.14em] uppercase text-[#1F0505] flex-1 text-center shadow-sm hover:bg-[#FFE6E9]/40 transition-all">
                          My Account
                        </Link>
                        <button type="button" onClick={() => { signOut(); setOpen(false); }} className="rounded-xl bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 text-[11px] font-bold tracking-[0.14em] uppercase flex-1 hover:bg-red-100 transition-all">
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <Link to="/login" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-[#1F0505] px-4 py-3 text-[11px] font-bold tracking-[0.18em] uppercase text-white w-full shadow-md hover:bg-[#3a0a0a] transition-all">
                        <User className="h-4 w-4" /> Sign In / Register
                      </Link>
                    )}
                  </div>

                  {/* Nav links — curved pill rows */}
                  <nav className="flex flex-col gap-1.5 flex-1" aria-label="Mobile primary">
                    {NAV_LINKS.map((l, i) => (
                      <motion.div
                        key={l.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <NavLink
                          to={l.href}
                          end={l.href === '/'}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center justify-between px-5 py-3 rounded-2xl font-serif text-[19px] transition-all duration-200 ${
                              isActive
                                ? 'bg-[#1F0505] text-white shadow-md'
                                : 'text-[#1F0505] hover:bg-[#FFE6E9]/60'
                            }`
                          }
                        >
                          <span>{l.label}</span>
                          <span className="font-sans text-[10px] tracking-[0.18em] opacity-50 font-medium">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        </NavLink>
                      </motion.div>
                    ))}
                  </nav>

                  {/* Footer section */}
                  <div className="pt-4 border-t border-[#1F0505]/10 space-y-3 mt-auto">
                    <a
                      href={WA_DEFAULT}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-full border border-[#1F0505]/30 bg-[#FFE6E9]/40 px-4 py-3 text-[11px] font-bold tracking-[0.18em] uppercase text-[#1F0505] w-full hover:bg-[#1F0505] hover:text-white transition-all shadow-sm"
                    >
                      <MessageCircle className="h-4 w-4 text-[#1F0505]" /> WhatsApp Us
                    </a>
                    <p className="text-center text-[9px] tracking-[0.2em] text-[#1F0505]/40 uppercase font-semibold">
                      Bengaluru, India — Est. 2009
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
}
