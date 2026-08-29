import { useEffect, useState } from 'react';
import { Star, MessageSquarePlus, Check, X } from 'lucide-react';
import { loadReviews, submitCustomerReview } from '../lib/reviewSource';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import type { Review } from '../data/reviews';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { profile, user } = useAuth();
  const { items } = useCatalog();

  // Form State
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(5);
  const [product, setProduct] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const fetchAllReviews = () => {
    setLoading(true);
    loadReviews()
      .then((data) => setReviews(data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (profile?.city) setCity(profile.city);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (text.trim().length < 5) { setError('Please write at least a few words for your review'); return; }

    setError('');
    setSubmitting(true);

    const newRev: Review = {
      name: name.trim(),
      city: city.trim(),
      rating,
      product: product.trim() || undefined,
      text: text.trim(),
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    await submitCustomerReview(newRev);
    setSubmitting(false);
    setSubmitted(true);
    setText('');

    // Instant reload of reviews list
    fetchAllReviews();

    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
    }, 2800);
  };

  return (
    <>
      {/* Header Banner */}
      <section className="bg-[#FFE6E9] py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="kicker-dark">What our customers say</span>
            <h1 className="mt-3 font-serif text-[40px] md:text-[60px] text-[#1F0505] leading-[0.95] tracking-tight">
              Client Reviews
            </h1>
            <p className="mt-4 text-[14px] text-[#1F0505]/60 max-w-[480px] leading-relaxed">
              The trust of our clients is the fabric of our heritage. Read verified testimonials or leave your own review.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#1F0505] text-white text-[11px] font-sans font-bold tracking-[0.16em] uppercase hover:bg-[#1F0505]/90 transition-all shadow-md shrink-0"
          >
            <MessageSquarePlus className="h-4 w-4" />
            {showForm ? 'Close Form' : 'Write a Review'}
          </button>
        </div>
      </section>

      {/* Add Review Box Form */}
      {showForm && (
        <section className="bg-[#FAF8F5] border-b border-[#1F0505]/15 py-10 px-6 md:px-12">
          <div className="max-w-[720px] mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-[#1F0505]/20 shadow-xl relative">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 p-2 text-[#1F0505]/40 hover:text-[#1F0505] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h2 className="font-serif text-[24px] text-[#1F0505]">Write a Review</h2>
              <p className="font-sans text-[12px] text-[#1F0505]/50 mt-1">
                Share your experience with In Design Luxury Fabrics. Your review will be published live!
              </p>
            </div>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-6 rounded-xl text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-lg font-bold">Thank You for Your Review!</h3>
                <p className="text-[12px] text-emerald-700">
                  Your feedback has been published live and updated across our catalog and admin portal.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-[12px] font-medium border border-red-200">
                    {error}
                  </div>
                )}

                {/* Rating Selector */}
                <div>
                  <label className="block text-[11px] font-sans font-bold uppercase tracking-[0.14em] text-[#1F0505]/60 mb-2">
                    Rating (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= rating
                              ? 'fill-[#B8860B] text-[#B8860B]'
                              : 'fill-transparent text-[#1F0505]/20'
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-[13px] font-semibold text-[#1F0505]">
                      {rating} out of 5 Stars
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-sans font-bold uppercase tracking-[0.14em] text-[#1F0505]/60 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full px-4 py-3 rounded-xl border border-[#1F0505]/20 text-[13px] bg-white focus:outline-none focus:border-[#1F0505]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-bold uppercase tracking-[0.14em] text-[#1F0505]/60 mb-1.5">
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full px-4 py-3 rounded-xl border border-[#1F0505]/20 text-[13px] bg-white focus:outline-none focus:border-[#1F0505]"
                    />
                  </div>
                </div>

                {/* Fabric Purchased (Optional) */}
                <div>
                  <label className="block text-[11px] font-sans font-bold uppercase tracking-[0.14em] text-[#1F0505]/60 mb-1.5">
                    Fabric Purchased (Optional)
                  </label>
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#1F0505]/20 text-[13px] bg-white focus:outline-none focus:border-[#1F0505]"
                  >
                    <option value="">Select a fabric from catalog...</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.name}>
                        {i.name} ({i.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-[11px] font-sans font-bold uppercase tracking-[0.14em] text-[#1F0505]/60 mb-1.5">
                    Your Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tell us about the fabric quality, weave, drape, or service experience..."
                    className="w-full px-4 py-3 rounded-xl border border-[#1F0505]/20 text-[13px] bg-white focus:outline-none focus:border-[#1F0505]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 rounded-xl border border-[#1F0505]/20 text-[#1F0505] text-[11px] font-sans font-bold uppercase tracking-[0.14em]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 rounded-xl bg-[#1F0505] text-white text-[11px] font-sans font-bold uppercase tracking-[0.14em] hover:bg-[#1F0505]/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      {/* Reviews Grid */}
      <section className="bg-white py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-40 rounded-2xl bg-[#FFE6E9]/20 animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#1F0505]/40 text-[14px]">No reviews yet. Be the first to leave a review!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((r, idx) => (
                <figure
                  key={idx}
                  className="flex flex-col p-6 md:p-8 bg-white border border-[#1F0505]/10 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Stars & Date */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.rating ? 'fill-[#B8860B] text-[#B8860B]' : 'fill-transparent text-[#1F0505]/20'
                          }`}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    {r.date && (
                      <span className="text-[10px] font-sans text-[#1F0505]/40 uppercase font-semibold">
                        {r.date}
                      </span>
                    )}
                  </div>

                  <blockquote className="text-[14px] text-[#1F0505]/80 leading-relaxed flex-1 italic font-serif">
                    "{r.text}"
                  </blockquote>

                  <figcaption className="mt-5 pt-4 border-t border-[#1F0505]/8 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#1F0505]">
                        {r.name} {r.city ? <span className="text-[#1F0505]/40 font-normal">· {r.city}</span> : null}
                      </p>
                      {r.product && (
                        <p className="text-[11px] text-[#B8860B] mt-0.5 font-medium">
                          Purchased: {r.product}
                        </p>
                      )}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
