import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

// Mirrors the "paths" mapping in tsconfig.json — Vitest (unlike Bun's
// runtime) doesn't read tsconfig path aliases on its own.
function src(relativePath: string) {
  return fileURLToPath(new URL(`./src${relativePath}`, import.meta.url));
}

export default defineConfig({
  resolve: {
    alias: {
      "@controllers": src("/controllers"),
      "@services": src("/services"),
      "@routes": src("/routes"),
      "@core": src("/core"),
      "@utils": src("/utils"),
      "@middlewares": src("/middlewares"),
      src: fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
