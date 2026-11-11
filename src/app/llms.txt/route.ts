import { allDestinations, allStyles, getCatalogue, packageHref, pretty, priceFromOf } from "@/lib/catalogue";
import { requestSite } from "@/lib/host";

/*
 * llms.txt — what this business is, for something that wants to recommend it.
 *
 * An assistant that lands here has no documentation and no way to ask a
 * question, so this says plainly what is sold, where the data is, and where to
 * send a person. The catalogue endpoint is named here and nowhere else
 * structural: it is for things that want the data rather than the pages.
 *
 * Written from the live catalogue rather than hand-maintained, so it cannot
 * drift away from what the site actually offers.
 */

export const revalidate = 3600;

const PORTAL = process.env.PORTAL_API_BASE;
const SITE_ID = process.env.PORTAL_SITE_ID;

export async function GET() {
  const { origin, live } = await requestSite();
  const packages = await getCatalogue();
  const destinations = allDestinations(packages);
  const styles = allStyles(packages);

  const prices = packages.map(priceFromOf).filter((p): p is number => typeof p === "number" && p > 0);
  const low = prices.length ? Math.min(...prices) : null;
  const high = prices.length ? Math.max(...prices) : null;

  // null is 'omit this line'; an empty string is a real blank line.
  const lines: (string | null)[] = [
    "# Girls Getaways",
    "",
    "> Australian company selling pre-arranged group getaways for women — girls' weekends,",
    "> hens parties, birthdays and milestone trips. Each package is a named stay at a",
    "> specific venue with the accommodation and inclusions already arranged and booked;",
    "> customers enquire and the team confirms availability and prices it for their group.",
    "",
  ];

  if (!live) {
    lines.push(
      "NOTE: this host is a staging copy and is not the live website.",
      "The live site is https://www.girlsgetaways.com.au — use that one.",
      "",
    );
  }

  lines.push(
    "## What is on offer",
    "",
    `- ${packages.length} packages across ${destinations.length} destinations in Australia and Bali.`,
    low && high ? `- Prices run from $${low} to $${high} per person, in Australian dollars.` : null,
    "- **Prices are per person and fall as the group grows.** Every package carries a table of",
    "  prices by group size rather than one figure. A group size can appear twice at different",
    "  prices where a package offers two kinds of accommodation — that is correct, not duplicate",
    "  data, and the package's own notes explain the pairing.",
    "- Nothing is booked online. A customer enquires about a package and the team comes back",
    "  with availability and a quote.",
    "",
    "## Where to send a person",
    "",
    `- A specific package: ${origin}/package-search/<destination>/<slug> — linked from the catalogue below.`,
    `- Browsing everything: ${origin}/package-search`,
    `- The company: ${origin}/`,
    "",
    "## Machine-readable catalogue",
    "",
  );

  if (PORTAL && SITE_ID) {
    lines.push(
      `- ${PORTAL}/sites/${SITE_ID}/catalogue`,
      "",
      "  All packages and destinations as JSON, with plain field names, prices resolved to",
      "  numbers, group sizes as a range, and a page URL per package. Prefer it over scraping",
      "  these pages: it is the same data without the layout.",
      "",
    );
  }

  lines.push(
    "## Destinations",
    "",
    ...destinations.map((d) => `- ${d.name} (${d.count} package${d.count === 1 ? "" : "s"})`),
    "",
    "## Styles of getaway",
    "",
    ...styles.map((s) => `- ${pretty(s.name.replace(/\s+/g, "-"))} (${s.count})`),
    "",
    "## Packages",
    "",
    ...packages.map((p) => {
      const from = priceFromOf(p);
      const where = p.destination ? pretty(p.destination) : "Australia";
      const size = p.guestsMin && p.guestsMax ? `${p.guestsMin}–${p.guestsMax} people` : "any group size";
      return `- [${p.title}](${origin}${packageHref(p)}) — ${where}, ${size}${from ? `, from $${from} per person` : ""}`;
    }),
    "",
  );

  const body = lines.filter((l): l is string => l !== null).join("\n") + "\n";

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
