// Runs after `vite build`. The vite cloudflare plugin generates
// dist/server/wrangler.json with paths relative to that file. We rewrite
// the root wrangler.jsonc with absolute-from-root paths so `wrangler deploy`
// (run from the project root, post-build) finds the compiled worker.
const fs = require("fs");

const generated = JSON.parse(
  fs.readFileSync("dist/server/wrangler.json", "utf8")
);

const resolved = {
  $schema: "node_modules/wrangler/config-schema.json",
  name: generated.name,
  compatibility_date: generated.compatibility_date,
  compatibility_flags: generated.compatibility_flags,
  main: "dist/server/index.js",
  no_bundle: true,
  assets: { directory: "dist/client" },
};

fs.writeFileSync("wrangler.jsonc", JSON.stringify(resolved, null, 2) + "\n");
console.log("wrangler.jsonc rewritten for deploy");
