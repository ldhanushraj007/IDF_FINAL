import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        /**
         * Splits the big third-party libraries out of the main bundle.
         *
         * Before this, everything landed in one ~660 kB chunk, which a phone on
         * patchy mobile data has to download in full before the first pixel of
         * the shop appears. Splitting them means the browser fetches them in
         * parallel, and — more importantly — a code change to the site doesn't
         * invalidate the cached copy of React or Framer Motion on repeat
         * visits, since those files keep their own hash.
         *
         * qrcode is only used at the payment step of checkout, so it stays out
         * of what a first-time visitor downloads.
         */
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-qrcode': ['qrcode'],
        },
      },
    },
  },
});
