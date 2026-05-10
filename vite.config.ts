// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Netlify always injects NETLIFY=true during its builds. Anything else
// (Cloudflare Pages, Cloudflare Workers Builds, local dev) defaults to the
// Cloudflare Workers target so `dist/server/index.js` is generated for wrangler.
const isNetlify = process.env.NETLIFY === "true";

export default defineConfig({
  // On Netlify, disable the Cloudflare plugin and prerender to static HTML.
  // Otherwise enable Cloudflare Workers SSR.
  cloudflare: isNetlify ? false : {},
  tanstackStart: {
    prerender: {
      enabled: isNetlify,
      crawlLinks: true,
    },
  },
});
