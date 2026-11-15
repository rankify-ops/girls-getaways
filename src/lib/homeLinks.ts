/*
 * Where the home page's search and menus actually go.
 *
 * The home page was built first, around sixteen hand-picked packages and its
 * own little search over them. Everything on it stayed on it: choosing a state
 * scrolled to those sixteen, and choosing a package opened a side panel. The
 * real site (123 packages, each with its own page, and a catalogue that
 * filters all of them) was one click further than any link reached.
 *
 * So a choice made on the home page now goes to the catalogue, narrowed to
 * that choice. This is the one place that turns "NSW, six girls, hens" into
 * that address, and it speaks the catalogue's own language (lib/filters.ts).
 *
 * Pure, so scripts/check_home_links.mjs can run every choice the home page
 * offers through the real filter and prove none of them lands on nothing.
 */

export type Choice = { where?: string; guests?: number; style?: string };

/** The home page's five style names, as the styles her packages actually carry. */
export const STYLE_PARAM: Record<string, string> = {
  Hens: "hens",
  Classic: "classic",
  Luxury: "luxury",
  "Winter Wines": "winter wines",
  "Girl's Day": "girl's day",
};

/*
 * Places the home page names differently from the catalogue. The home page's
 * list came from the old site's menu; the catalogue's from how her packages
 * are filed. Where the two disagree the catalogue's word is used, and where a
 * menu entry has no packages of its own it goes to its state instead.
 */
export const PLACE_ALIAS: Record<string, string> = {};
export const PLACE_TO_STATE: Record<string, string> = {};

/*
 * The "What we do" tiles, as the styles her packages carry.
 *
 * High Tea is not here: no package is filed under it, so that tile goes to the
 * whole catalogue rather than to a filter that would show nothing.
 */
export const EXPERIENCE_STYLE: Record<string, string> = {
  "Wine Weekends": "wine weekend",
  "Beach Breaks": "beach break",
  "City Escapes": "city escape",
  "Foodie Feasts": "foodie feast",
  "Spa Retreats": "spa retreat",
  "Hens Parties": "hens",
  "Luxury Stays": "luxury",
  "Pamper Days": "pamper day",
  "Country Escapes": "country escape",
};

const stateParam = (code: string) => (code.toLowerCase() === "bali" ? "Bali" : code.toUpperCase());

/*
 * What a "where" on the home page means to the catalogue: a state or a place.
 *
 * Both the link and the count beside it are made from this, so a menu can
 * never say "23" next to a link that shows 5.
 */
export function whereFilter(where = ""): { state: string; place: string } {
  if (!where) return { state: "", place: "" };
  if (where.startsWith("state:")) return { state: stateParam(where.slice(6)), place: "" };
  const state = PLACE_TO_STATE[where];
  return state ? { state: stateParam(state), place: "" } : { state: "", place: PLACE_ALIAS[where] ?? where };
}

/** The catalogue, narrowed to what was chosen. Nothing chosen is the whole catalogue. */
export function catalogueHref(choice: Choice = {}): string {
  const q: string[] = [];
  const { state, place } = whereFilter(choice.where);
  if (state) q.push(`state=${encodeURIComponent(state)}`);
  if (place) q.push(`place=${encodeURIComponent(place)}`);
  if (choice.guests && choice.guests > 0) q.push(`girls=${Math.round(choice.guests)}`);
  const style = choice.style ? STYLE_PARAM[choice.style] ?? choice.style : "";
  if (style) q.push(`style=${encodeURIComponent(style)}`);
  return `/package-search/${q.length ? `?${q.join("&")}` : ""}`;
}
