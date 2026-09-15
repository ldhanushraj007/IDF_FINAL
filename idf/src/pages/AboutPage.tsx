import { useEffect, useRef } from 'react';
import { Award, Gem, Globe2, HandHeart, Sparkles, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BUSINESS, WA_VISIT } from '../lib/constants';

const VALUES = [
  {
    icon: Gem,
    title: 'Premium Quality Promise',
    body: 'Every bolt is inspected by hand before it reaches the floor — weave density, colour-fastness, zari purity. What we won’t sell to a customer, we don’t stock.',
  },
  {
    icon: Sparkles,
    title: 'Extensive Collection',
    body: 'Bridal silks, heritage Banarasi and Kanjivaram weaves, and contemporary drapes for designers — sourced directly from weaving clusters across India.',
  },
  {
    icon: HandHeart,
    title: 'Customer Satisfaction',
    body: 'From a single metre for an alteration to a wholesale order for a boutique, every customer gets the same time, the same care, the same honesty about what suits them.',
  },
  {
    icon: Globe2,
    title: 'Global Design Inspiration',
    body: 'We track runway and bridal trends from Mumbai to Milan, then interpret them in fabrics that work for Indian silhouettes, climate and occasions.',
  },
  {
    icon: Award,
    title: 'Luxury Experience',
    body: 'A showroom built for unhurried decisions — natural light to see true colour, space to drape a full length, and staff who know every fabric’s story.',
  },
  {
    icon: Users,
    title: 'Our Commitment',
    body: 'To the weavers whose names travel with every bolt, and to the designers and families who trust us with once-in-a-lifetime garments.',
  },
];

const TIMELINE = [
  { year: '2009', text: 'Opened as a single counter of Banarasi silks on Commercial Street, Bengaluru.' },
  { year: '2014', text: 'Expanded into bridal couture fabrics as demand grew from the city’s designer community.' },
  { year: '2019', text: 'Began direct sourcing from weaving clusters in Varanasi, Kanchipuram and Bhagalpur.' },
  { year: 'Today', text: 'A trusted address for boutiques, tailors and brides across India, online and in-store.' },
];

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `About Us | ${BUSINESS.name}`;
  }, []);


  return (
    <div ref={containerRef} className="flex flex-col relative w-full bg-[#FAF7F5] text-[#1F1916]">
      {/* Breadcrumb Header */}
      <div className="w-full max-w-[1340px] mx-auto px-6 pt-6 pb-2 text-[11px] font-sans tracking-[0.2em] uppercase text-[#1F1916]/60">
        <Link to="/" className="hover:text-[#1F1916] transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-[#1F1916]">ABOUT US</span>
      </div>

      {/* Main Hero Section: Woven into history (Full-Bleed Seamless Fade Match to Image 1) */}
      <section className="relative w-full border-b border-[#1F1916]/10 min-h-[560px] md:min-h-[640px] flex items-center overflow-hidden bg-[#FAF7F5]">
        {/* Full-Bleed Right Background Image */}
        <div className="absolute right-0 top-0 w-full md:w-3/4 h-full z-0 overflow-hidden">
          <img
            src="/images/about/craft.jpg"
            alt="Artisan hands stitching luxury organza fabric"
            className="w-full h-full object-cover object-right-center scale-[1.22] origin-top-left"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/about/story.jpg';
            }}
          />
          {/* Left-to-Right Fade Mask */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F5] via-[#FAF7F5]/50 to-transparent pointer-events-none" />
          {/* Top-to-Bottom Fade Mask */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F5]/40 via-transparent to-[#FAF7F5] pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-[1340px] mx-auto px-6 w-full py-16">
          <div className="max-w-lg">
            <h1 className="font-serif text-[48px] sm:text-[62px] md:text-[76px] lg:text-[84px] text-[#1F1916] leading-[1.02] tracking-tight font-light mb-4">
              Woven into<br />history.
            </h1>

            {/* Gold Accent Bar */}
            <div className="w-14 h-[2px] bg-[#C5A059] mb-8" />

            <p className="text-[15px] md:text-[16px] text-[#1F1916]/85 leading-relaxed font-sans mb-10 max-w-md">
              Our journey is a tribute to the timeless art of textile craftsmanship blended with contemporary vision.
            </p>

            <div>
              <a
                href={WA_VISIT}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-[#1F1916] text-[#1F1916] bg-transparent hover:bg-[#1F1916] hover:text-white transition-all duration-300 px-8 py-3.5 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase group shadow-xs"
              >
                DISCOVER OUR STORY
                <span className="ml-3 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Preservation & Excellence */}
      <section className="relative w-full border-b border-[#1F1916]/10 py-16 md:py-24 px-6 bg-[#FAF7F5]">
        <div className="max-w-[1340px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          <div className="bg-white p-8 md:p-10 border border-[#1F1916]/10 shadow-sm">
            <span className="text-[10px] font-sans tracking-[0.2em] text-[#1F1916]/50 uppercase font-semibold">01 / Heritage Preservation</span>
            <h3 className="font-serif text-[26px] md:text-[34px] text-[#1F1916] mb-4 mt-3 leading-tight font-light">Preservation of Heritage</h3>
            <p className="text-[14px] text-[#1F1916]/70 leading-relaxed font-sans">
              Our mission extends beyond curation. We are committed to the preservation of ancient weaving techniques that define luxury. By partnering directly with master artisans, we ensure fair trade and sustain generational crafts that risk fading into obsolescence.
            </p>
          </div>
          <div className="bg-white p-8 md:p-10 border border-[#1F1916]/10 shadow-sm">
            <span className="text-[10px] font-sans tracking-[0.2em] text-[#1F1916]/50 uppercase font-semibold">02 / Excellence Promise</span>
            <h3 className="font-serif text-[26px] md:text-[34px] text-[#1F1916] mb-4 mt-3 leading-tight font-light">Uncompromising Quality</h3>
            <p className="text-[14px] text-[#1F1916]/70 leading-relaxed font-sans">
              Our vision is focused strictly on the wearer. Every metre of fabric that enters our atelier is rigorously inspected. We believe true luxury is felt against the skin and seen in the drape. We curate for discerning designers and clientele who demand nothing less than perfection.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="relative w-full border-b border-[#1F1916]/10 py-16 md:py-24 px-6 bg-[#F3EEEA]">
        <div className="max-w-[1340px] mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] font-sans tracking-[0.25em] text-[#1F1916]/50 uppercase font-semibold">Our Pillars</span>
            <h2 className="font-serif text-[32px] md:text-[46px] text-[#1F1916] mt-2 font-light">What Defines Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VALUES.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="bg-white border border-[#1F1916]/10 p-8 shadow-sm">
                  <div className="w-12 h-12 bg-[#F3EEEA] flex items-center justify-center mb-6 text-[#1F1916]">
                    <Icon className="w-6 h-6" strokeWidth={1.3} />
                  </div>
                  <h4 className="font-serif text-[20px] text-[#1F1916] mb-3 font-normal">{val.title}</h4>
                  <p className="text-[13px] text-[#1F1916]/65 leading-relaxed font-sans">{val.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative w-full border-b border-[#1F1916]/10 py-16 md:py-24 px-6 bg-[#FAF7F5]">
        <div className="max-w-[1340px] mx-auto">
          <div className="mb-14">
            <span className="text-[10px] font-sans tracking-[0.25em] text-[#1F1916]/50 uppercase font-semibold">Our Timeline</span>
            <h2 className="font-serif text-[32px] md:text-[46px] text-[#1F1916] mt-2 font-light">The Journey Since 2009</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIMELINE.map((t) => (
              <div key={t.year} className="bg-white border border-[#1F1916]/10 p-7 relative hover:shadow-md transition-shadow">
                <span className="font-serif text-[38px] text-[#1F1916] leading-none mb-4 block font-light">{t.year}</span>
                <h4 className="font-sans text-[10px] font-semibold tracking-widest text-[#1F1916]/40 uppercase mb-2">Milestone</h4>
                <p className="text-[13px] text-[#1F1916]/70 leading-relaxed font-sans">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full py-20 px-6 flex flex-col items-center justify-center text-center bg-[#1F1916] text-white">
        <Calendar className="h-10 w-10 text-[#E8E2DB] mb-5" strokeWidth={1} />
        <h2 className="font-serif text-[32px] md:text-[48px] text-white mb-4 max-w-2xl leading-tight font-light">
          Experience the drape in person.
        </h2>
        <p className="text-[14px] text-white/70 max-w-xl mb-8 leading-relaxed font-sans">
          We invite designers, dressmakers, and fabric enthusiasts to visit our atelier for a personalized consultation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={WA_VISIT}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#E8E2DB] text-[#1F1916] hover:bg-white transition-colors px-8 py-3.5 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase"
          >
            Book showroom consultation
          </a>
          <a
            href={BUSINESS.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/40 text-white hover:border-white hover:bg-white/10 transition-colors px-8 py-3.5 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase"
          >
            Get showroom directions
          </a>
        </div>
      </section>
    </div>
  );
}

