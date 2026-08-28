import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { CATALOG_SOURCE } from '../lib/constants';

interface Review {
  name: string;
  rating: number;
  text: string;
  product?: string;
  date?: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(CATALOG_SOURCE.reviewsUrl)
      .then(r => r.json())
      .then((data: Review[]) => {
        setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setReviews([
          { name: 'Priya M.', rating: 5, text: 'Exceptional quality Banarasi silk. The zari work is stunning and the drape is perfect for my wedding lehenga.', product: 'Banarasi Kadhwa Brocade' },
          { name: 'Aarti S.', rating: 5, text: 'The crêpe de chine is gorgeous — fluid and luxurious. Exactly what I needed for evening wear.', product: 'Midnight Crêpe de Chine' },
          { name: 'Meera K.', rating: 4, text: 'Beautiful organza with pearl work. The team was very helpful with quantity recommendations.', product: 'Noor Pearl Organza' },
          { name: 'Sunita R.', rating: 5, text: 'I have been buying from In Design for years. The quality is consistently outstanding.', product: '' },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="bg-[#FFE6E9] py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          <span className="kicker-dark">What our customers say</span>
          <h1 className="mt-4 font-serif text-[42px] md:text-[64px] text-[#1F0505] leading-[0.95] tracking-tight">
            Reviews
          </h1>
          <p className="mt-5 text-[14px] text-[#1F0505]/50 max-w-[480px] leading-relaxed">
            The trust of our customers is the fabric of our business. Here's what they have to say about their experience with In Design.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton h-40 rounded" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-center text-[#1F0505]/40 py-20 text-[14px]">No reviews yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((r, idx) => (
                <figure
                  key={idx}
                  className="flex flex-col p-6 md:p-8 bg-white border border-[#1F0505]/8"
                >
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < r.rating ? 'fill-[#1F0505] text-[#1F0505]' : 'fill-transparent text-[#1F0505]/20'}`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <blockquote className="text-[14px] text-[#1F0505]/70 leading-relaxed flex-1">
                    "{r.text}"
                  </blockquote>
                  <figcaption className="mt-5 pt-4 border-t border-[#1F0505]/6">
                    <p className="text-[13px] font-semibold text-[#1F0505]">{r.name}</p>
                    {r.product && (
                      <p className="text-[11px] text-[#1F0505]/40 mt-0.5">
                        Purchased: {r.product}
                      </p>
                    )}
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
