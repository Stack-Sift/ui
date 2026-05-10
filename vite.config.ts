// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
    // Disable @cloudflare/vite-plugin so the server bundle targets Node.js.
    // This lets TanStack Start's prerender step start a local preview server
    // and write static HTML into dist/client/, giving Netlify an index.html
    // for its SPA fallback redirect (/* → /index.html).
    cloudflare: false,
    tanstackStart: {
        prerender: {
            enabled: true,
            // Follow <a> links discovered in each rendered page so all static
            // routes (/, /login, /signup, /check-email) are written to disk.
            crawlLinks: true,
        },
    },
});