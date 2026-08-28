import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeInUpVariants } from '../lib/motionVariants';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
}

/** Gentle fade-and-rise on scroll into view. */
export default function Reveal({ children, delay = 0, y = 24, className, style }: RevealProps) {
  const customVariants = {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      variants={customVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
