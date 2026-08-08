import Reveal from './Reveal';

export default function Atelier() {
  return (
    <section id="atelier" className="scroll-mt-20 overflow-hidden bg-ivory py-16 sm:py-24 lg:py-28">
      <div className="container-lux grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Layered imagery */}
        <Reveal className="relative mx-auto w-full max-w-md pb-6 sm:pb-0 lg:max-w-none">
          <span
            className="absolute -inset-2 translate-x-3 translate-y-3 border border-gold/40 sm:-inset-3 sm:translate-x-6 sm:translate-y-6"
            aria-hidden="true"
          />
          <img
            src="/images/about/story.jpg"
            alt="Warm light falling across draped heritage silks in the showroom"
            loading="lazy"
            decoding="async"
            className="relative aspect-[5/6] w-[88%] rounded-[3px] object-cover"
          />
          <img
            src="/images/about/craft.jpg"
            alt="Gold zari thread detail from the embroidery atelier"
            loading="lazy"
            decoding="async"
            className="absolute -bottom-2 right-0 aspect-square w-[48%] rounded-[3px] border-4 border-ivory object-cover shadow-[0_28px_60px_-28px_rgba(42,31,23,0.55)] sm:-bottom-8 sm:w-[52%] sm:border-[6px]"
          />
        </Reveal>

        {/* Copy */}
        <Reveal delay={0.15}>
          <p className="kicker">The Atelier</p>
          <h2 className="mt-4 font-serif text-3xl leading-[1.1] text-ink sm:text-4xl md:text-5xl md:leading-[1.08]">
            A legacy woven in silk
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted sm:mt-6 sm:text-[15px]">
            Founded in 2009 by a family of third-generation textile connoisseurs, In Design began
            as a single counter of Banarasi silks and grew into Bengaluru&rsquo;s quiet address for
            couture fabric — steps away from Commercial Street.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-[15px]">
            Every length is bought with a name attached — the weaver&rsquo;s. That provenance, and
            a refusal to compromise on it, is the whole story of the house.
          </p>
          <p className="mt-6 border-l-2 border-gold pl-4 font-serif text-lg italic leading-relaxed text-walnut sm:mt-7 sm:pl-5 sm:text-xl">
            &ldquo;Fabric is the first sketch of every masterpiece.&rdquo;
          </p>
          <div className="mt-8 sm:mt-9">
            <a href="#visit" className="btn btn-ghost-dark w-full sm:w-auto">
              Visit the Showroom
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
