import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';

interface CounterProps {
  value: number;
  suffix?: string;
  label: string;
}

export default function Counter({ value, suffix = '+', label }: CounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center">
      <p className="font-nums font-semibold text-3xl text-gold sm:text-4xl md:text-5xl">
        {display.toLocaleString('en-IN')}
        {suffix}
      </p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-ivory/70 sm:mt-3 sm:text-[11px] sm:tracking-[0.25em]">
        {label}
      </p>
    </div>
  );
}
