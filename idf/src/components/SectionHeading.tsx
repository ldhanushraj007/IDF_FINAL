import { motion } from 'framer-motion';
import Reveal from './Reveal';

interface SectionHeadingProps {
  kicker: string;
  title: string;
  sub?: string;
  light?: boolean;
  align?: 'left' | 'center';
}

/** Heading with the house "gold thread" that draws itself in on scroll. */
export default function SectionHeading({
  kicker,
  title,
  sub,
  light = false,
  align = 'center',
}: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <Reveal className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className={light ? 'kicker-light' : 'kicker'}>{kicker}</p>
      <h2
        className={`mt-4 font-serif text-3xl leading-[1.1] sm:text-4xl md:text-5xl md:leading-[1.08] ${
          light ? 'text-ivory' : 'text-ink'
        }`}
      >
        {title}
      </h2>
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`mt-5 block h-px w-24 bg-gold sm:mt-6 ${centered ? 'mx-auto' : ''} origin-left`}
        aria-hidden="true"
      />
      {sub && (
        <p
          className={`mt-5 text-sm leading-relaxed sm:mt-6 sm:text-[15px] ${
            light ? 'text-ivory/65' : 'text-muted'
          }`}
        >
          {sub}
        </p>
      )}
    </Reveal>
  );
}
