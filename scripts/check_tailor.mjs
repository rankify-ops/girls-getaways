// When nothing on the shelf fits, does the site still ask for the trip?
//
// The words a visitor reads when no set package answers them, and the message
// that reaches the inbox, are made in src/lib/tailor.ts. This checks both, and
// reads the three screens that can come up empty to make sure none of them
// has gone back to telling a visitor she doesn't do that.
//
//   node --experimental-strip-types scripts/check_tailor.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TAILOR_ITEM, WISHES, groupOf, occasionOf, tailorHeadline, tailorMessage } from "../src/lib/tailor.ts";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// The occasion they named, said back.
assert.equal(occasionOf("Hens weekend in Byron for 20"), "hens trip");
assert.equal(occasionOf("my sister's hen's do"), "hens trip");
assert.equal(occasionOf("bridal shower for 15"), "bridal shower");
assert.equal(occasionOf("Mel's 40th, 8 of us"), "birthday getaway");
assert.equal(occasionOf("skiing in Japan for 6"), "getaway");
// "then" and "when" are not hens parties.
assert.equal(occasionOf("when can we go, and then what"), "getaway");

// The group they counted, not one more than it.
assert.equal(tailorHeadline("Hens weekend in Byron for 20", 20), "We’ll tailor a hens trip for the 20 of you");
assert.equal(tailorHeadline("skiing in Japan", null), "We’ll tailor a getaway around your girls");
assert.equal(groupOf(1), null);
assert.equal(groupOf(4000), null);
assert.equal(groupOf(12), 12);

// The inbox gets their words, what they ticked and what they added, and nothing empty.
const msg = tailorMessage({ asked: "hens in Byron for 20", wishes: ["Grazing platter", "Bottomless brunch"], notes: " late March " });
assert.match(msg, /Looking for: “hens in Byron for 20”/);
assert.match(msg, /Would love: Grazing platter, Bottomless brunch/);
assert.match(msg, /Their notes: late March/);
assert.match(msg, /Nothing is booked/);
const bare = tailorMessage({});
assert.doesNotMatch(bare, /Looking for|Would love|Their notes/);

// A wish is something to ask for. Each one is in her own packages somewhere.
const catalogue = JSON.parse(read("docs/portal-handoff/packages.json"));
const said = catalogue.map((p) => `${p.data.description ?? ""} ${JSON.stringify(p.data.inclusions ?? "")}`.toLowerCase()).join(" ");
const stemOf = { Massages: "massage", Facials: "facial", "Dinner out": "dinner", "Lunch cruise": "cruise" };
for (const w of WISHES) assert.ok(said.includes((stemOf[w] ?? w).toLowerCase()), `no package mentions "${w}"`);

// Her inbox files an enquiry under its item. A name with a space can never be a package's slug.
assert.match(TAILOR_ITEM, /\s/);

// And no screen that can come up empty says she doesn't do it.
const NO = /don(?:'|&apos;|’)t have|nothing (?:in the collection )?matches|no (?:set )?packages/i;
for (const p of [
  "src/components/catalogue/Concierge.tsx",
  "src/components/catalogue/CatalogueBrowser.tsx",
  "src/components/catalogue/TailorMade.tsx",
  "src/components/booking/Results.tsx",
]) {
  // What a visitor reads, not what a comment says about the old wording.
  const shown = read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(shown, NO, `${p} tells a visitor there is nothing for them`);
}
for (const p of ["src/components/catalogue/Concierge.tsx", "src/components/catalogue/CatalogueBrowser.tsx"]) {
  assert.match(read(p), /<TailorMade\b/, `${p} does not offer a tailor-made trip`);
}

console.log("✔ an empty answer asks for the trip, and the request reaches the inbox in their words");
