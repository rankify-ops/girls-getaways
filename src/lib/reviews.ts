import { fetchCollection, https } from "@/lib/portal";
import { reviews as standIns, type Review } from "@/content/reviews";

/*
 * The reviews, from her dashboard.
 *
 * Reviews is a section in the dashboard like Packages: she adds one, pastes
 * what the customer wrote, ticks "Feature on the home page" on the two she
 * likes best, and the website follows within the minute. Nothing about a
 * review is in the site's code any more.
 *
 * Until there is at least one, the stand-ins in content/reviews.ts are used,
 * and those are drawn on the preview only (lib/preview.ts). The moment a real
 * review is published every stand-in is gone: real and sample reviews are
 * never shown side by side.
 */
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function getReviews(): Promise<Review[]> {
  const live = await fetchCollection("reviews");
  const real = (live ?? [])
    .map((item): Review => {
      const d = item.data ?? {};
      const stars = Number(d.stars);
      return {
        quote: str(d.quote),
        name: str(d.name),
        trip: str(d.trip) || undefined,
        stars: Number.isFinite(stars) && stars >= 1 && stars <= 5 ? Math.round(stars) : undefined,
        featured: d.featured === true,
        photo: https(d.photo) ?? undefined,
      };
    })
    // A review with no words or no name is not one yet.
    .filter((r) => r.quote && r.name);
  return real.length ? real : standIns;
}
