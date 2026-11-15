// Does a search arrive at its results, and do the results say what was searched?
//
// A visitor chooses where, when and how many on the home page and presses
// Search. This follows that choice through the pieces that carry it: the
// address the home page builds, what the results page reads back from it, the
// heading it shows, the price it quotes for that group, and the link it puts on
// each package. It also reads the results page to make sure nothing has been
// put back between a search and its answer.
//
//   node --experimental-strip-types scripts/check_search.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { datesLabel, dayOf, presetQuery, priceFor, readPreset, searchTitle } from "../src/lib/filters.ts";
import { catalogueHref } from "../src/lib/homeLinks.ts";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// The home page's search, with dates, as an address.
const href = catalogueHref({ where: "state:qld", guests: 7, style: "Hens", start: new Date(2026, 11, 11), end: new Date(2026, 11, 13) });
assert.equal(href, "/package-search/?state=QLD&girls=7&style=hens&from=2026-12-11&to=2026-12-13");

// What the results page reads back from it.
const got = readPreset(href.split("?")[1]);
assert.deepEqual(
  { state: got.state, girls: got.girls, style: got.style, from: got.from, to: got.to },
  { state: "QLD", girls: 7, style: "hens", from: "2026-12-11", to: "2026-12-13" },
);

// And written back to the address unchanged, so a refresh or a shared link is the same search.
assert.deepEqual(readPreset(presetQuery(got).slice(1)), got);
assert.equal(presetQuery({}), "");

// A day is the day they picked, whatever the clock says in UTC.
assert.equal(dayOf(new Date(2026, 0, 3, 0, 5)), "2026-01-03");
assert.equal(datesLabel("2026-12-11", "2026-12-13"), "11–13 Dec");
assert.equal(datesLabel("2026-12-30", "2027-01-02"), "30 Dec – 2 Jan");
assert.equal(datesLabel("2026-12-11"), "11 Dec");

// Nonsense in the address is not a filter.
const junk = readPreset("girls=900&from=tomorrow&to=2026-01-01&sort=sideways");
assert.deepEqual({ girls: junk.girls, from: junk.from, to: junk.to, sort: junk.sort }, { girls: 0, from: "", to: "", sort: "featured" });
// An end before its start is not a range.
assert.equal(readPreset("from=2026-12-13&to=2026-12-11").to, "");

// The heading says the search back.
assert.equal(searchTitle({ style: "Hens", state: "QLD", girls: 7 }), "Hens getaways in Queensland for 7 girls");
assert.equal(searchTitle({ place: "gold-coast" }, "Gold Coast"), "Getaways in Gold Coast");
assert.equal(searchTitle({ girls: 1 }), "Getaways for 1 girl");
assert.equal(searchTitle({}), "");

// The price is the price for the group that was searched for.
const table = [
  { girls: 4, price: 575 },
  { girls: 6, price: 599 },
  { girls: 7, price: 629 },
  { girls: 8, price: 575 },
  { girls: 8, price: 640 },
];
assert.deepEqual(priceFor(table, 7), { price: 629, exact: true, options: 1 });
// A size she offers two ways is "from" the lower.
assert.deepEqual(priceFor(table, 8), { price: 575, exact: true, options: 2 });
// A size she has not priced is not given a price of its own.
assert.deepEqual(priceFor(table, 5), { price: 575, exact: false, options: 0 });
assert.equal(priceFor([], 7), null);

// Every real package: a group inside its range gets a price that is in its own table.
const catalogue = JSON.parse(read("docs/portal-handoff/packages.json"));
for (const p of catalogue) {
  const rows = (p.data.price_table ?? []).map((r) => ({ girls: Number(r.girls), price: Number(r.price) }));
  for (const r of rows) {
    const got = priceFor(rows, r.girls);
    if (!(r.price > 0)) continue;
    assert.ok(got?.exact && got.price <= r.price, `${p.slug}: wrong price for ${r.girls}`);
  }
}

// On the results page, nothing sits between a search and its results.
const page = read("src/app/(site)/package-search/page.tsx");
const body = page.slice(page.indexOf("return ("));
assert.ok(body.indexOf("<CatalogueBrowser") > -1 && body.indexOf("<CatalogueBrowser") < body.indexOf("<Concierge"), "the concierge is above the results again");
// The search is read on the server, so the first thing sent is the answer.
assert.match(page, /searchParams/);
// And a package's link carries who is going and when.
assert.match(read("src/components/catalogue/CatalogueBrowser.tsx"), /presetQuery\(\{ girls, from: dates\.from, to: dates\.to \}\)/);

console.log("✔ a search arrives at its results, priced for the group, with the dates carried through");
