import { defineConfig } from "tsdown";
export default defineConfig({
  entry: ["src/index.ts", "src/sortable.ts"],
  format: "esm",
  fixedExtension: false,
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["@usevibejs/ui", /^@dnd-kit\//],
});
