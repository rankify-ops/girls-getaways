import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From choosing a package to every girl paying her own share: how booking a Girls Getaway works, step by step.",
  alternates: { canonical: "/how-it-works" },
};

const CDN = "https://images.squarespace-cdn.com/content/v1/60e11aa53e6d353c238d7259";

// Her booking process, in her words and her order. On the old site the six steps ran along
// one row and back along the next; read in order, this is the sequence.
const steps = [
  { t: "Choose your dream girls getaway", d: "Select one (or more) of our packages that you’d love to escape on and fill out the Booking Request form." },
  { t: "We'll confirm package availability", d: "After receiving your enquiry, we’ll check your dates and send through an info sheet with the price and a link to book." },
  { t: "You lock in your getaway", d: "When you click the link to book, we’ll reserve your package and send through a Booking Confirmation with payment instructions." },
  { t: "All the girls can pay individually to us", d: "Through a link on the Booking Confirmation, we ask each of the girls to pay a percentage deposit within 7 days." },
  { t: "Pay final balances prior to arrival", d: "The girls can then choose to pay the remaining amount in full or in installments up until 4-6 weeks prior (due date is dependant on the package)." },
  { t: "Take off on your hassle-free escape", d: "Enjoy the bliss of having all of the finer details taken care of and relax with your girl group from the moment you arrive." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={<>You bring the girls. <em className="italic text-clay-deep">We do the rest.</em></>}
        lede="From researching where to go, to booking activities and gathering payments, we’re set on taking the stress out of planning girls weekends."
        image={`${CDN}/1629637160261-Z9R8H5M9SYHBLCG65ZQJ/HowItWorks_ByronBay.jpg`}
      >
        <Link href="/package-search" className="btn btn-ink">Choose a getaway</Link>
        <Link href="/frequently-asked-questions" className="btn btn-line">Read the FAQs</Link>
      </PageHero>

      <section className="sec bg-paper">
        <div className="ctr">
          <p className="eyebrow">Our booking process</p>
          <ol className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.t} className="border-t border-rule pt-6">
                <span className="serif text-[40px] leading-none text-clay">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="serif mt-4 text-[24px] leading-tight text-ink">{s.t}</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sec bg-blush">
        <div className="ctr grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="h2 max-w-[20ch]">Have a question we <em className="italic text-clay-deep">haven&apos;t answered?</em></h2>
            <p className="lede mt-4 max-w-[56ch]">
              Booking windows, changing inclusions, numbers, payments and cancellations are all covered in the
              FAQs. Anything else, please don&apos;t hesitate to reach out to our team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/frequently-asked-questions" className="btn btn-ink">FAQs</Link>
            <Link href="/contact-us" className="btn btn-line">Enquire now</Link>
          </div>
        </div>
      </section>
    </>
  );
}
