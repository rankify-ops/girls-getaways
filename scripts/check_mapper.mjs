/*
 * Run the portal mapper over the real captured catalogue, offline.
 *
 * The first live call to the portal shouldn't be the first time this mapping
 * runs. docs/portal-handoff/packages.json is exactly what the endpoint will
 * serve (same rows, same shapes), so feeding it through mapItem() here proves
 * the mapping before the endpoint exists.
 *
 * Run: node scripts/check_mapper.mjs
 */
import { readFileSync } from "node:fs";
import { mapItem, fromPrice, priceLabel } from "../src/lib/portal.ts";

const items = JSON.parse(readFileSync("docs/portal-handoff/packages.json", "utf8"));
const mapped = items.map((it, i) => mapItem(it, i));

const problems = [];
const check = (cond, msg) => cond && problems.push(msg);

for (const p of mapped) {
  check(!p.title, `${p.slug}: no title`);
  check(!p.priceTable.length, `${p.slug}: no price rows survived mapping`);
  check(fromPrice(p.priceTable) === null, `${p.slug}: no "from" price could be computed`);
  check(!p.blurb, `${p.slug}: no blurb`);
  check(!p.heroImage, `${p.slug}: no hero image`);
  check(!p.inclusions.length, `${p.slug}: inclusions lost in mapping`);
  check(!p.styles.length, `${p.slug}: styles lost in mapping`);
  check(p.guestsMin === null || p.guestsMax === null, `${p.slug}: guest range not derived`);
  check(p.guestsMin > p.guestsMax, `${p.slug}: guest range inverted`);
}

// The two-accommodation packages are the ones most likely to be mangled.
const twoWay = mapped.filter(
  (p) => new Set(p.priceTable.map((r) => r.girls)).size !== p.priceTable.length,
);

console.log(`mapped ${mapped.length} packages`);
console.log(`  cheapest: ${priceLabel(mapped.reduce((a, b) =>
  fromPrice(a.priceTable) < fromPrice(b.priceTable) ? a : b).priceTable)}`);
console.log(`  dearest:  ${priceLabel(mapped.reduce((a, b) =>
  fromPrice(a.priceTable) > fromPrice(b.priceTable) ? a : b).priceTable)}`);
console.log(`  packages with two accommodation types: ${twoWay.length}`);
for (const p of twoWay) {
  const dupes = p.priceTable.filter(
    (r, i, all) => all.findIndex((x) => x.girls === r.girls) !== i,
  );
  console.log(`    ${p.slug}: ${dupes.map((d) => `${d.girls} girls $${d.price}`).join(", ")}` +
    `${p.notes ? " — notes present" : " — NO notes to explain it"}`);
}
console.log(`  rows preserved in page order: ${
  mapped.every((p) => {
    const src = items.find((i) => i.slug === p.slug).data.price_table;
    return JSON.stringify(src) === JSON.stringify(p.priceTable);
  }) ? "yes" : "NO"
}`);

if (problems.length) {
  console.log(`\n!! ${problems.length} problems`);
  for (const p of problems.slice(0, 20)) console.log("  -", p);
  process.exit(1);
}
console.log("\nno problems");
