import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // cloudflare:workers is a Cloudflare runtime virtual module; stub it so
      // unit tests can import service/repo modules without a real Worker env.
      "cloudflare:workers": resolve(__dirname, "src/__mocks__/cloudflare-workers.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
