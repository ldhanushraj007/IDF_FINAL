// CartDrawer — slide-out tray; checkout navigates to /checkout route
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Minus, Plus, ShoppingBag, Trash2, X, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { inr, waLink } from '../lib/constants';

export default function CartDrawer() {
  const {
    open, setOpen, items, subtotal, discount, shipping, total,
    isWholesale, isBulkOrder, totalMetres, distinctProducts, setMetres, remove,
  } = useCart();
  const { has, toggle } = useWishlist();
  const { user, requestSignIn } = useAuth();
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
              className="fixed inset-0 z-[80] bg-[#1F0505]/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-[85] flex w-full max-w-md flex-col bg-white shadow-2xl"
              role="dialog"
              aria-label="Your order"
            >
              <header className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(31,5,5,0.08)' }}
              >
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-xl text-[#1F0505]">Your Order</h2>
                  <Link
                    to="/wishlist"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1F0505]/60 hover:text-[#1F0505] bg-[#FFE6E9]/40 border border-[#1F0505]/15 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <Heart className="h-3 w-3 text-[#1F0505]" strokeWidth={1.5} />
                    Wishlist
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close cart"
                  className="flex h-10 w-10 items-center justify-center text-[#1F0505]/40 transition-colors hover:text-[#1F0505]"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                  <ShoppingBag className="h-10 w-10 text-[#1F0505]/20" strokeWidth={1.2} />
                  <p className="text-[14px] text-[#1F0505]/40">
                    Your order is empty. Browse our fabrics and add by the metre.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); navigate('/shop'); }}
                    className="btn btn-dark btn-sheen"
                  >
                    Browse the Shop
                  </button>
                </div>
              ) : (
                <>
                  {/* Bulk order nudge */}
                  {isBulkOrder && (
                    <div className="bg-[#FFE6E9] px-5 py-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-[#1F0505]/70">
                        <span className="font-semibold text-[#1F0505]">Bulk Order</span> — {distinctProducts} fabrics, {totalMetres}m
                      </p>
                      <a
                        href={waLink(`Bulk order enquiry: ${distinctProducts} fabrics, ${totalMetres} metres.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#1F0505] underline whitespace-nowrap"
                      >
                        Request Pricing
                      </a>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    <ul className="space-y-4">
                      {items.map(({ item, metres, lineTotal }) => (
                        <li key={item.id} className="flex gap-3 pb-4"
                          style={{ borderBottom: '1px solid rgba(31,5,5,0.06)' }}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-24 w-20 shrink-0 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-serif text-[15px] leading-snug text-[#1F0505]">
                              {item.name}
                            </p>
                            <p className="mt-1 text-[11px] text-[#1F0505]/40">
                              {inr(item.pricePerMetre)} / metre
                            </p>

                            <div className="mt-2.5 flex items-center gap-3">
                              <div className="flex items-center border border-[#1F0505]/15">
                                <button
                                  type="button"
                                  aria-label={`Reduce ${item.name}`}
                                  onClick={() =>
                                    setMetres(item.id, Math.max(item.minMetres, Number((metres - 0.5).toFixed(1))))
                                  }
                                  className="flex h-9 w-8 items-center justify-center text-[#1F0505]/40 hover:text-[#1F0505]"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={item.minMetres || 0.5}
                                  step="0.5"
                                  value={metres}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val > 0) {
                                      setMetres(item.id, val);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (isNaN(val) || val < (item.minMetres || 0.5)) {
                                      setMetres(item.id, item.minMetres || 0.5);
                                    }
                                  }}
                                  aria-label={`Metres for ${item.name}`}
                                  className="w-14 h-9 text-center text-[12px] text-[#1F0505] bg-transparent focus:outline-none focus:bg-[#1F0505]/5 font-medium border-x border-[#1F0505]/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  type="button"
                                  aria-label={`Add ${item.name}`}
                                  onClick={() => setMetres(item.id, Number((metres + 0.5).toFixed(1)))}
                                  className="flex h-9 w-8 items-center justify-center text-[#1F0505]/40 hover:text-[#1F0505]"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!user) {
                                      requestSignIn();
                                      return;
                                    }
                                    toggle(item.id);
                                  }}
                                  aria-label={has(item.id) ? `Remove ${item.name} from wishlist` : `Save ${item.name} to wishlist`}
                                  title={has(item.id) ? "Saved in wishlist" : "Add to wishlist"}
                                  className="flex h-9 w-9 items-center justify-center text-[#1F0505]/40 transition-colors hover:text-[#1F0505]"
                                >
                                  <Heart
                                    className={`h-4 w-4 transition-all ${
                                      has(item.id) ? 'fill-[#1F0505] text-[#1F0505]' : 'text-[#1F0505]/40'
                                    }`}
                                    strokeWidth={1.5}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => remove(item.id)}
                                  aria-label={`Remove ${item.name}`}
                                  title="Remove from cart"
                                  className="flex h-9 w-9 items-center justify-center text-[#1F0505]/20 transition-colors hover:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="shrink-0 text-[13px] font-semibold text-[#1F0505]">{inr(lineTotal)}</p>
                        </li>
                      ))}
                    </ul>

                    {/* Upsell nudges */}
                    {(() => {
                      const nudgeMetres = totalMetres < 20 ? `Add ${20 - totalMetres}m more to unlock 15% off!`
                        : totalMetres < 50 ? `Add ${50 - totalMetres}m more to unlock 20% off!`
                        : totalMetres < 100 ? `Add ${100 - totalMetres}m more to unlock 25% off!`
                        : null;
                      return (
                        <div className="mt-4 space-y-1.5">
                          {nudgeMetres && (
                            <p className="text-[11px] text-[#1F0505]/40">💡 {nudgeMetres}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <footer className="px-5 py-4"
                    style={{ borderTop: '1px solid rgba(31,5,5,0.08)' }}
                  >
                    <dl className="space-y-1.5 text-[13px]">
                      <div className="flex justify-between text-[#1F0505]/50">
                        <dt>Subtotal</dt>
                        <dd>{inr(subtotal)}</dd>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <dt>Discount</dt>
                          <dd>−{inr(discount)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between text-[#1F0505]/50">
                        <dt>Shipping</dt>
                        <dd>{shipping === 0 ? 'Free' : inr(shipping)}</dd>
                      </div>
                      <div className="flex justify-between pt-2 font-serif text-lg text-[#1F0505]"
                        style={{ borderTop: '1px solid rgba(31,5,5,0.06)' }}
                      >
                        <dt>Total</dt>
                        <dd>{inr(total)}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      onClick={() => { setOpen(false); navigate('/checkout'); }}
                      className="btn btn-dark btn-sheen mt-4 w-full"
                    >
                      Checkout →
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpen(false); navigate('/shop'); }}
                      className="mt-2 w-full text-center text-[11px] text-[#1F0505]/40 hover:text-[#1F0505] py-1 transition-colors"
                    >
                      Continue Browsing
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
