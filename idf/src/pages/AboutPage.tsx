import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Award, Gem, Globe2, HandHeart, Sparkles, Users } from 'lucide-react';
import { BUSINESS, WA_VISIT } from '../lib/constants';
import Reveal from '../components/Reveal';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const VALUES = [
  {
    icon: Gem,
    title: 'Premium Quality Promise',
    body: 'Every bolt is inspected by hand before it reaches the floor — weave density, colour-fastness, zari purity. What we won\u2019t sell to a customer, we don\u2019t stock.',
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
    body: 'A showroom built for unhurried decisions — natural light to see true colour, space to drape a full length, and staff who know every fabric\u2019s story.',
  },
  {
    icon: Users,
    title: 'Our Commitment',
    body: 'To the weavers whose names travel with every bolt, and to the designers and families who trust us with once-in-a-lifetime garments.',
  },
];

const TIMELINE = [
  { year: '2009', text: 'Opened as a single counter of Banarasi silks on Commercial Street, Bengaluru.' },
  { year: '2014', text: 'Expanded into bridal couture fabrics as demand grew from the city\u2019s designer community.' },
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
      // 1. Pinned Horizontal Fabric Strips Reveal (Desktop only)
      ScrollTrigger.matchMedia({
        '(min-width: 768px)': function () {
          gsap.timeline({
            scrollTrigger: {
              trigger: '.about-history-section',
              start: 'top top+=64', // aligns just below sticky nav
              end: '+=1200', // scroll duration
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

      // 2. Paragraph-by-paragraph reveal
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
    <div ref={containerRef} className="flex flex-grow relative w-full bg-surface border-x border-[#1a1a1a]">
      {/* Left Sidebar (02 indicator area) */}
      <aside className="hidden md:flex w-16 flex-col items-center py-8 border-r border-[#1a1a1a] relative shrink-0">
        <div className="index-badge font-index-num text-index-num text-secondary w-full text-center left-0 ml-0 pl-2">02</div>
        <div className="vertical-text font-label-caps text-label-caps tracking-widest text-secondary mt-32 uppercase whitespace-nowrap">
          ABOUT US
        </div>
      </aside>

      {/* Main Scrollable Canvas */}
      <main className="flex-grow flex flex-col w-full relative min-w-0">
        {/* Hero Section: The Heritage Story (02) */}
        <section className="relative w-full border-b border-[#1A1A1A] grid-line-b about-history-section">
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">
            {/* Hero Text */}
            <div className="p-8 md:p-16 flex flex-col justify-center relative border-r border-[#1A1A1A] grid-line-r bg-surface z-10">
              <div className="md:hidden index-badge font-index-num text-index-num text-secondary">02</div>
              <h1 className="font-display-lg text-[48px] md:text-[84px] text-primary mb-8 leading-tight font-serif">
                Woven into<br/>history.
              </h1>
              <div className="w-12 h-[1px] bg-brand-gold mb-8"></div>
              <h2 className="font-label-caps text-label-caps text-secondary tracking-widest uppercase mb-4">Our Story</h2>
              <p className="font-body-lg text-body-lg text-secondary max-w-md story-paragraph">
                Born from a profound respect for the loom, {BUSINESS.name} began its journey tracing the intricate threads of India's textile heartlands. From the opulent zari of Banaras to the structural majesty of Kanchipuram silks, and the raw elegance of Bhagalpur tussar, we source not just fabric, but heritage.
              </p>
            </div>
            {/* Hero Image Area with 5 Fabric Strips */}
            <div className="about-history-strips relative flex gap-3 overflow-hidden h-[400px] md:h-full w-full justify-center items-center bg-[#F2F1EC] p-6">
              {[
                { class: 'fabric-strip-1', img: '/images/fabrics/f01.jpg', offset: 0, label: 'Tulle' },
                { class: 'fabric-strip-2', img: '/images/fabrics/f02.jpg', offset: 40, label: 'Organza' },
                { class: 'fabric-strip-3', img: '/images/fabrics/f05.jpg', offset: 80, label: 'Brocade' },
                { class: 'fabric-strip-4', img: '/images/fabrics/f06.jpg', offset: 120, label: 'Mulberry Silk' },
                { class: 'fabric-strip-5', img: '/images/fabrics/f08.jpg', offset: 160, label: 'Zardozi Velvet' },
              ].map((strip, idx) => (
                <div
                  key={idx}
                  className={`${strip.class} relative w-[60px] md:w-[85px] shrink-0 overflow-hidden border border-[#1A1A1A] bg-surface-container shadow-md`}
                  style={{
                    height: '280px',
                    transform: `translateY(${strip.offset}px)`,
                  }}
                >
                  <img
                    src={strip.img}
                    alt={strip.label}
                    className="w-full h-full object-cover grayscale opacity-95 hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute bottom-2 left-2 bg-white/95 px-1.5 py-0.5 border border-[#1A1A1A] text-[8px] font-mono tracking-widest uppercase">
                    {strip.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision & Mission (03) */}
        <section className="relative w-full border-b border-[#1A1A1A] grid-line-b py-16 px-8 md:px-16 bg-surface-container-low">
          <div className="absolute top-4 left-4 font-index-num text-index-num text-secondary">03</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-6xl mx-auto mt-8">
            <div>
              <h3 className="font-headline-md text-3xl text-primary mb-6 font-serif">Preservation of Heritage.</h3>
              <p className="font-body-lg text-body-lg text-secondary story-paragraph">
                Our mission extends beyond curation. We are committed to the preservation of ancient weaving techniques that define luxury. By partnering directly with master artisans, we ensure fair trade and sustain generational crafts that risk fading into obsolescence.
              </p>
            </div>
            <div>
              <h3 className="font-headline-md text-3xl text-primary mb-6 font-serif">Uncompromising Quality.</h3>
              <p className="font-body-lg text-body-lg text-secondary story-paragraph">
                Our vision is focused strictly on the wearer. Every metre of fabric that enters our atelier is rigorously inspected. We believe true luxury is felt against the skin and seen in the drape. We curate for discerning designers and clientele who demand nothing less than perfection.
              </p>
            </div>
          </div>
        </section>

        {/* Milestone Timeline (04) */}
        <section className="relative w-full border-b border-[#1A1A1A] grid-line-b overflow-hidden">
          <div className="absolute top-4 left-4 font-index-num text-index-num text-secondary">04</div>
          <div className="p-8 md:p-16 border-b border-[#E5E5E1] grid-line-b-light">
            <h2 className="font-label-caps text-label-caps text-secondary tracking-widest uppercase mb-2">The Journey</h2>
            <h3 className="font-headline-md text-3xl text-primary font-serif">Since 2009.</h3>
          </div>
          {/* Horizontal Scrolling Timeline / Grid */}
          <div className="flex overflow-x-auto no-scrollbar border-b border-[#1A1A1A] min-h-[300px]">
            {TIMELINE.map((t) => (
              <div key={t.year} className="min-w-[300px] flex-1 border-r border-[#E5E5E1] grid-line-r-light p-8 relative group hover:bg-surface-container-high transition-colors">
                <div className="font-headline-md text-4xl text-outline mb-6 group-hover:text-brand-gold transition-colors font-serif">{t.year}</div>
                <h4 className="font-label-caps text-label-caps uppercase text-primary mb-4 font-bold">Milestone</h4>
                <p className="font-body-sm text-body-sm text-secondary">
                  {t.text}
                </p>
                <div className="absolute left-8 bottom-8 w-[1px] h-12 bg-secondary-container group-hover:bg-brand-gold"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Showroom Gallery Bento Grid (05) */}
        <section className="relative w-full border-b border-[#1A1A1A] grid-line-b">
          <div className="absolute top-4 left-4 font-index-num text-index-num text-secondary z-10">05</div>
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 h-auto md:h-[80vh]">
            {/* Text Block */}
            <div className="col-span-1 md:col-span-1 row-span-1 border-r border-b border-[#1A1A1A] p-8 pt-16 flex flex-col justify-end bg-surface">
              <h2 className="font-label-caps text-label-caps text-secondary tracking-widest uppercase mb-2">The Space</h2>
              <h3 className="font-headline-md text-2xl text-primary font-serif">Our {BUSINESS.city} Studio.</h3>
              <p className="font-body-sm text-body-sm text-secondary mt-4 story-paragraph">Designed to let natural light reveal the true colors and textures of our silks. A sanctuary for designers.</p>
            </div>
            {/* Large Image */}
            <div className="col-span-1 md:col-span-2 row-span-2 border-r border-[#1A1A1A] relative overflow-hidden group">
              <img
                src="/images/about/showroom-1.jpg"
                alt="Showroom view"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute bottom-4 right-4 bg-white/90 px-2 py-1 border border-[#1A1A1A] font-index-num text-index-num">IMG 01</div>
            </div>
            {/* Small Image Top */}
            <div className="col-span-1 md:col-span-1 row-span-1 border-b border-[#1A1A1A] relative overflow-hidden group">
              <img
                src="/images/about/showroom-2.jpg"
                alt="Bolts display"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute bottom-4 right-4 bg-white/90 px-2 py-1 border border-[#1A1A1A] font-index-num text-index-num">IMG 02</div>
            </div>
            {/* Action Block Bottom Left */}
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-1 md:col-span-1 row-span-1 border-r border-[#1A1A1A] bg-surface-container flex items-center justify-center p-8 group cursor-pointer hover:bg-surface-variant transition-colors text-center"
            >
              <div>
                <span className="material-symbols-outlined text-4xl text-brand-gold mb-4">pin_drop</span>
                <h4 className="font-label-caps text-label-caps uppercase text-primary">Indiranagar</h4>
                <p className="font-index-num text-secondary mt-2">VIEW ON MAP</p>
              </div>
            </a>
            {/* Small Image Bottom Right */}
            <div className="col-span-1 md:col-span-1 row-span-1 relative overflow-hidden group">
              <img
                src="/images/about/craft.jpg"
                alt="Craftsmanship detail"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute bottom-4 right-4 bg-white/90 px-2 py-1 border border-[#1A1A1A] font-index-num text-index-num">IMG 03</div>
            </div>
          </div>
        </section>

        {/* CTA Section (06) */}
        <section className="relative w-full border-b border-[#1A1A1A] grid-line-b py-24 px-8 md:px-16 flex flex-col items-center justify-center text-center bg-surface">
          <div className="absolute top-4 left-4 font-index-num text-index-num text-secondary">06</div>
          <span className="material-symbols-outlined text-5xl text-brand-gold mb-6 font-light block" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>calendar_month</span>
          <h2 className="font-display-lg-mobile md:font-headline-md text-3xl text-primary mb-4 max-w-2xl font-serif">Experience the drape in person.</h2>
          <p className="font-body-lg text-body-lg text-secondary max-w-xl mb-10 story-paragraph">
            We invite designers and connoisseurs to visit our atelier for a personalized curation session.
          </p>
          <a
            href={WA_VISIT}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1A1A1A] text-white px-8 py-4 font-label-caps text-label-caps uppercase tracking-widest hover:bg-brand-gold hover:text-white transition-colors inline-flex items-center gap-3 group"
          >
            BOOK AN IN-PERSON CONSULTATION
          </a>
          <p className="font-index-num text-index-num text-secondary mt-6 flex items-center gap-1 justify-center">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}>info</span> By appointment only.
          </p>
        </section>
      </main>
    </div>
  );
}
