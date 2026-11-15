import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { ReviewWall } from "@/components/sections/Reviews";
import { proof, tripsLine } from "@/content/reviews";
import { getReviews } from "@/lib/reviews";

// The portal's cache window, so a review she publishes shows within the minute.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Reviews",
  description: `Girls Getaways is rated ${proof.rating} on ${proof.source} from ${proof.count} reviews. Read what other groups said about their weekend away.`,
  alternates: { canonical: "/reviews" },
};

/*
 * The reviews, all in one place.
 *
 * The home page gives two of them a section each and shows three more. This is
 * where the rest are, and where "Read the reviews" goes. The numbers at the
 * top come from content/reviews.ts, the one place they are written.
 */
export default async function Reviews() {
  const reviews = await getReviews();
  return (
    <>
      <PageHero
        eyebrow="Reviews"
        title={
          <>
            Loved by the <em className="italic text-clay-deep">girls</em>
          </>
        }
        lede={`Rated ${proof.rating} on ${proof.source} from ${proof.count} reviews, across ${tripsLine}.`}
      >
        <Link href="/package-search" className="btn btn-ink">
          Find your getaway
        </Link>
        {proof.url && (
          <a href={proof.url} className="btn btn-line" rel="noopener" target="_blank">
            See them on {proof.source}
          </a>
        )}
      </PageHero>

      <section className="sec bg-paper">
        <div className="ctr">
          <ReviewWall reviews={reviews} />
        </div>
      </section>
    </>
  );
}
