import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Gift cards",
  description:
    "Give a girlfriend a contribution toward her next weekend away. GG Gift Cards start at $99, arrive by email and are valid for three years.",
  alternates: { canonical: "/gift-cards" },
};

const CDN = "https://images.squarespace-cdn.com/content/v1/60e11aa53e6d353c238d7259";
const EMAIL = "takemeaway@girlsgetaways.com.au";

// Her words. The headings on the last two are ours: on the old site these four sat in an
// accordion whose fourth title repeated the third.
const details = [
  {
    q: "Why give a GG Gift Card?",
    a: "With a GG Gift Card, you can gift a girlfriend a contribution toward her next weekend away! Depending on the amount you choose and the package in mind, you may opt to cover a percentage or the full cost of her next trip – perfect for anyone that is overdue for a little indulgence.",
  },
  {
    q: "How are they delivered?",
    a: "Our gift cards are delivered electronically via email to your lucky lady. They will feature our classic GG branding and the details of the amount she’s received along with steps on how to redeem the voucher.",
  },
  {
    q: "What is the minimum value for a gift card?",
    a: "Our gift cards have a minimum value of $99 and can be used towards any of our Girls Getaway packages. We recommend taking a look at our getaways and keeping an eye out for a package that your gal might like so you roughly know your contribution.",
  },
  {
    q: "How long are they valid, and how are they redeemed?",
    a: "Our gift cards are valid for three years and can be redeemed via email. By following our simple steps, your lucky lady can contact our passionate booking team who will help to credit value towards a day trip or weekend stay.",
  },
];

const amounts = [
  { v: "$100", d: "Covers a portion of the cost on any of our Girls Day Out packages or overnight stays." },
  { v: "$200", d: "Covers a number of our girl’s day out packages including Style Queens & High Teas, Soothe, Sip & Savour and Bellinis & Blowouts." },
  { v: "$350", d: "Covers a number of our girl’s weekends including By the Bay in Port Stephens, Breakfree in the Hunter Valley and Nibble & Nourish in Brisbane." },
  { v: "$500", d: "Covers our more indulgent girls getaways including Coastal Escape in Newcastle and Penthouses, Pools & Pina Coladas in Byron Bay." },
];

/*
 * Buying one.
 *
 * On the old site the button opened Squarespace's own gift card checkout, which
 * does not come with us. Until a checkout replaces it, a gift card is bought the
 * way everything else here is: you tell the team what you want and they send it.
 * The email arrives with the amount already asked for, so it is one click and a
 * name. When there is a checkout, this link is the one line that changes.
 */
const buy = (amount: string) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(`GG Gift Card – ${amount}`)}&body=${encodeURIComponent(
    `Hi GG team,\n\nI'd like to buy a ${amount} gift card.\n\nHer name:\nHer email:\nA message to include:\n\nThanks!`,
  )}`;

export default function GiftCards() {
  return (
    <>
      <PageHero
        eyebrow="GG Gift Cards"
        title={<>Give the gift of a <em className="italic text-clay-deep">getaway</em></>}
        lede="We may be a little biased but we truly believe there’s no better gal-to-gal present than the promise of a future getaway!"
        image={`${CDN}/eef6a75a-6d26-4e10-93a8-7e04cab0f808/GiftCard_BurleighPavillion_Gourmet%26Gourmand.jpg`}
      >
        <a href="#amounts" className="btn btn-ink">Choose an amount</a>
        <Link href="/package-search" className="btn btn-line">See what it could cover</Link>
      </PageHero>

      <section className="sec bg-paper">
        <div className="ctr">
          <p className="eyebrow">The details</p>
          <dl className="mt-8 grid gap-x-14 gap-y-9 md:grid-cols-2">
            {details.map((d) => (
              <div key={d.q}>
                <dt className="serif text-[24px] leading-tight text-ink">{d.q}</dt>
                <dd className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{d.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="amounts" className="sec scroll-mt-24 bg-sand">
        <div className="ctr">
          <p className="eyebrow">How it works</p>
          <h2 className="h2 mt-3 max-w-[18ch]">Pick what you&apos;d like <em className="italic text-clay-deep">to give</em></h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {amounts.map((a) => (
              <div key={a.v} className="flex flex-col rounded-[26px] bg-white p-7 shadow-[var(--shadow-s)]">
                <p className="serif text-[44px] leading-none text-ink">{a.v}</p>
                <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-ink-2">{a.d}</p>
                <a href={buy(a.v)} className="btn btn-ink btn-sm mt-6 self-start">Request this card</a>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
            Any amount from $99 works. Email{" "}
            <a href={buy("custom amount")} className="text-clay-ink underline underline-offset-4">{EMAIL}</a> with the
            value you have in mind and who it&apos;s for, and the team will send payment details and deliver the card
            by email.
          </p>
        </div>
      </section>
    </>
  );
}
