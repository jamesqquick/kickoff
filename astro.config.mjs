import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: [
        "astro/actions/runtime/entrypoints/route.js",
        "astro/env/runtime",
        "better-auth",
        "kysely-d1",
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-accordion",
        "@radix-ui/react-tooltip",
      ],
    },
  },
  env: {
    validateSecrets: true,
    schema: {
      BETTER_AUTH_SECRET: envField.string({
        context: "server",
        access: "secret",
      }),
      BETTER_AUTH_URL: envField.string({
        context: "server",
        access: "secret",
      }),
      GOOGLE_CLIENT_ID: envField.string({
        context: "server",
        access: "secret",
      }),
      GOOGLE_CLIENT_SECRET: envField.string({
        context: "server",
        access: "secret",
      }),
      EMAIL_FROM_ADDRESS: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // access: "secret" here is required for correctness, not because the
      // value is sensitive (it's a plain "true"/"false" Cloudflare var, not
      // an encrypted secret). Astro's env integration resolves "public"
      // fields once at build time and inlines the result as a literal —
      // "secret" fields are the only ones resolved lazily per-request
      // against the live Cloudflare Worker `env`. Without this, no
      // dashboard/runtime var change would ever take effect.
      EMAIL_SENDING_ENABLED: envField.boolean({
        context: "server",
        access: "secret",
        default: false,
      }),
    },
  },
});
