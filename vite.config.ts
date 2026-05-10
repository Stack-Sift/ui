// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// CF_PAGES=1 is injected automatically by Cloudflare Pages during builds.
// On Netlify (and local dev) it is absent, so we fall back to Node.js + prerender.
const isCloudflare = process.env.CF_PAGES === "1";

export default defineConfig({
  // Enable Cloudflare Workers plugin on CF Pages; keep Node.js target elsewhere
  // so Netlify's prerender step can start a local server and write static HTML.
  cloudflare: isCloudflare ? {} : false,
  tanstackStart: {
    prerender: {
      // Prerender is only needed for the static Netlify build.
      enabled: !isCloudflare,
      crawlLinks: true,
    },
  },
});
