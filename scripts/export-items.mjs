/*
 * src/content/site.ts → docs/portal-handoff/*.json
 *
 * Import-ready rows for the portal's collection_items table: one object per
 * item, already in {slug, status, position, data} shape, so the portal side is
 * a single insert with no reshaping.
 *
 * Regenerate after the full 234-package scrape lands.
 *
 * Run: node scripts/export-items.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { packages, destinations, states, destBySlug } from "../src/content/site.ts";

const OUT = "docs/portal-handoff";
mkdirSync(OUT, { recursive: true });

const stateShort = (code) => states.find((s) => s.code === code)?.short ?? null;

const packageItems = packages.map((p, i) => ({
  slug: p.slug,
  status: "published",
  position: i,
  data: {
    title: p.title,
    venue: p.venue ?? null,
    destination: p.dest,
    area: p.area ?? null,
    blurb: p.blurb ?? null,
    price_from: p.priceFrom ?? null,
    guests_min: p.guests?.[0] ?? null,
    guests_max: p.guests?.[1] ?? null,
    nights: p.nights ?? null,
    // Local file today; becomes an uploaded asset path once the client edits it.
    hero_image: `/img/${p.img}-1600.webp`,
    styles: p.styles,
    tag: p.tag ?? null,
    popular: p.tag === "Featured",
    slots_left: null,
    legacy_path: p.path,
  },
}));

const destinationItems = destinations.map((d, i) => ({
  slug: d.slug,
  status: "published",
  position: i,
  data: { name: d.name, state: stateShort(d.state), blurb: null, image: null },
}));

writeFileSync(`${OUT}/packages.json`, JSON.stringify(packageItems, null, 2) + "\n");
writeFileSync(`${OUT}/destinations.json`, JSON.stringify(destinationItems, null, 2) + "\n");

console.log(`packages.json: ${packageItems.length} items`);
console.log(`destinations.json: ${destinationItems.length} items`);
