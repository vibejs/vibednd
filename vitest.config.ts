import { defineConfig } from "vitest/config";
import { vibe } from "@usevibejs/compiler/vite";
export default defineConfig({
  plugins: [vibe()],
  test: { environment: "jsdom", include: ["test/**/*.test.ts"], setupFiles: ["test/setup.ts"] },
});
