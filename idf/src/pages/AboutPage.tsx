import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Gem, Globe2, HandHeart, Sparkles, Users } from 'lucide-react';
import { BUSINESS, WA_VISIT } from '../lib/constants';
import Reveal from '../components/Reveal';

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
  useEffect(() => {
    document.title = `About Us | ${BUSINESS.name}`;
  }, []);

  return (
    <div className="bg-ivory pt-20 sm:pt-24">
      {/* ---------- Hero / Our Story ---------- */}
      <section className="container-lux py-16 sm:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative mx-auto w-full max-w-md pb-6 sm:pb-0 lg:max-w-none">
            <span
              className="absolute -inset-2 translate-x-3 translate-y-3 border border-gold/40 sm:-inset-3 sm:translate-x-6 sm:translate-y-6"
              aria-hidden="true"
            />
            <img
              src="/images/about/story.jpg"
              alt="In Design Luxury Fabrics showroom interior"
              loading="lazy"
              decoding="async"
              className="relative aspect-[5/6] w-full rounded-[3px] object-cover"
            />
          </Reveal>
          <Reveal delay={0.15}>
            <p className="kicker">Our Story</p>
            <h1 className="mt-4 font-serif text-4xl leading-[1.08] text-ink sm:text-5xl">
              Luxury Woven Into Every Thread
            </h1>
            <p className="mt-6 text-[15px] leading-relaxed text-muted">
              {BUSINESS.name} began in {BUSINESS.city} as a single counter of Banarasi silks and
              grew into a trusted address for couture and bridal fabric — not by chasing every
              trend, but by refusing to compromise on what goes into a single length of cloth.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              We believe fabric is the first decision in any garment, and the one every other
              decision depends on. A weak fabric cannot be tailored into a strong dress. So we
              spend our time where it matters most: sourcing, inspecting, and standing behind
              every metre we sell.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- Vision & Mission ---------- */}
      <section className="bg-night py-16 text-ivory sm:py-24">
        <div className="container-lux grid gap-10 sm:grid-cols-2 sm:gap-14">
          <Reveal>
            <p className="kicker-light">Our Vision</p>
            <h2 className="mt-3 font-serif text-2xl leading-snug sm:text-3xl">
              To be the fabric house Indian designers reach for first
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-ivory/65">
              We want a stylist in Mumbai and a bride\u2019s mother in Bengaluru to think of the same
              name when they think of fabric they can trust sight unseen.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="kicker-light">Our Mission</p>
            <h2 className="mt-3 font-serif text-2xl leading-snug sm:text-3xl">
              Provenance and honesty in every sale
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-ivory/65">
              Every fabric we stock is bought with the weaver\u2019s name attached. We pass that
              provenance on, price honestly, and never sell a customer more than they need.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- Why Choose Us ---------- */}
      <section className="container-lux py-16 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">Why Choose Us</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight text-ink sm:text-4xl">
            What sets the showroom apart
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={(i % 3) * 0.08}>
              <div className="h-full rounded-[3px] border border-walnut/12 bg-cream p-6">
                <v.icon className="h-7 w-7 text-gold-dark" strokeWidth={1.5} />
                <h3 className="mt-4 font-serif text-xl text-ink">{v.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Craftsmanship ---------- */}
      <section className="overflow-hidden bg-cream py-16 sm:py-24">
        <div className="container-lux grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal delay={0.1} className="order-2 lg:order-1">
            <p className="kicker">Our Craftsmanship</p>
            <h2 className="mt-4 font-serif text-3xl leading-[1.1] text-ink sm:text-4xl">
              Every thread has a hand behind it
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">
              Zardozi, zari, kadhwa, jamdani — the techniques behind our fabrics take years to
              learn and hours per metre to execute. We work directly with the artisans who hold
              that knowledge, rather than through layers of trading houses.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              That directness is what lets us tell you exactly what you\u2019re buying: which region,
              which technique, sometimes which family.
            </p>
          </Reveal>
          <Reveal className="relative order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
            <img
              src="/images/about/craft.jpg"
              alt="Hand embroidery and zari thread detail"
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full rounded-[3px] object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* ---------- Timeline ---------- */}
      <section className="container-lux py-16 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">Milestones</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight text-ink sm:text-4xl">
            Since {TIMELINE[0].year}
          </h2>
        </Reveal>
        <div className="mx-auto mt-12 max-w-2xl space-y-8 border-l border-gold/30 pl-8">
          {TIMELINE.map((t, i) => (
            <Reveal key={t.year} delay={i * 0.08} className="relative">
              <span className="absolute -left-[38px] top-1 h-3 w-3 rounded-full border-2 border-gold bg-ivory" />
              <p className="font-nums text-sm font-semibold uppercase tracking-[0.14em] text-gold-dark">
                {t.year}
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Showroom ---------- */}
      <section className="bg-night py-16 sm:py-24">
        <div className="container-lux">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="kicker-light">Visit Us</p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-ivory sm:text-4xl">
              Step into the showroom
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-ivory/60">
              {BUSINESS.addressLine1}, {BUSINESS.addressLine2}
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6">
            <Reveal>
              <img
                src="/images/about/showroom-1.jpg"
                alt="In Design Luxury Fabrics showroom floor"
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full rounded-[3px] object-cover"
              />
            </Reveal>
            <Reveal delay={0.1}>
              <img
                src="/images/about/showroom-2.jpg"
                alt="Fabric bolts displayed in the showroom"
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full rounded-[3px] object-cover"
              />
            </Reveal>
          </div>

          <Reveal className="mt-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:gap-6">
            <a href={WA_VISIT} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-sheen">
              Plan a Visit
            </a>
            <Link to="/#shop" className="btn btn-ghost-light">
              Shop Online Instead
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
