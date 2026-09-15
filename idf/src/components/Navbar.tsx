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
      <div className="w-full bg-[#FAF7F5] border-b border-[#1F1916]/10 px-6 py-4 flex items-center justify-between">
        {/* Left: EST. 2009 */}
        <span className="font-sans text-[11px] tracking-[0.25em] text-[#1F1916]/60 uppercase font-semibold hidden sm:inline-block">
          EST. 2009
        </span>

        {/* Center: Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 mx-auto sm:mx-0 group">
          <img
            src="/images/logo/logo-mark.png"
            alt="IN DESIGN Luxury Fabrics Logo"
            className="h-9 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col text-left">
            <span className="font-serif text-[22px] sm:text-[26px] tracking-[0.18em] text-[#1F1916] uppercase font-light leading-none">
              IN DESIGN
            </span>
            <span className="font-sans text-[8px] sm:text-[9px] tracking-[0.35em] text-[#1F1916]/50 uppercase mt-1 font-semibold">
              LUXURY FABRICS
            </span>
          </div>
        </Link>

        {/* Right: BENGALURU, INDIA */}
        <span className="font-sans text-[11px] tracking-[0.25em] text-[#1F1916]/60 uppercase font-semibold hidden sm:inline-block">
          BENGALURU, INDIA
        </span>
      </div>

      {/* ── Main Navigation Bar ── */}
      <nav
        className="w-full bg-[#F3EEEA] border-b border-[#1F1916]/10 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs"
        aria-label="Primary navigation"
      >
        {/* Left: WhatsApp */}
        <a
          href={WA_DEFAULT}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-[#1F1916]/80 hover:text-[#1F1916] transition-colors"
        >
          <MessageCircle className="h-4 w-4 text-[#1F1916]" />
          <span>WHATSAPP</span>
        </a>

        {/* Center: Page Links */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.href}
              to={l.href}
              end={l.href === '/'}
              className={({ isActive }) =>
                `font-sans text-[11px] tracking-[0.18em] uppercase transition-colors whitespace-nowrap ${
                  isActive
                    ? 'font-bold text-[#1F1916] border-b-2 border-[#1F1916] pb-0.5'
                    : 'font-medium text-[#1F1916]/70 hover:text-[#1F1916]'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right: Search (Shop only), Wishlist, Profile, Cart & Mobile Menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Show Search icon ONLY in Shop section */}
          {location.pathname.startsWith('/shop') && (
            <Link to="/shop" aria-label="Search" className="text-[#1F1916]/80 hover:text-[#1F1916] transition-colors">
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>
          )}

          {enabled && (
            <Link to="/wishlist" aria-label="Wishlist" className="text-[#1F1916]/80 hover:text-[#1F1916] transition-colors">
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>
          )}

          {/* Profile / Sign In Link */}
          {user ? (
            <Link to="/account" aria-label="Account Profile" className="flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1F1916]/80 hover:text-[#1F1916] transition-colors">
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              <span className="hidden md:inline">ACCOUNT</span>
            </Link>
          ) : (
            <Link to="/login" aria-label="Sign In or Sign Up" className="flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1F1916]/90 hover:text-[#1F1916] transition-colors border border-[#1F1916]/20 px-3 py-1 rounded-full hover:bg-[#1F1916] hover:text-white">
              <User className="h-[15px] w-[15px]" strokeWidth={1.5} />
              <span>SIGN IN / SIGN UP</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Shopping bag — ${count} items`}
            className="relative text-[#1F1916]/80 hover:text-[#1F1916] transition-colors"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#1F1916] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="lg:hidden text-[#1F1916]/80 hover:text-[#1F1916] ml-1"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

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
