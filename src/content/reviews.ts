/*
 * What other girls say, and the numbers that go with it.
 *
 * The site had no proof on it anywhere: no rating, no review, no count of
 * trips. For a business asking a group to pay hundreds of dollars each to a
 * company they found online, that was the largest thing missing.
 *
 * THE NUMBERS are Girls Getaways' own, given by Tom on 15 November 2026:
 * 4.7 on Google from 71 reviews, and more than a thousand girls' trips a year.
 * They are published as her claims. Shaun confirms the wording before the
 * domain moves; change them here and every place that shows them follows.
 *
 * THE REVIEWS below are not reviews. They are stand-ins that show where a real
 * one goes and how long it should be, and each is marked `placeholder`. A
 * placeholder is never drawn on girlsgetaways.com.au: see lib/preview.ts. The
 * site must not show a visitor a sentence nobody wrote about a trip nobody
 * took, and "we will remember to swap them" is not a safeguard.
 *
 * To put the real ones in: replace an entry with her words exactly as she
 * wrote them, her first name, and the trip, and delete `placeholder: true`.
 * The first two with `featured: true` get a section of their own on the home
 * page; every real review appears on /reviews.
 */

export const proof = {
  rating: "4.7",
  count: 71,
  source: "Google",
  trips: "1,000+",
  /** Her Google reviews page. Empty until Shaun supplies it; nothing links out while it is. */
  url: "",
};

export type Review = {
  quote: string;
  name: string;
  /** "Hens weekend · Byron Bay" */
  trip?: string;
  /** The stars she gave, when known. */
  stars?: number;
  featured?: boolean;
  placeholder?: boolean;
};

export const reviews: Review[] = [
  {
    quote:
      "A favourite review goes here, in her own words. Two or three sentences about the weekend, the house, and how little she had to organise.",
    name: "Guest name",
    trip: "Hens weekend · Byron Bay",
    stars: 5,
    featured: true,
    placeholder: true,
  },
  {
    quote: "A second highlighted review sits here. One that speaks to the planning being done for them.",
    name: "Guest name",
    trip: "40th birthday · Hunter Valley",
    stars: 5,
    featured: true,
    placeholder: true,
  },
  {
    quote: "A shorter review goes here. One or two sentences is right for this size.",
    name: "Guest name",
    trip: "Girls' weekend · Gold Coast",
    stars: 5,
    placeholder: true,
  },
  {
    quote: "Another short one. The ones that mention paying individually work well here.",
    name: "Guest name",
    trip: "Hens weekend · Mornington Peninsula",
    stars: 5,
    placeholder: true,
  },
  {
    quote: "And a third. A different kind of trip from the two beside it shows the range.",
    name: "Guest name",
    trip: "Spa weekend · Blue Mountains",
    stars: 5,
    placeholder: true,
  },
  {
    quote: "Every real review appears on the reviews page, in the order they are listed here.",
    name: "Guest name",
    trip: "Wine weekend · Barossa",
    stars: 5,
    placeholder: true,
  },
];

/** "Rated 4.7 on Google" */
export const ratedLine = `Rated ${proof.rating} on ${proof.source}`;
/** "1,000+ girls’ trips a year" */
export const tripsLine = `${proof.trips} girls’ trips a year`;
