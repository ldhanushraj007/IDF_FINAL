/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        touch: { raw: '(hover: none)' },
      },
      colors: {
        /**
         * CLIENT BRAND PALETTE
         * Main 4 colors:
         *  - Walnut: #7a4e35
         *  - Sand/Ivory: #dec3b4
         *  - Night: #1c0505
         *  - Gold: #d3aa32
         */
        ivory: '#dec3b4',
        cream: '#ece0d8',
        sand: '#dec3b4',
        night: '#1c0505',
        chocolate: '#2d0a0a',
        ink: '#1c0505',
        maroon: { DEFAULT: '#7a2424', dark: '#4d0a0a' },
        gold: { light: '#e5c55c', DEFAULT: '#d3aa32', dark: '#a8831f' },
        walnut: { light: '#966448', DEFAULT: '#7a4e35', dark: '#5c3924' },
        muted: '#6b5447',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        lux: 'cubic-bezier(0.22, 1, 0.36, 1)',
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(211, 170, 50, 0.45)' },
          '70%': { boxShadow: '0 0 0 16px rgba(211, 170, 50, 0)' },
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
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.6s ease-out infinite',
        marquee: 'marquee 32s linear infinite',
        kenburns: 'kenburns 12s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'thread-drop': 'thread-drop 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
