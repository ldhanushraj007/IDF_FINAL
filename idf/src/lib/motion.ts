/**
 * MOTION SYSTEM — Single source of truth for all Framer Motion variants.
 *
 * Rule: every component imports from here. No per-component ad-hoc
 * animation variants. If a new variant is needed, add it here first.
 *
 * Easing: cubic-bezier(0.22, 1, 0.36, 1) universally — the "lux" curve.
 * Durations: 150ms micro-interactions, 600–800ms section reveals.
 *            Never 300ms on everything.
 * Stagger: 60–80ms between grid items.
 *
 * Reduced motion: honour MotionConfig reducedMotion="user" in App.tsx —
 * all variants here are safe to animate-away when the OS asks for less.
 */

import type { Variants, Transition } from 'framer-motion';

// ─── Shared easing ──────────────────────────────────────────────────────────

/** The universal easing curve. Use everywhere — no exceptions. */
export const ease = [0.22, 1, 0.36, 1] as const;

/** Base transition using the lux curve. Override duration as needed. */
export const baseTx = (duration: number, delay = 0): Transition => ({
  duration,
  delay,
  ease,
});

// ─── Signature reveal: clip-path wipe ───────────────────────────────────────
/**
 * Fabric unrolling upward. The clip-path goes from fully covering the element
 * (inset from bottom) to fully revealed. This is the house entrance animation.
 *
 * Duration: 750ms — fast enough to feel snappy, slow enough to read.
 * Use as:  <motion.div variants={wipe} initial="hidden" animate="visible">
 */
export const wipe: Variants = {
  hidden: {
    clipPath: 'inset(100% 0% 0% 0%)',
    opacity: 1,          // opacity stays 1 — the clip does all the work
  },
  visible: {
    clipPath: 'inset(0% 0% 0% 0%)',
    opacity: 1,
    transition: baseTx(0.75),
  },
};

/**
 * Wipe that fires on scroll into view (use with whileInView).
 * Suitable for section entry points, headings, any above-fold–excluded element.
 */
export const wipeInView: Variants = {
  hidden: {
    clipPath: 'inset(100% 0% 0% 0%)',
    opacity: 1,
  },
  visible: {
    clipPath: 'inset(0% 0% 0% 0%)',
    opacity: 1,
    transition: baseTx(0.75),
  },
};

// ─── Section reveals ─────────────────────────────────────────────────────────
/**
 * Container for staggered children. Itself is invisible; children animate.
 * Pass staggerDelay to control timing (default 70ms — middle of 60–80ms range).
 */
export const staggerContainer = (staggerDelay = 0.07): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
});

/**
 * Section reveal — 700ms, modest y-shift. Used for section wrappers that
 * animate into view as the user scrolls. Not for individual grid items.
 */
export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: baseTx(0.7),
  },
};

// ─── Grid items ──────────────────────────────────────────────────────────────
/**
 * Individual grid item (product card, gallery cell, etc.).
 * Stagger is handled by the parent staggerContainer.
 * 600ms — crisp but not rushed.
 */
export const gridItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: baseTx(0.6),
  },
};

/**
 * Grid item with wipe entrance. For image-heavy cards where the clip-path
 * reveal is more fitting than a fade-up.
 */
export const gridItemWipe: Variants = {
  hidden: { clipPath: 'inset(100% 0% 0% 0%)', opacity: 1 },
  visible: {
    clipPath: 'inset(0% 0% 0% 0%)',
    opacity: 1,
    transition: baseTx(0.65),
  },
};

// ─── Image frame hover ───────────────────────────────────────────────────────
/**
 * Image hover: scales the image to 1.04 INSIDE a fixed frame.
 * The frame (overflow-hidden container) must NEVER move — only the image
 * inside scales. Duration: 800ms for a slow, luxurious reveal.
 *
 * Apply to the <motion.img> inside an overflow-hidden container.
 * Use whileHover="hover" on the parent article/div.
 */
export const imageHover: Variants = {
  rest: { scale: 1, transition: baseTx(0.8) },
  hover: { scale: 1.04, transition: baseTx(0.8) },
};

// ─── Micro-interactions ───────────────────────────────────────────────────────
/**
 * 150ms micro — for button presses, icon toggles, badge pops.
 * Use animate / whileTap directly for true micro-interactions;
 * this variant is for controlled animated states.
 */
export const micro: Variants = {
  rest: { scale: 1, transition: baseTx(0.15) },
  active: { scale: 0.96, transition: baseTx(0.15) },
};

// ─── Fade overlay ─────────────────────────────────────────────────────────────
/**
 * Simple opacity fade — for overlays, modals, tooltips.
 * Kept intentionally simple: Swiss design doesn't need decorative motion
 * on utility elements. 200ms appear, 150ms disappear.
 */
export const fadeOverlay: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.15, ease } },
  visible: { opacity: 1, transition: { duration: 0.2, ease } },
};

// ─── Modal slide-in ────────────────────────────────────────────────────────────
/**
 * Cart drawer / quick-view modal slide from the right.
 * 500ms — purposeful, not sluggish.
 */
export const slideInRight: Variants = {
  hidden: { x: '100%', transition: baseTx(0.5) },
  visible: { x: 0, transition: baseTx(0.5) },
};

/**
 * Quick-view modal slide up from bottom (mobile) or scale from centre
 * (desktop). Only the y-translation variant — desktop uses plain fade.
 */
export const slideUp: Variants = {
  hidden: { y: '100%', opacity: 0, transition: baseTx(0.4) },
  visible: { y: 0, opacity: 1, transition: baseTx(0.45) },
};

// ─── Hairline rule draw ────────────────────────────────────────────────────────
/**
 * The gold hairline under section headings draws itself in from origin-left.
 * 1.1s — it's a structural element, it should feel deliberate.
 */
export const hairlineDraw: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 1.1, delay: 0.25, ease },
  },
};
