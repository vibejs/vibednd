import { defineConfig } from "vite";
import { vibe } from "@usevibejs/compiler/vite";
export default defineConfig({
  plugins: [vibe()],
  resolve: {
    alias: { "@usevibejs/dnd": new URL("./src/index.ts", import.meta.url).pathname },
    dedupe: ["@usevibejs/ui"],
  },
  build: { outDir: "site-dist" },
});
