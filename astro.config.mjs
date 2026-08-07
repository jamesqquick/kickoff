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
      // Email sending kill switch, set via wrangler.jsonc's `vars` (plain
      // text, not a secret). Defaults to "false" there; flip to "true" and
      // redeploy when ready to send real email.
      EMAIL_SENDING_ENABLED: envField.boolean({
        context: "server",
        access: "public",
        default: false,
      }),
    },
  },
});
