/*
 * A getaway that is not on the shelf is still a getaway she sells.
 *
 * Most of what the GG team books is designed to order. So when a visitor
 * describes a trip and no set package answers it, the site must not say "we
 * don't have that": it is untrue of the business, and it is the moment the
 * visitor leaves. It says the team will tailor one, asks what they would love
 * in it, and takes their details. That is a lead either way.
 *
 * What it must not do is promise. The wishes below are things to ask the team
 * to go and find, not things in stock: the team comes back with what they can
 * line up and a price. Every sentence a visitor reads says so.
 *
 * Pure, so scripts/check_tailor.mjs can run it.
 */

/*
 * Things a group can ask for.
 *
 * Taken from what her own packages include most often (grazing platters are in
 * 69 of 123, massages in 51), in her words rather than ours: she says "grazing
 * platter", not "cheese platter". This is a starting list for Tom and Shaun to
 * change; a visitor can also type anything they like in the box under it.
 */
export const WISHES = [
  "Grazing platter",
  "Bottomless brunch",
  "High tea",
  "Cocktail class",
  "Wine tour",
  "Massages",
  "Facials",
  "Day spa",
  "Dinner out",
  "Private chef",
  "Lunch cruise",
  "Yoga",
] as const;

/** What the enquiry is called in her inbox. Not a package slug, on purpose: see TailorMade. */
export const TAILOR_ITEM = "Tailor-made getaway";

/*
 * The occasion, when they named one. Bridal shower before hens, because
 * "bridal" would otherwise be read as a hens party.
 */
const OCCASIONS: [RegExp, string][] = [
  [/\bbridal\s*shower\b/i, "bridal shower"],
  [/\bbaby\s*shower\b/i, "baby shower"],
  [/\b(hen'?s?|bachelorette|bride|bridal)\b/i, "hens trip"],
  [/\b(birthday|b-?day|\d0th|21st)\b/i, "birthday getaway"],
];

export function occasionOf(text = ""): string {
  for (const [re, name] of OCCASIONS) if (re.test(text)) return name;
  return "getaway";
}

/** A group size worth saying back. One person is not a group, and 4,000 is a typo. */
export function groupOf(people: number | null | undefined): number | null {
  const n = Math.round(Number(people));
  return Number.isFinite(n) && n >= 2 && n <= 500 ? n : null;
}

/*
 * "We'll tailor a hens trip for the 12 of you."
 *
 * "The 12 of you", not "you and 12 girls": somebody who writes "12 of us" has
 * counted herself, and saying thirteen back reads as not having listened.
 */
export function tailorHeadline(asked = "", people?: number | null): string {
  const n = groupOf(people);
  return `We’ll tailor a ${occasionOf(asked)} ${n ? `for the ${n} of you` : "around your girls"}`;
}

/*
 * What lands in her inbox.
 *
 * In the visitor's own words first, because that sentence is the brief. Then
 * what they ticked, then anything they added. A line with nothing in it is
 * left out rather than printed empty.
 */
export function tailorMessage(input: { asked?: string; wishes?: readonly string[]; notes?: string }): string {
  const asked = (input.asked ?? "").trim();
  const wishes = (input.wishes ?? []).map((w) => w.trim()).filter(Boolean);
  const notes = (input.notes ?? "").trim();
  return [
    "Tailor-made request from the website. Nothing is booked: they are asking what you can put together.",
    asked ? `Looking for: “${asked}”` : null,
    wishes.length ? `Would love: ${wishes.join(", ")}` : null,
    notes ? `Their notes: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}
