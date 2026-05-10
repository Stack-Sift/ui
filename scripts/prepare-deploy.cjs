// Runs after `vite build`. The vite cloudflare plugin emits the compiled
// worker to dist/<worker_name>/ (where <worker_name> is the wrangler `name`
// with hyphens converted to underscores). Find that directory and rewrite
// the root wrangler.jsonc so `wrangler deploy` (run from project root) can
// resolve the compiled paths.
const fs = require("fs");
const path = require("path");

const distDir = "dist";
const entries = fs.readdirSync(distDir, { withFileTypes: true });

let workerDir = null;
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  if (entry.name === "client") continue;
  const candidate = path.join(distDir, entry.name, "wrangler.json");
  if (fs.existsSync(candidate)) {
    workerDir = entry.name;
    break;
  }
}

if (!workerDir) {
  throw new Error(
    `prepare-deploy: no <dist>/*/wrangler.json found. dist contains: ${entries
      .map((e) => e.name)
      .join(", ")}`
  );
}

const generated = JSON.parse(
  fs.readFileSync(path.join(distDir, workerDir, "wrangler.json"), "utf8")
);

const resolved = {
  $schema: "node_modules/wrangler/config-schema.json",
  name: generated.name,
  compatibility_date: generated.compatibility_date,
  compatibility_flags: generated.compatibility_flags,
  main: `dist/${workerDir}/index.js`,
  no_bundle: true,
  assets: { directory: "dist/client" },
};

fs.writeFileSync("wrangler.jsonc", JSON.stringify(resolved, null, 2) + "\n");
console.log(
  `wrangler.jsonc rewritten: main=dist/${workerDir}/index.js, assets=dist/client`
);
