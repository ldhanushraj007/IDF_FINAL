import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, ListOrdered, LogOut, Menu, ShoppingBag, User, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NAV_LINKS, WA_DEFAULT } from '../lib/constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Wordmark from './Wordmark';

/** First letter of the customer's name/email, for the little account badge. */
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
  const { enabled, user, profile, signOut, requestSignIn } = useAuth();
  const count = items.reduce((s, i) => s + i.metres, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const accountLabel = profile?.name || user?.email || user?.phone || 'Account';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-lux ${
        scrolled
          ? 'border-b border-gold/20 bg-night/90 py-2.5 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent py-4 sm:py-5'
      }`}
    >
      <div className="container-lux flex items-center justify-between gap-3">
        <a href="/#top" aria-label="In Design Luxury Fabrics — back to top" className="shrink-0">
          <Wordmark tone="light" />
        </a>

        <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative pb-1 text-[12px] font-medium uppercase tracking-[0.18em] text-ivory/80 transition-colors duration-300 hover:text-ivory"
            >
              {l.label}
              <span
                className="absolute bottom-0 left-0 h-px w-0 bg-gold transition-all duration-500 ease-lux group-hover:w-full"
                aria-hidden="true"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href={WA_DEFAULT}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold btn-sheen hidden !px-5 !py-2.5 !text-[11px] xl:inline-flex"
          >
            WhatsApp Us
          </a>

          {/* Account — signed out: opens the sign-in modal. Signed in: initial + dropdown. */}
          {enabled && (
            <div className="relative" ref={accountRef}>
              {user ? (
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-label="Your account"
                  className="flex h-11 w-11 items-center justify-center text-ivory transition-colors hover:text-gold"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/50 text-[12px] font-semibold text-gold">
                    {initial(accountLabel)}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => requestSignIn()}
                  aria-label="Sign in or sign up"
                  className="flex h-11 w-11 items-center justify-center text-ivory transition-colors hover:text-gold"
                >
                  <User className="h-5 w-5" strokeWidth={1.7} />
                </button>
              )}

              <AnimatePresence>
                {accountOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-[3px] border border-gold/20 bg-chocolate shadow-xl"
                  >
                    <div className="border-b border-ivory/10 px-4 py-3">
                      <p className="truncate text-[13px] font-medium text-ivory">{accountLabel}</p>
                      {profile?.email && <p className="truncate text-[11px] text-ivory/45">{profile.email}</p>}
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-ivory/80 hover:bg-ivory/5 hover:text-gold"
                    >
                      <ListOrdered className="h-4 w-4" />
                      My Orders
                    </Link>
                    <Link
                      to="/account#wishlist"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-ivory/80 hover:bg-ivory/5 hover:text-gold"
                    >
                      <Heart className="h-4 w-4" />
                      Wishlist
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setAccountOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 border-t border-ivory/10 px-4 py-3 text-left text-[13px] text-ivory/60 hover:bg-ivory/5 hover:text-maroon"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open order — ${count} metres`}
            className="relative flex h-11 w-11 items-center justify-center text-ivory transition-colors hover:text-gold"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.7} />
            {count > 0 && (
              <span className="font-nums absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-night">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center text-ivory xl:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-night xl:hidden"
          >
            <div className="container-lux flex shrink-0 items-center justify-between py-4">
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
            <nav className="container-lux flex flex-1 flex-col py-4" aria-label="Mobile primary">
              {enabled && (
                <div className="border-b border-ivory/10 py-4">
                  {user ? (
                    <div className="space-y-3">
                      <p className="text-[13px] text-ivory/70">Signed in as {accountLabel}</p>
                      <div className="flex gap-3">
                        <Link
                          to="/account"
                          onClick={() => setOpen(false)}
                          className="btn btn-ghost-light flex-1 !py-2.5 !text-[11px]"
                        >
                          My Account
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            signOut();
                            setOpen(false);
                          }}
                          className="btn btn-ghost-light flex-1 !py-2.5 !text-[11px]"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        requestSignIn();
                      }}
                      className="btn btn-gold btn-sheen w-full"
                    >
                      <User className="h-4 w-4" />
                      Sign In / Sign Up
                    </button>
                  )}
                </div>
              )}
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-ivory/10 py-4 font-serif text-[27px] text-ivory transition-colors hover:text-gold sm:text-3xl"
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.a
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + NAV_LINKS.length * 0.06, duration: 0.5 }}
                href={WA_DEFAULT}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="btn btn-gold btn-sheen mt-7 w-full"
              >
                WhatsApp Us
              </motion.a>
              <p className="py-7 text-[10px] uppercase tracking-[0.36em] text-ivory/40">
                Commercial Street · Bengaluru
              </p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}
