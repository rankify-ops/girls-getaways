import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "The GG Team",
  description:
    "Meet the travel-inspired women behind every Girls Getaway, and how Girls Getaways supports Pink Hope.",
  alternates: { canonical: "/gg-team" },
};


// Her team page, in her words. The photographs are saved in the site (scripts/save_page_images.mjs).
const team = [
  {
    name: "Kathryn",
    role: "Global Gal",
    img: "/img/pages/team-kathryn.webp",
    bio: "Kathryn has been travelling the globe since her early twenties and has resided in six countries, collecting girlfriends along the way. She locks all girls into their weekends and makes escaping as smooth as possible.",
  },
  {
    name: "Prue",
    role: "Heart of Ops",
    img: "/img/pages/team-prue.webp",
    bio: "Prue brings a wealth of expertise & a touch of sparkle to every occasion. Her passion for creating unforgettable experiences shines through in everything she does, whether she's orchestrating a grand event or planning a chic getaway - events are her passion and operations has her heart.",
  },
  {
    name: "Diana",
    role: "All Star Accountant",
    img: "/img/pages/team-diana.webp",
    bio: "Diana is our queen of accounts! With years of experience in the field, Diana is all over it when it comes to numbers and will be overseeing all things accounting and bookkeeping, making sure that everything is kept in check, and that your getaway runs smoothly within our operations team!",
  },
];

export default function Team() {
  return (
    <>
      <PageHero
        eyebrow="The GG Team"
        title={<>The girls behind <em className="italic text-clay-deep">every getaway</em></>}
        lede="We are a travel-inspired group of women who believe that quality girl time, escape from routine and a little indulgence is good for the soul."
        image="/img/pages/team-hero.webp"
        alt="Jen, founder of Girls Getaways"
      />

      <section className="sec bg-paper">
        <div className="ctr grid items-center gap-12 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/pages/team-jen.webp"
            alt="Jen"
            loading="lazy"
            className="aspect-[4/5] w-full rounded-[28px] object-cover"
          />
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="h2 mt-3">Meet Jen, our <em className="italic text-clay-deep">Girl Boss</em></h2>
            <div className="lede mt-6 max-w-[62ch] space-y-4">
              <p>
                Born with a desire to nurture women&apos;s friendships and provide ladies with quality time away
                from life&apos;s demands, Girls Getaways was started by our Girl Boss, Jen, in 2014.
              </p>
              <p>
                Always the organiser in her friend group, Jen long had a love for travel, as well as professional
                experience in tourism and event management, yet it wasn&apos;t until she was asked to help organise
                a friend&apos;s hens that she decided to turn this passion into a business.
              </p>
              <p>
                From that moment, Girls Getaways has developed into a close-knit interstate team, expanded into
                over 25 domestic and international destinations and established a Hope in the Hunter event series
                that has donated over $40,000 to Pink Hope. Now set on growing across Australia, Jen can&apos;t wait
                to provide more women with the chance to Escape, Indulge &amp; Relax.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec bg-sand">
        <div className="ctr">
          <p className="eyebrow">Our team</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {team.map((m) => (
              <article key={m.name} className="overflow-hidden rounded-[26px] bg-white shadow-[var(--shadow-s)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.img} alt={m.name} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                <div className="p-7">
                  <h3 className="serif text-[26px] leading-none text-ink">{m.name}</h3>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-clay-ink">{m.role}</p>
                  <p className="mt-4 text-[14.5px] leading-relaxed text-ink-2">{m.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec bg-paper">
        <div className="ctr max-w-[860px]">
          <p className="eyebrow">Our Pink Hope partnership</p>
          <h2 className="h2 mt-3">How do we support <em className="italic text-clay-deep">Pink Hope?</em></h2>
          <div className="lede mt-6 space-y-4">
            <p>
              Deeply empathising with Pink Hope&apos;s mission of empowering women to take action against their risk
              of breast and ovarian cancer, Girls Getaways has developed an ongoing event series, Holidays for
              Hope. These events are based in our most popular regional destinations and involve groups of
              100-150 women coming together to show their support.
            </p>
            <p>
              On our Holidays for Hope weekends, we invite women of all ages to join us for canape nights, wine
              tours, and long lunches, with 50% of all package profits supporting Pink Hope. With these funds, our
              team organises retreats for women affected by breast and ovarian cancer, offering them much-needed
              time to relax, unwind and recover.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/package-search" className="btn btn-ink">Explore getaways</Link>
            <Link href="/the-gg-diaries" className="btn btn-line">Read the GG Diaries</Link>
          </div>
        </div>
      </section>
    </>
  );
}
