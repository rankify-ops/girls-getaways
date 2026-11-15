import Link from "next/link";

/*
 * "That page isn't here", in the site's own voice, with three ways on.
 *
 * A wrong address showed the framework's bare "404 | This page could not be
 * found". Her old site had a page for every town and style, and some of those
 * addresses are in bookmarks and old emails; whoever follows one should land
 * on something that looks like her site and offers her getaways.
 */
export function NotFound() {
  return (
    <section className="bg-blush pb-24 pt-36 md:pt-44">
      <div className="ctr max-w-[720px] text-center">
        <p className="eyebrow">Page not found</p>
        <h1 className="h2 mt-3">
          That one got <em className="italic text-clay-deep">away</em>
        </h1>
        <p className="lede mx-auto mt-4 max-w-[46ch]">
          The page you were after has moved or is no longer here. Every getaway we design is still a click away.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/package-search/" className="btn btn-ink">
            See every getaway
          </Link>
          <Link href="/#plan" className="btn btn-line">
            Tell us about your trip
          </Link>
          <Link href="/contact-us/" className="btn btn-line">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
