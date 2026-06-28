import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Dedykowana konfiguracja testów — bez pluginów Cloudflare/React Router.
export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
});
