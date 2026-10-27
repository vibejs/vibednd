import { defineConfig } from 'vite';
import tailwind from '@tailwindcss/vite';
import { vibe } from '@usevibejs/compiler/vite';
export default defineConfig({
  plugins: [vibe(), tailwind()],
  server: { hmr: false, watch: { ignored: ['**/.artifacts/**', '**/site-dist/**'] } },
  resolve: {
    alias: { '@usevibejs/dnd': new URL('./src/index.ts', import.meta.url).pathname },
    dedupe: ['@usevibejs/ui'],
  },
  build: { outDir: 'site-dist' },
});
