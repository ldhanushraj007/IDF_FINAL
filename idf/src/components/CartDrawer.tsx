// CartDrawer — slide-out tray; checkout navigates to /checkout route
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ORDER, inr } from '../lib/constants';

export default function CartDrawer() {
  const { open, setOpen, items, subtotal, discount, shipping, total, isWholesale, setMetres, remove } =
    useCart();
  const navigate = useNavigate();

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[80] bg-night/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-[85] flex w-full max-w-md flex-col bg-chocolate shadow-2xl"
              role="dialog"
              aria-label="Your order"
            >
              <header className="flex items-center justify-between border-b border-gold/20 px-5 py-4">
                <h2 className="font-serif text-xl text-ivory">Your Order</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close cart"
                  className="flex h-10 w-10 items-center justify-center text-ivory/70 transition-colors hover:text-gold"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                  <ShoppingBag className="h-10 w-10 text-gold/40" strokeWidth={1.2} />
                  <p className="text-[14px] text-ivory/55">
                    Your order is empty. Browse the shop and add fabric by the metre.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="btn btn-ghost-light"
                  >
                    Continue Browsing
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    <ul className="space-y-4">
                      {items.map(({ item, metres, lineTotal }) => (
                        <li key={item.id} className="flex gap-3 border-b border-ivory/10 pb-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-24 w-20 shrink-0 rounded-[2px] object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-serif text-[15px] leading-snug text-ivory">
                              {item.name}
                            </p>
                            <p className="mt-1 text-[11px] text-ivory/45">
                              {inr(item.pricePerMetre)} / metre
                            </p>

                            <div className="mt-2.5 flex items-center gap-3">
                              <div className="flex items-center rounded-[2px] border border-ivory/15">
                                <button
                                  type="button"
                                  aria-label={`Reduce ${item.name}`}
                                  onClick={() =>
                                    setMetres(item.id, Math.max(item.minMetres, Number((metres - 0.5).toFixed(1))))
                                  }
                                  className="flex h-9 w-9 items-center justify-center text-ivory/70 hover:text-gold"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="min-w-[3.2rem] text-center text-[12px] text-ivory">
                                  {metres} m
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Add ${item.name}`}
                                  onClick={() => setMetres(item.id, Number((metres + 0.5).toFixed(1)))}
                                  className="flex h-9 w-9 items-center justify-center text-ivory/70 hover:text-gold"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => remove(item.id)}
                                aria-label={`Remove ${item.name}`}
                                className="flex h-9 w-9 items-center justify-center text-ivory/40 transition-colors hover:text-maroon"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <p className="shrink-0 text-[13px] text-gold">{inr(lineTotal)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <footer className="border-t border-gold/20 px-5 py-4">
                    <dl className="space-y-1.5 text-[13px]">
                      <div className="flex justify-between text-ivory/60">
                        <dt>Subtotal</dt>
                        <dd>{inr(subtotal)}</dd>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-300">
                          <dt>Active Discount</dt>
                          <dd>−{inr(discount)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between text-ivory/60">
                        <dt>Shipping</dt>
                        <dd>{shipping === 0 ? 'Free' : inr(shipping)}</dd>
                      </div>
                      <div className="flex justify-between border-t border-ivory/10 pt-2 font-serif text-lg text-ivory">
                        <dt>Total</dt>
                        <dd className="text-gold">{inr(total)}</dd>
                      </div>
                    </dl>

                    {/* Combo & Tiered Nudge */}
                    {(() => {
                      const totalMetres = items.reduce((s, i) => s + i.metres, 0);
                      const hasTulle = items.some(i => i.item.id === 'aurelia-tulle');
                      const hasOrganza = items.some(i => i.item.id === 'noor-organza');

                      return (
                        <div className="mt-3 space-y-1 text-[11px] text-ivory/50">
                          {totalMetres < 20 && (
                            <p>
                              💡 Add {20 - totalMetres}m more to unlock 15% wholesale discount!
                            </p>
                          )}
                          {totalMetres >= 20 && totalMetres < 50 && (
                            <p>
                              💡 Add {50 - totalMetres}m more to unlock 20% bulk discount!
                            </p>
                          )}
                          {totalMetres >= 50 && totalMetres < 100 && (
                            <p>
                              💡 Add {100 - totalMetres}m more to unlock 25% bulk discount!
                            </p>
                          )}
                          {((hasTulle && !hasOrganza) || (!hasTulle && hasOrganza)) && (
                            <p className="text-gold">
                              🎁 Combo offer: Add {hasTulle ? 'Noor Pearl Organza' : 'Aurelia Hand-Embroidered Tulle'} to unlock 10% off both!
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => { setOpen(false); navigate('/checkout'); }}
                      className="btn btn-gold btn-sheen mt-4 w-full"
                    >
                      Checkout →
                    </button>
                  </footer>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
