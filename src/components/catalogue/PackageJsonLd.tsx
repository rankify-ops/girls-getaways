import { guestsText, packageHref, placeText, priceFromOf, type Package } from "@/lib/catalogue";
import { site } from "@/content/site";

/*
 * Structured data for a package.
 *
 * TouristTrip rather than Product, because that is what it is: a stay at a
 * named place for a number of nights, not a thing bought online. The price is
 * an AggregateOffer with the lowest and highest rows of the table — a single
 * price would be a lie about a product whose price falls as the group grows.
 *
 * URLs use the same base as the page's own canonical link — her live domain.
 * Reading the request host instead would make all 123 pages dynamic to win
 * nothing: the preview tells crawlers to go away in robots.txt anyway.
 */

export function PackageJsonLd({ p }: { p: Package }) {
  const origin = site.url;
  const prices = p.priceTable.map((r) => r.price).filter((n) => Number.isFinite(n) && n > 0);
  const low = priceFromOf(p);
  const high = prices.length ? Math.max(...prices) : null;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: p.title,
    url: origin + packageHref(p),
    description: p.blurb ?? p.description ?? undefined,
    image: [p.heroImage, ...p.gallery.slice(0, 5)].filter(Boolean),
    touristType: p.styles.length ? p.styles : undefined,
    provider: {
      "@type": "TravelAgency",
      name: "Girls Getaways",
      url: origin + "/",
      areaServed: "AU",
    },
    itinerary: p.venue
      ? { "@type": "Place", name: p.venue, address: { "@type": "PostalAddress", addressLocality: placeText(p), addressCountry: "AU" } }
      : undefined,
    // Nights, as an ISO 8601 duration.
    subjectOf: p.nights ? { "@type": "CreativeWork", name: `${p.nights} nights` } : undefined,
    offers:
      low !== null && high !== null
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "AUD",
            lowPrice: low,
            highPrice: high,
            offerCount: p.priceTable.length,
            availability: "https://schema.org/InStock",
            url: origin + packageHref(p),
            // Per person, and it moves with the group — say so rather than
            // letting a crawler read lowPrice as the price of the trip.
            description: `Per person. ${guestsText(p)}; the per-person price falls as the group grows.`,
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify drops the undefined keys above, so the output carries
      // only fields that actually have a value.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
