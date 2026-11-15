"use client";

import Link from "next/link";
import { proof, ratedLine, tripsLine, type Review } from "@/content/reviews";
import { usePreview } from "@/lib/preview";
import { IconArrow } from "@/components/ui/Icons";

/*
 * Reviews on the page: one given a section to itself, three in a row, and all
 * of them on /reviews.
 *
 * Quiet on purpose. A serif line in her own words, a name, the trip, and five
 * small stars in the site's clay: no carousel, no badges, no counters ticking
 * up. Proof on a site like this works by sounding like a friend, and it stops
 * working the moment it looks like an advert.
 *
 * Stand-in reviews are drawn on the preview only (lib/preview.ts). Where there
 * is no real review to show, the section is not there at all.
 */

/** The ones this visitor may see: real ones always, stand-ins on the preview. */
function useReviews(reviews: Review[]): Review[] {
  const preview = usePreview();
  return reviews.filter((r) => !r.placeholder || preview);
}

export function Stars({ n = 5, className = "" }: { n?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-1 text-clay ${className}`} role="img" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.6Z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

/** Says, on the preview, that this is where a real one goes. */
function Sample({ r }: { r: Review }) {
  if (!r.placeholder) return null;
  return (
    <span className="rounded-full border border-rule-2 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-3">
      Sample layout
    </span>
  );
}

const who = (r: Review) => [r.name, r.trip].filter(Boolean).join(" · ");

/*
 * One review, with a section of its own.
 *
 * `index` is which of the featured ones: 0 for the first on the page, 1 for
 * the next. A page can place two and they will not repeat.
 */
export function FeaturedReview({ reviews, index = 0 }: { reviews: Review[]; index?: number }) {
  const r = useReviews(reviews).filter((x) => x.featured)[index];
  if (!r) return null;
  return (
    <section className="sec bg-sand">
      <figure className="ctr mx-auto max-w-[920px] text-center">
        <div className="flex items-center justify-center gap-3">
          <Stars n={r.stars} />
          <Sample r={r} />
        </div>
        <blockquote className="serif mt-7 text-[28px] italic leading-[1.22] text-ink md:text-[40px] md:leading-[1.18]">
          “{r.quote}”
        </blockquote>
        <figcaption className="eyebrow mt-8">{who(r)}</figcaption>
        <p className="mt-6 text-[13.5px] text-ink-2">
          {ratedLine} from {proof.count} reviews ·{" "}
          <Link href="/reviews" className="link-u text-ink">
            Read more
          </Link>
        </p>
      </figure>
    </section>
  );
}

function Card({ r }: { r: Review }) {
  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-[28px] border border-rule bg-white p-7 md:p-8">
      {r.photo && (
        // Hers, from the portal's media store.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.photo} alt="" loading="lazy" decoding="async" className="-mx-7 -mt-7 mb-6 aspect-[3/2] w-[calc(100%+3.5rem)] max-w-none object-cover md:-mx-8 md:-mt-8 md:w-[calc(100%+4rem)]" />
      )}
      <div className="flex items-center justify-between gap-3">
        <Stars n={r.stars} />
        <Sample r={r} />
      </div>
      <blockquote className="serif mt-5 flex-1 text-[21px] leading-[1.32] text-ink">“{r.quote}”</blockquote>
      <figcaption className="mt-6 border-t border-rule pt-4 text-[13px] text-ink-2">
        <span className="font-medium text-ink">{r.name}</span>
        {r.trip && <span className="block text-ink-3">{r.trip}</span>}
      </figcaption>
    </figure>
  );
}

/** Three in a row, after the featured ones, with the way to the rest. */
export function ReviewTrio({ reviews }: { reviews: Review[] }) {
  // The ones that do not already have a section of their own on this page.
  const all = useReviews(reviews);
  const own = all.filter((r) => r.featured).slice(0, 2);
  const rest = all.filter((r) => !own.includes(r)).slice(0, 3);
  if (!rest.length) return null;
  return (
    <section className="sec bg-sand">
      <div className="ctr">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">In their words</p>
            <h2 className="h2 mt-3">
              Loved by the <em className="italic text-clay-deep">girls</em>
            </h2>
          </div>
          <p className="text-[14px] text-ink-2">
            {ratedLine} · {tripsLine}
          </p>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {rest.map((r, i) => (
            <li key={i}>
              <Card r={r} />
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Link href="/reviews" className="btn btn-line">
            Read the reviews <IconArrow size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Every review, on /reviews. */
export function ReviewWall({ reviews }: { reviews: Review[] }) {
  const all = useReviews(reviews);
  if (!all.length) {
    return (
      <p className="lede max-w-[52ch]">
        We&apos;re adding our favourite reviews here. In the meantime, ask the GG team and they&apos;ll happily share
        what other groups have said.
      </p>
    );
  }
  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {all.map((r, i) => (
        <li key={i}>
          <Card r={r} />
        </li>
      ))}
    </ul>
  );
}
