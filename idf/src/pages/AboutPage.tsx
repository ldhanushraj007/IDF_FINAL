import { useEffect, useRef } from 'react';
import { Award, Gem, Globe2, HandHeart, Sparkles, Users, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { BUSINESS, WA_VISIT } from '../lib/constants';
import Reveal from '../components/Reveal';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Pinned Horizontal Fabric Strips Reveal (Desktop only)
      ScrollTrigger.matchMedia({
        '(min-width: 768px)': function () {
          gsap.timeline({
            scrollTrigger: {
              trigger: '.about-history-section',
              start: 'top top+=68', // aligns just below sticky nav
              end: '+=1000', // scroll duration
              pin: true,
              scrub: 1,
            },
          })
            .to('.fabric-strip-1', { xPercent: -120, ease: 'none' }, 0)
            .to('.fabric-strip-2', { xPercent: -90, ease: 'none' }, 0)
            .to('.fabric-strip-3', { xPercent: -60, ease: 'none' }, 0)
            .to('.fabric-strip-4', { xPercent: -90, ease: 'none' }, 0)
            .to('.fabric-strip-5', { xPercent: -120, ease: 'none' }, 0);
        },
      });

      // Paragraph-by-paragraph reveal
      gsap.utils.toArray('.story-paragraph').forEach((p: any) => {
        gsap.from(p, {
          opacity: 0,
          y: 15,
          duration: 0.6,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: p,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col relative w-full bg-white text-[#1F0505]">
      {/* Hero Section: The Heritage Story */}
      <section className="relative w-full border-b border-[#1F0505]/10 about-history-section bg-[#FFE6E9]/40">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">
          {/* Hero Text */}
          <div className="p-8 md:p-16 flex flex-col justify-center border-r border-[#1F0505]/10 bg-transparent z-10">
            <span className="kicker-dark">Our Heritage</span>
            <h1 className="font-serif text-[44px] md:text-[68px] lg:text-[80px] text-[#1F0505] mb-6 mt-3 leading-[1.05] tracking-tight">
              Woven into<br />history.
            </h1>
            <p className="text-[14px] text-[#1F0505]/60 max-w-md leading-relaxed story-paragraph">
              Born from a profound respect for the loom, {BUSINESS.name} began its journey tracing the intricate threads of India's textile heartlands. From the opulent zari of Banaras to the structural majesty of Kanchipuram silks, and the raw elegance of Bhagalpur tussar, we source not just fabric, but heritage.
            </p>
          </div>

          {/* Hero Image Area with 5 Fabric Strips */}
          <div className="relative flex gap-3 overflow-hidden h-[400px] md:h-full w-full justify-center items-center bg-[#FFE6E9]/20 p-6">
            {[
              { class: 'fabric-strip-1', img: '/images/fabrics/f01.jpg', offset: 0, label: 'Tulle' },
              { class: 'fabric-strip-2', img: '/images/fabrics/f02.jpg', offset: 30, label: 'Organza' },
              { class: 'fabric-strip-3', img: '/images/fabrics/f05.jpg', offset: 60, label: 'Brocade' },
              { class: 'fabric-strip-4', img: '/images/fabrics/f06.jpg', offset: 90, label: 'Mulberry Silk' },
              { class: 'fabric-strip-5', img: '/images/fabrics/f08.jpg', offset: 120, label: 'Velvet' },
            ].map((strip, idx) => (
              <div
                key={idx}
                className={`${strip.class} relative w-[60px] md:w-[85px] shrink-0 overflow-hidden border border-[#1F0505]/15 bg-[#f5f0ed] shadow-lg`}
                style={{
                  height: '280px',
                  transform: `translateY(${strip.offset}px)`,
                }}
              >
                <img
                  src={strip.img}
                  alt={strip.label}
                  className="w-full h-full object-cover grayscale opacity-95 hover:grayscale-0 transition-all duration-500"
                  onError={(e) => {
                    // Fallback to placeholder color or generic image if missing
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-0.5 border border-[#1F0505]/10 text-[9px] font-sans font-semibold tracking-wider uppercase">
                  {strip.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="relative w-full border-b border-[#1F0505]/10 py-16 md:py-24 px-6 md:px-12 bg-white">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <span className="kicker-dark">01 / Heritage Preservation</span>
            <h3 className="font-serif text-[28px] md:text-[36px] text-[#1F0505] mb-5 mt-2 leading-tight">Preservation of Heritage</h3>
            <p className="text-[14px] text-[#1F0505]/60 leading-relaxed story-paragraph">
              Our mission extends beyond curation. We are committed to the preservation of ancient weaving techniques that define luxury. By partnering directly with master artisans, we ensure fair trade and sustain generational crafts that risk fading into obsolescence.
            </p>
          </div>
          <div>
            <span className="kicker-dark">02 / Excellence Promise</span>
            <h3 className="font-serif text-[28px] md:text-[36px] text-[#1F0505] mb-5 mt-2 leading-tight">Uncompromising Quality</h3>
            <p className="text-[14px] text-[#1F0505]/60 leading-relaxed story-paragraph">
              Our vision is focused strictly on the wearer. Every metre of fabric that enters our atelier is rigorously inspected. We believe true luxury is felt against the skin and seen in the drape. We curate for discerning designers and clientele who demand nothing less than perfection.
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="relative w-full border-b border-[#1F0505]/10 py-16 md:py-24 px-6 md:px-12 bg-[#FFE6E9]/20">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <span className="kicker-dark">Our Pillars</span>
            <h2 className="font-serif text-[32px] md:text-[44px] text-[#1F0505] mt-2">What Defines Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VALUES.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="bg-white border border-[#1F0505]/8 p-6">
                  <div className="w-10 h-10 bg-[#FFE6E9] flex items-center justify-center mb-5 text-[#1F0505]">
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-serif text-[18px] text-[#1F0505] mb-2">{val.title}</h4>
                  <p className="text-[13px] text-[#1F0505]/50 leading-relaxed">{val.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative w-full border-b border-[#1F0505]/10 py-16 md:py-24 px-6 md:px-12 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-12">
            <span className="kicker-dark">Our Timeline</span>
            <h2 className="font-serif text-[32px] md:text-[44px] text-[#1F0505] mt-2">The Journey Since 2009</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIMELINE.map((t, idx) => (
              <div key={t.year} className="border border-[#1F0505]/8 p-6 relative hover:bg-[#FFE6E9]/10 transition-colors">
                <span className="font-serif text-[36px] text-[#1F0505] leading-none mb-4 block font-medium">{t.year}</span>
                <h4 className="font-sans text-[10px] font-semibold tracking-wider text-[#1F0505]/40 uppercase mb-2">Milestone</h4>
                <p className="text-[13px] text-[#1F0505]/60 leading-relaxed">{t.text}</p>
                <div className="w-8 h-px bg-[#1F0505]/10 mt-6" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full py-20 px-6 md:px-12 flex flex-col items-center justify-center text-center bg-[#1F0505] text-white">
        <Calendar className="h-10 w-10 text-[#FFE6E9] mb-5" strokeWidth={1} />
        <h2 className="font-serif text-[32px] md:text-[48px] text-white mb-4 max-w-2xl leading-tight">
          Experience the drape in person.
        </h2>
        <p className="text-[14px] text-white/50 max-w-xl mb-8 leading-relaxed">
          We invite designers, dressmakers, and fabric enthusiasts to visit our atelier for a personalized consultation. Let us assist you with custom orders, color selections, and design ideas.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={WA_VISIT}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-blush btn-sheen !text-[#1F0505]"
          >
            Book showroom consultation
          </a>
          <a
            href={BUSINESS.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-light"
          >
            Get showroom directions
          </a>
        </div>
      </section>
    </div>
  );
}
