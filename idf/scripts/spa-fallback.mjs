// Copies dist/index.html to dist/404.html so client-side routing works on
// static hosts that serve a 404 page for unknown paths (e.g. GitHub Pages).
import { copyFileSync, existsSync } from 'node:fs';

const src = 'dist/index.html';
if (existsSync(src)) {
  copyFileSync(src, 'dist/404.html');
  console.log('SPA fallback created: dist/404.html');
}
