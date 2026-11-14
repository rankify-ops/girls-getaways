// Does every redirect land somewhere that shows something?
//
// An old address sent to a filter that matches nothing is a 404 with better manners: the
// visitor arrives on "Nothing matches just yet". This runs the site's own filter (lib/filters.ts)
// over the catalogue for every target in src/content/redirects.json and fails if one is empty.
//
//   node --experimental-strip-types scripts/check_redirects.mjs
import { readFileSync } from "node:fs";
import { matchesGirls, matchesPlace, matchesState, matchesStyle, readPreset } from "../src/lib/filters.ts";

const json = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const redirects = json("src/content/redirects.json");
const stateOf = new Map(json("docs/portal-handoff/destinations.json").map((d) => [d.slug, d.data.state ?? null]));
const packages = json("docs/portal-handoff/packages.json").map((p) => {
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

const pages = new Set(["/", "/package-search/", "/the-gg-diaries/", "/#getaways", "/#sisterhood", "/#specials"]);
const all = [
  ...Object.entries(redirects.paths),
  ...Object.entries(redirects.archives).flatMap(([kind, m]) => Object.entries(m).map(([k, v]) => [`/${kind}/${k}`, v])),
];

let empty = 0;
const seen = new Map();
for (const [from, to] of all) {
  if (pages.has(to)) continue;
  const [path, query = ""] = to.split("?");
  if (path !== "/package-search/") {
    console.log(`✖ ${from} → ${to}: not an address this check knows`);
    empty++;
    continue;
  }
  if (!seen.has(to)) {
    const want = readPreset(`?${query}`);
    seen.set(to, packages.filter((p) => matchesPlace(p, want.place) && matchesState(p, want.state) && matchesStyle(p, want.style) && matchesGirls(p, want.girls)).length);
  }
  if (seen.get(to) === 0) {
    console.log(`✖ ${from} → ${to}: shows no packages`);
    empty++;
  }
}
const counts = [...seen.entries()].sort((a, b) => a[1] - b[1]);
console.log(`${all.length} redirects, ${seen.size} distinct filtered targets over ${packages.length} packages`);
console.log(`fewest: ${counts.slice(0, 4).map(([t, n]) => `${t.replace("/package-search/", "")}=${n}`).join("  ")}`);
if (empty) {
  console.log(`${empty} redirect(s) land on nothing`);
  process.exit(1);
}
console.log("✔ every redirect lands on a page that shows something");
