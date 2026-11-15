// Does every choice on the home page lead somewhere real?
//
// The home page offers states, destinations, styles and sixteen featured packages. Each now
// goes to the catalogue or to a package's own page. This runs every one of them through the
// site's own filter and the real catalogue, and fails if a choice would land on an empty
// list or a page that does not exist.
//
//   node --experimental-strip-types scripts/check_home_links.mjs
import { readFileSync } from "node:fs";
import { matchesGirls, matchesPlace, matchesState, matchesStyle, readPreset } from "../src/lib/filters.ts";
import { EXPERIENCE_STYLE, STYLE_PARAM, catalogueHref } from "../src/lib/homeLinks.ts";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const json = (p) => JSON.parse(read(p));

const stateOf = new Map(json("docs/portal-handoff/destinations.json").map((d) => [d.slug, d.data.state ?? null]));
const catalogue = json("docs/portal-handoff/packages.json");
const packages = catalogue.map((p) => {
  const sizes = (p.data.price_table ?? []).map((r) => Number(r.girls)).filter(Number.isFinite);
  return {
    destination: p.data.destination ?? null,
    area: p.data.area ?? null,
    placeTags: (p.data.place_tags ?? []).map(String),
    state: stateOf.get(p.data.destination) ?? null,
    styles: p.data.styles ?? [],
    guestsMin: sizes.length ? Math.min(...sizes) : null,
    guestsMax: sizes.length ? Math.max(...sizes) : null,
  };
});
const shown = (href) => {
  const want = readPreset(href.includes("?") ? href.slice(href.indexOf("?")) : "");
  return packages.filter((p) => matchesPlace(p, want.place) && matchesState(p, want.state) && matchesStyle(p, want.style) && matchesGirls(p, want.girls)).length;
};

// What the home page offers, read out of its own content file.
const site = read("src/content/site.ts");
const states = [...site.slice(site.indexOf("export const states"), site.indexOf("export type Destination")).matchAll(/code: "([a-z]+)"/g)].map((m) => m[1]);
const dests = [...site.slice(site.indexOf("export const destinations"), site.indexOf("export const STYLES")).matchAll(/slug: "([a-z-]+)"/g)].map((m) => m[1]);
const featured = [...site.slice(site.indexOf("export const packages: Package[]"), site.indexOf("export const packagesIn")).matchAll(/path: "([^"]+)"/g)].map((m) => m[1]);

let bad = 0;
const fail = (msg) => {
  console.log(`✖ ${msg}`);
  bad++;
};

for (const code of states) {
  const href = catalogueHref({ where: `state:${code}` });
  if (!shown(href)) fail(`state ${code} → ${href} shows no packages`);
}
for (const slug of dests) {
  const href = catalogueHref({ where: slug });
  if (!shown(href)) fail(`destination ${slug} → ${href} shows no packages`);
}
for (const name of Object.keys(STYLE_PARAM)) {
  const href = catalogueHref({ style: name });
  if (!shown(href)) fail(`style ${name} → ${href} shows no packages`);
}
for (const [tile, style] of Object.entries(EXPERIENCE_STYLE)) {
  const href = catalogueHref({ style });
  if (!shown(href)) fail(`experience ${tile} → ${href} shows no packages`);
}
const real = new Set(catalogue.map((p) => p.slug));
for (const path of featured) {
  const slug = path.replace(/\/+$/, "").split("/").pop();
  if (!path.startsWith("/package-search/") || !real.has(slug)) fail(`featured package ${path} is not a page on this site`);
}

console.log(`${states.length} states, ${dests.length} destinations, ${Object.keys(STYLE_PARAM).length} styles, ${featured.length} featured packages`);
if (bad) {
  console.log(`${bad} choice(s) on the home page lead nowhere`);
  process.exit(1);
}
console.log("✔ every choice on the home page leads to a page that shows something");
