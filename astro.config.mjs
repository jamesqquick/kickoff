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
      // Email sending kill switch. Defaults to false everywhere (including
      // production) so nothing sends until explicitly turned on. Set to
      // `true` via `wrangler secret put EMAIL_SENDING_ENABLED` on the
      // deployed Worker when ready to send real email — this lets us
      // toggle production sending on/off instantly without a redeploy.
      // Never set this locally; local dev should always default to false.
      EMAIL_SENDING_ENABLED: envField.boolean({
        context: "server",
        access: "public",
        default: false,
      }),
    },
  },
});
