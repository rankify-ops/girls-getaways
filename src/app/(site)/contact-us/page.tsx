import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Questions about a getaway, or want one customised for your girls? Email or call the Girls Getaways team.",
  alternates: { canonical: "/contact-us" },
};

const EMAIL = "takemeaway@girlsgetaways.com.au";
const PHONE = "1300 161 122";

// Her contact page, in her words. It had no form on the old site either: two reasons to get
// in touch, and the two ways to do it.
export default function ContactUs() {
  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title={<>We&apos;d love to <em className="italic text-clay-deep">hear from you</em></>}
        lede="Have a question about one of our getaways or looking to customise a package? Our team is more than happy to help you out."
      >
        <a href={`mailto:${EMAIL}`} className="btn btn-ink">Email the team</a>
        <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="btn btn-line">Call {PHONE}</a>
      </PageHero>

      <section className="sec bg-paper">
        <div className="ctr grid gap-6 md:grid-cols-3">
          <div className="rounded-[26px] bg-white p-8 shadow-[var(--shadow-s)]">
            <p className="eyebrow">General enquiries</p>
            <p className="lede mt-4">
              Have a question about one of our getaways or looking to customise a package? Our team is more than
              happy to help you out.
            </p>
            <Link href="/package-search" className="link-u mt-5 inline-block text-[14px] text-ink">Browse every getaway</Link>
          </div>
          <div className="rounded-[26px] bg-white p-8 shadow-[var(--shadow-s)]">
            <p className="eyebrow">Work with us</p>
            <p className="lede mt-4">
              Are you an accommodation or hospitality provider interested in partnering with us? We&apos;d love to
              get in touch!
            </p>
            <a href={`mailto:${EMAIL}?subject=Partnering%20with%20Girls%20Getaways`} className="link-u mt-5 inline-block text-[14px] text-ink">
              Tell us about your property
            </a>
          </div>
          <div className="rounded-[26px] bg-ink p-8 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-clay">Contact</p>
            <a href={`mailto:${EMAIL}`} className="serif mt-4 block break-words text-[22px] leading-snug hover:underline">{EMAIL}</a>
            <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="serif mt-3 block text-[26px] hover:underline">{PHONE}</a>
            <p className="mt-5 text-[13.5px] leading-relaxed text-white/70">
              We strive to respond within 48 hours. In busier periods it may take a little longer, and our emails
              can occasionally land in spam, so please check there too.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
