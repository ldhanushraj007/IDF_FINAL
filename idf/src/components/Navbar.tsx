import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, ListOrdered, LogOut, Menu, ShoppingBag, User, X, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { NAV_LINKS, WA_DEFAULT } from '../lib/constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Wordmark from './Wordmark';

function initial(label: string) {
  const c = label.trim().charAt(0).toUpperCase();
  return c || '•';
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const { items, setOpen: setCartOpen } = useCart();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const count = items.reduce((s, i) => s + i.metres, 0);

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

  const accountLabel = profile?.name || user?.email || 'Account';

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-[#1a1a1a] bg-surface transition-shadow ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="flex items-center px-margin-page h-[64px] gap-0">

        {/* Row index */}
        <span className="font-mono text-[10px] text-secondary/50 w-8 shrink-0 hidden md:block">01</span>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 mr-6">
          <img
            src="/images/logo/logo-mark.png"
            alt=""
            aria-hidden="true"
            className="h-9 w-9 object-contain"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div>
            <div className="font-serif text-[18px] tracking-[0.06em] text-primary uppercase leading-none">In Design</div>
            <div className="font-label-caps text-[8px] tracking-[0.25em] text-brand-gold uppercase mt-0.5">Luxury Fabrics</div>
          </div>
        </Link>

        {/* Separator */}
        <div className="hidden md:block h-8 w-px bg-[#1a1a1a]/20 mr-8 shrink-0" />

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-7 flex-1" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-label-caps text-[11px] tracking-[0.12em] uppercase text-secondary hover:text-primary transition-colors duration-200 whitespace-nowrap"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          {/* WhatsApp */}
          <a
            href={WA_DEFAULT}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 border border-brand-gold text-brand-gold px-4 py-2 font-label-caps text-[11px] tracking-[0.1em] hover:bg-brand-gold hover:text-white transition-colors shrink-0"
          >
            WHATSAPP US
            <MessageCircle className="h-3.5 w-3.5" />
          </a>

          {/* Account */}
          <div className="relative" ref={accountRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-label="Your account"
                className="flex items-center justify-center text-secondary hover:text-primary transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-gold text-[12px] font-semibold text-brand-gold">
                  {initial(accountLabel)}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                aria-label="Sign in or sign up"
                className="flex items-center justify-center text-secondary hover:text-primary transition-colors"
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
              </button>
            )}

            <AnimatePresence>
              {accountOpen && user && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-2 w-56 overflow-hidden border border-[#1a1a1a] bg-surface shadow-xl z-[70]"
                >
                  <div className="border-b border-[#1a1a1a]/10 px-4 py-3">
                    <p className="truncate text-[13px] font-medium text-primary">{accountLabel}</p>
                    {profile?.email && <p className="truncate text-[11px] text-secondary">{profile.email}</p>}
                  </div>
                  <Link
                    to="/account"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-secondary hover:bg-primary/5 hover:text-primary"
                  >
                    <ListOrdered className="h-4 w-4" />
                    My Orders
                  </Link>
                  <Link
                    to="/account#wishlist"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-secondary hover:bg-primary/5 hover:text-primary"
                  >
                    <Heart className="h-4 w-4" />
                    Wishlist
                  </Link>
                  <button
                    type="button"
                    onClick={() => { signOut(); setAccountOpen(false); }}
                    className="flex w-full items-center gap-2.5 border-t border-[#1a1a1a]/10 px-4 py-3 text-left text-[13px] text-secondary hover:bg-primary/5 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open order — ${count} metres`}
            className="relative flex items-center justify-center text-secondary hover:text-primary transition-colors"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-mono">
                {count}
              </span>
            )}
          </button>

          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center text-secondary md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-night xl:hidden"
          >
            <div className="flex shrink-0 items-center justify-between px-6 py-5">
              <Wordmark tone="light" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center text-ivory"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col px-6 py-4" aria-label="Mobile primary">
              <div className="border-b border-ivory/10 py-4">
                {user ? (
                  <div className="space-y-3">
                    <p className="text-[13px] text-ivory/70">Signed in as {accountLabel}</p>
                    <div className="flex gap-3">
                      <Link to="/account" onClick={() => setOpen(false)} className="btn btn-ghost-light flex-1 !py-2.5 !text-[11px]">My Account</Link>
                      <button type="button" onClick={() => { signOut(); setOpen(false); }} className="btn btn-ghost-light flex-1 !py-2.5 !text-[11px]">Sign Out</button>
                    </div>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)} className="btn btn-gold btn-sheen flex w-full items-center justify-center gap-2">
                    <User className="h-4 w-4" /> Sign In / Sign Up
                  </Link>
                )}
              </div>
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-ivory/10 py-4 font-serif text-[27px] text-ivory hover:text-gold sm:text-3xl"
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.a
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + NAV_LINKS.length * 0.06, duration: 0.4 }}
                href={WA_DEFAULT}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="btn btn-gold btn-sheen mt-7 w-full"
              >
                WhatsApp Us
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
