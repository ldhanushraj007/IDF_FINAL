/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        touch: { raw: '(hover: none)' },
      },
      colors: {
        // ── NEW BRAND PALETTE (Customer-facing) ──────────────────────────────
        /** Primary blush — #FFE6E9 */
        blush: { DEFAULT: '#FFE6E9', dark: '#f5ced2', light: '#fff5f6' },
        /** Deep ink accent — #1F0505 — used sparingly */
        ink: { DEFAULT: '#1F0505', soft: '#3a0a0a', muted: '#6b3030' },
        /** Pure white */
        white: '#FFFFFF',

        // ── LEGACY TOKENS — KEPT FOR ADMIN PANEL COMPATIBILITY ───────────────
        // Do NOT remove; admin panel uses these
        ivory: '#dec3b4',
        cream: '#ece0d8',
        sand: '#dec3b4',
        night: '#1c0505',
        chocolate: '#2d0a0a',
        maroon: { DEFAULT: '#7a2424', dark: '#4d0a0a' },
        walnut: { light: '#966448', DEFAULT: '#7a4e35', dark: '#5c3924' },
        muted: '#6b5447',

        // ── MATERIAL DESIGN TOKENS — KEPT FOR EXISTING COMPONENTS ────────────
        "inverse-surface": "#2f312e",
        "secondary": "#5e5f5b",
        "secondary-container": "#e3e3de",
        "on-primary-container": "#858383",
        "surface-container-highest": "#e3e3df",
        "outline-variant": "#c4c7c7",
        "on-primary-fixed": "#1c1b1b",
        "on-error-container": "#93000a",
        "on-tertiary-container": "#868382",
        "on-secondary": "#ffffff",
        "on-background": "#1a1c1a",
        "surface-container-lowest": "#ffffff",
        "secondary-fixed": "#e3e3de",
        /** surface — used as white base; updated to pure white */
        "surface": "#FFFFFF",
        "tertiary": "#000000",
        "on-secondary-container": "#646561",
        "on-surface": "#1F0505",
        "on-tertiary": "#ffffff",
        "secondary-fixed-dim": "#c7c7c2",
        "surface-tint": "#5f5e5e",
        "primary-fixed": "#e5e2e1",
        "surface-container": "#FFE6E9",
        "surface-variant": "#fff5f6",
        "primary": "#1F0505",
        "error-container": "#ffdad6",
        "surface-bright": "#FFFFFF",
        "primary-container": "#1F0505",
        "on-error": "#ffffff",
        "on-primary": "#ffffff",
        "primary-fixed-dim": "#c8c6c5",
        "tertiary-container": "#1c1b1a",
        "inverse-on-surface": "#f1f1ed",
        "error": "#ba1a1a",
        "on-surface-variant": "#444748",
        "on-tertiary-fixed": "#1c1b1a",
        "surface-dim": "#FFE6E9",
        "on-tertiary-fixed-variant": "#484645",
        "surface-container-low": "#fff5f6",
        "outline": "#1F0505",
        "on-secondary-fixed": "#1b1c19",
        "inverse-primary": "#c8c6c5",
        "surface-container-high": "#FFE6E9",
        "on-secondary-fixed-variant": "#464744",
        "tertiary-fixed-dim": "#cac6c4",
        "tertiary-fixed": "#e6e2df",
        "background": "#FFFFFF",
        "on-primary-fixed-variant": "#474746",

        // ── GOLD — kept for admin panel & select customer elements ────────────
        "brand-gold": "#B8860B",
        "accent-gold": "#B8860B",
        "gold": { DEFAULT: '#B8860B', light: '#e5c55c', dark: '#a8831f' },
        "accent": "#B8860B",
        "brand-accent": "#B8860B",
      },
      fontFamily: {
        // Display/editorial — Cormorant Garamond
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        // UI/interface — Manrope with Inter fallback
        sans: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        manrope: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Legacy font tokens (kept for admin)
        "headline-md": ["Playfair Display", "serif"],
        "body-lg": ["Manrope", "Inter", "sans-serif"],
        "body-sm": ["Manrope", "Inter", "sans-serif"],
        "label-caps": ["Manrope", "Inter", "sans-serif"],
        "index-num": ["Manrope", "Inter", "sans-serif"],
        "display-lg": ['"Cormorant Garamond"', "serif"],
        "display-lg-mobile": ['"Cormorant Garamond"', "serif"],
      },
      fontSize: {
        "headline-md": ["32px", { "lineHeight": "40px", "fontWeight": "400" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "body-sm": ["14px", { "lineHeight": "22px", "fontWeight": "400" }],
        "label-caps": ["12px", { "lineHeight": "16px", "letterSpacing": "0.1em", "fontWeight": "600" }],
        "index-num": ["11px", { "lineHeight": "12px", "fontWeight": "400" }],
        "display-lg": ["84px", { "lineHeight": "92px", "letterSpacing": "-0.02em", "fontWeight": "400" }],
        "display-lg-mobile": ["48px", { "lineHeight": "52px", "fontWeight": "400" }],
      },
      transitionTimingFunction: {
        lux: 'cubic-bezier(0.22, 1, 0.36, 1)',
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(31, 5, 5, 0.2)' },
          '70%': { boxShadow: '0 0 0 16px rgba(31, 5, 5, 0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        kenburns: {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(1.08)' },
        },
        'thread-drop': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '35%': { opacity: '1' },
          '100%': { transform: 'translateY(34px)', opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.6s ease-out infinite',
        marquee: 'marquee 32s linear infinite',
        kenburns: 'kenburns 12s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'thread-drop': 'thread-drop 2.2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
