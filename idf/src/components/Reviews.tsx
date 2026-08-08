import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LogOut, Lock, Star, X } from 'lucide-react';
import { REVIEWS, type Review } from '../data/reviews';
import { loadReviews } from '../lib/reviewSource';
import { supabase } from '../lib/supabase';
import { BUSINESS, REVIEW_PUBLISH_THRESHOLD } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import AuthGate from './AuthGate';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

function Stars({ n, size = 'h-3.5 w-3.5' }: { n: number; size?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= n ? 'fill-gold text-gold' : 'text-ivory/20'}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

/** Row shape as it comes back from the `reviews` table. */
interface SupaReview {
  id: string;
  name: string;
  city: string;
  rating: number;
  review_text: string;
  created_at: string;
}

export default function Reviews() {
  const { enabled, user, loading: authLoading, signOut } = useAuth();

  /**
   * Two independent data sources for the same on-screen list:
   *  - Supabase, when configured: live query + realtime subscription, so an
   *    admin publishing a review appears for everyone already on the page.
   *  - The bundled/JSON fallback otherwise, exactly as before.
   */
  const [published, setPublished] = useState<Review[]>(REVIEWS);

  useEffect(() => {
    if (enabled && supabase) {
      const sb = supabase;
      let cancelled = false;

      const fetchPublished = async () => {
        const { data } = await sb
          .from('reviews')
          .select('name, city, rating, review_text, created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        if (!cancelled && data) {
          setPublished(
            (data as SupaReview[]).map((r) => ({
              name: r.name,
              city: r.city,
              rating: r.rating,
              text: r.review_text,
              date: new Date(r.created_at).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric',
              }),
            })),
          );
        }
      };

      fetchPublished();

      const channel = sb
        .channel('public-reviews-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchPublished)
        .subscribe();

      return () => {
        cancelled = true;
        sb.removeChannel(channel);
      };
    }

    // Non-Supabase fallback — unchanged from before.
    let cancelled = false;
    loadReviews().then((r) => {
      if (!cancelled) setPublished(r);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState<'public' | 'private' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Once signed in, default the name field from the account (Google gives a
  // real name; email sign-up doesn't, so it starts blank either way is fine).
  useEffect(() => {
    if (user && !name) {
      const fromGoogle = (user.user_metadata as { full_name?: string; name?: string } | undefined);
      setName(fromGoogle?.full_name ?? fromGoogle?.name ?? '');
    }
  }, [user, name]);

  /**
   * The average is computed from exactly the reviews on screen, and labelled as
   * such. Do not change this to an average of all submissions while showing
   * only the good ones — that is the misleading-rating pattern India's review
   * standard (IS 19000:2022) exists to stop.
   */
  const avg = published.length
    ? (published.reduce((s, r) => s + r.rating, 0) / published.length).toFixed(1)
    : '—';

  const isPositive = rating >= REVIEW_PUBLISH_THRESHOLD;

  const reset = () => {
    setCity('');
    setText('');
    setRating(5);
    setError('');
  };

  /** Non-Supabase path: unchanged WhatsApp submission. */
  const submitViaWhatsApp = () => {
    const who = `${name.trim()}${city.trim() ? `, ${city.trim()}` : ''}`;
    const stars = `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)`;

    const msg = isPositive
      ? [
          `*NEW REVIEW — OK TO PUBLISH*`,
          ``,
          `${stars}`,
          `*From:* ${who}`,
          ``,
          `"${text.trim()}"`,
          ``,
          `Add this in the /#/admin editor to show it on the website.`,
        ].join('\n')
      : [
          `*PRIVATE FEEDBACK — NOT FOR THE WEBSITE*`,
          ``,
          `${stars}`,
          `*From:* ${who}`,
          ``,
          `"${text.trim()}"`,
          ``,
          `This customer was not happy. Please call them back.`,
        ].join('\n');

    window.open(
      `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener',
    );
    setSent(isPositive ? 'public' : 'private');
  };

  /** Supabase path: a real row, tied to the signed-in account. */
  const submitViaSupabase = async () => {
    if (!supabase || !user) return;
    const sb = supabase;
    setSubmitting(true);
    const { error: dbError } = await sb.from('reviews').insert({
      user_id: user.id,
      user_email: user.email,
      name: name.trim(),
      city: city.trim(),
      rating,
      review_text: text.trim(),
      status: isPositive ? 'pending' : 'private',
    });
    setSubmitting(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setSent(isPositive ? 'public' : 'private');
  };

  const submit = () => {
    if (name.trim().length < 2) return setError('Please enter your name');
    if (text.trim().length < 12) return setError('Please write a little more about your experience');
    setError('');

    if (enabled) {
      submitViaSupabase();
    } else {
      submitViaWhatsApp();
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setSent(null);
    reset();
  };

  return (
    <section id="reviews" className="scroll-mt-20 bg-cream py-16 sm:py-24 lg:py-28">
      <div className="container-lux">
        <SectionHeading
          kicker="Customer Reviews"
          title="What our customers say"
          sub={
            enabled
              ? 'Verified reviews from signed-in customers — a selection published by the showroom.'
              : 'A selection of reviews from brides, boutique owners and tailors who buy here.'
          }
        />

        <Reveal className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="font-nums text-4xl font-semibold text-gold-dark">{avg}</span>
            <div>
              <Stars n={Math.round(Number(avg) || 0)} size="h-4 w-4" />
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
                across {published.length} published {published.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setFormOpen(true)} className="btn btn-ghost-dark mt-2">
            Write a Review
          </button>
          {enabled && user && (
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-ink"
            >
              <LogOut className="h-3 w-3" />
              Signed in as {user.email} · Sign out
            </button>
          )}
        </Reveal>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {published.slice(0, 6).map((r, i) => (
            <Reveal key={`${r.name}-${i}`} delay={(i % 3) * 0.08}>
              <figure className="flex h-full flex-col rounded-[3px] border border-walnut/15 bg-ivory p-5">
                <Stars n={r.rating} />
                <blockquote className="mt-3 flex-1 text-[14px] leading-relaxed text-ink/80">
                  {r.text}
                </blockquote>
                <figcaption className="mt-4 border-t border-walnut/10 pt-3">
                  <p className="text-[13px] font-semibold text-ink">{r.name}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-muted">
                    {[r.city, r.date].filter(Boolean).join(' · ')}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Review form */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-end justify-center bg-night/85 backdrop-blur-sm sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Write a review"
          >
            <motion.div
              initial={{ y: '4%', opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '4%', opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[6px] bg-chocolate p-5 sm:rounded-[4px]"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-ivory">
                  {sent ? 'Thank you' : 'Write a Review'}
                </h3>
                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close review form"
                  className="flex h-10 w-10 items-center justify-center text-ivory/70 hover:text-gold"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* ---- After submitting ---- */}
              {sent ? (
                <div className="space-y-5 py-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                    {sent === 'public' ? (
                      <Heart className="h-7 w-7 text-gold" />
                    ) : (
                      <Lock className="h-7 w-7 text-gold" />
                    )}
                  </div>
                  <p className="mx-auto max-w-xs text-[14px] leading-relaxed text-ivory/70">
                    {enabled
                      ? sent === 'public'
                        ? 'Your review is saved and waiting for the showroom to publish it. It will appear here the moment they approve it — no refresh needed.'
                        : 'Your feedback is saved privately for the owner. Someone will reach out to put this right.'
                      : sent === 'public'
                        ? 'Your review is on its way to the showroom on WhatsApp. Press send there and we will add it to the website shortly.'
                        : 'Your feedback goes straight to the owner on WhatsApp — press send there. Someone will call you to put this right.'}
                  </p>
                  <button type="button" onClick={closeForm} className="btn btn-gold btn-sheen w-full">
                    Close
                  </button>
                </div>
              ) : enabled && authLoading ? (
                <div className="py-10 text-center text-[13px] text-ivory/50">Loading…</div>
              ) : enabled && !user ? (
                /* ---- Must sign in before writing a review ---- */
                <div className="mt-5">
                  <p className="mb-5 text-center text-[13px] leading-relaxed text-ivory/60">
                    Sign in so your review shows as a real, verified customer.
                  </p>
                  <AuthGate compact />
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="mb-2 text-[12px] uppercase tracking-[0.16em] text-ivory/60">
                      Your rating
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(i)}
                          aria-label={`Rate ${i} of 5`}
                          className="p-1"
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              i <= rating ? 'fill-gold text-gold' : 'text-ivory/25'
                            }`}
                            strokeWidth={1.5}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-[2px] border border-ivory/15 bg-night/40 px-3.5 py-3 text-[14px] text-ivory placeholder-ivory/30 outline-none focus:border-gold"
                  />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City (optional)"
                    className="w-full rounded-[2px] border border-ivory/15 bg-night/40 px-3.5 py-3 text-[14px] text-ivory placeholder-ivory/30 outline-none focus:border-gold"
                  />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder={
                      isPositive
                        ? 'Tell others about the fabric, service and experience…'
                        : 'Tell us what went wrong — this goes privately to the owner.'
                    }
                    className="w-full rounded-[2px] border border-ivory/15 bg-night/40 px-3.5 py-3 text-[14px] text-ivory placeholder-ivory/30 outline-none focus:border-gold"
                  />

                  {error && <p className="text-[12px] text-maroon">{error}</p>}

                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="btn btn-gold btn-sheen w-full"
                  >
                    {submitting
                      ? 'Sending…'
                      : isPositive
                        ? 'Submit Review'
                        : 'Send Privately to the Owner'}
                  </button>

                  <p className="flex items-start gap-2 text-[11px] leading-relaxed text-ivory/40">
                    {isPositive ? (
                      <>
                        <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                        Reviews are read by the showroom before they appear on the site.
                      </>
                    ) : (
                      <>
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                        This will not be posted publicly. It goes to the owner so the problem can be
                        fixed.
                      </>
                    )}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
