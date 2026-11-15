"use client";

import { useState } from "react";
import { IconArrow, IconChevron } from "@/components/ui/Icons";
import type { PriceRow } from "@/lib/portal";
import { setSearchGirls, useSearchContext } from "@/lib/searchContext";
import { priceFor } from "@/lib/filters";

/*
 * Price by group size, and the enquiry call to action.
 *
 * Their pricing drops as the group grows, which is the thing that makes a
 * visitor message the organiser — so it's shown as the real table, not hidden
 * behind a single "from" figure.
 *
 * A size can appear twice where a package offers two kinds of accommodation;
 * those rows are shown as they are and the package's notes explain them.
 *
 * The group size is a picker at the top, set to what they searched for when
 * they came from a search. The headline is the price for that group. It was
 * first done by marking their row in the table, and Tom's objection was right:
 * a marked row looks like a choice and could not be changed, so trying nine
 * girls meant scrolling to the enquiry form. Nothing in the table is marked
 * now; the picker is the one place the size is chosen, and the form follows it.
 */
export function EnquiryPanel({
  title,
  priceTable,
  notes,
  guests,
  nights,
}: {
  title: string;
  priceTable: PriceRow[];
  notes: string | null;
  guests: string;
  nights: number | null;
}) {
  const [showAll, setShowAll] = useState(false);
  const { girls } = useSearchContext();
  const mine = priceFor(priceTable, girls);
  const theirs = mine?.exact ? mine : null;
  const rows = showAll ? priceTable : priceTable.slice(0, 8);
  // The sizes she prices, once each, for the picker.
  const sizes = [...new Set(priceTable.map((r) => r.girls))].filter((n) => n > 0).sort((a, b) => a - b);
  const low = priceTable.length ? Math.min(...priceTable.map((r) => r.price)) : null;
  const dupes = new Set(
    priceTable.filter((r, i, all) => all.findIndex((x) => x.girls === r.girls) !== i).map((r) => r.girls),
  );

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="rounded-[28px] border border-rule bg-white p-6 shadow-[var(--shadow)] md:p-7">
        <p className="eyebrow">Pricing</p>
        {low !== null ? (
          <p className="mt-2 text-ink">
            {!theirs && <span className="text-[14px] text-ink-3">from </span>}
            <span className="serif text-[40px] leading-none">${(theirs?.price ?? low).toLocaleString("en-AU")}</span>
            <span className="text-[14px] text-ink-3"> per person</span>
          </p>
        ) : (
          <p className="serif mt-2 text-[30px] leading-tight text-ink">Price on request</p>
        )}
        <p className="mt-1.5 text-[13px] text-ink-3">
          {guests}
          {nights ? ` · ${nights} nights` : ""}
        </p>

        {sizes.length > 1 && (
          <label className="relative mt-5 block">
            <span className="mb-1.5 block text-[12.5px] text-ink-2">How many girls?</span>
            <select
              value={theirs ? girls : 0}
              onChange={(e) => setSearchGirls(Number(e.target.value))}
              className="h-12 w-full appearance-none rounded-full border border-rule-2 bg-white pl-5 pr-10 text-[14.5px] text-ink"
            >
              <option value={0}>Choose your group size</option>
              {sizes.map((n) => (
                <option key={n} value={n}>
                  {n} girls
                </option>
              ))}
            </select>
            <IconChevron size={15} className="pointer-events-none absolute bottom-[17px] right-4 text-ink-3" />
          </label>
        )}

        {priceTable.length > 0 && (
          <>
            <table className="mt-6 w-full text-[14px]">
              <caption className="sr-only">Price per person by group size for {title}</caption>
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  <th scope="col" className="pb-2 font-semibold">No. of girls</th>
                  <th scope="col" className="pb-2 text-right font-semibold">Per person</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.girls}-${r.price}-${i}`} className="border-t border-rule">
                    <td className="py-2 text-ink-2">
                      {r.girls}
                      {dupes.has(r.girls) && (
                        <span className="ml-2 text-[11.5px] text-ink-3">option {rows.filter((x, j) => x.girls === r.girls && j <= i).length}</span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-ink">${r.price.toLocaleString("en-AU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {priceTable.length > 8 && !showAll && (
              <button type="button" onClick={() => setShowAll(true)} className="link-u mt-3 text-[13px] text-ink">
                Show all {priceTable.length} group sizes
              </button>
            )}
          </>
        )}

        <a href="#enquire" className="btn btn-ink mt-6 w-full">
          Enquire about this getaway <IconArrow size={16} />
        </a>
        <p className="mt-3 text-center text-[12.5px] text-ink-3">
          We price it for your group and book every inclusion.
        </p>
      </div>

      {notes && (
        <div className="mt-4 rounded-[22px] bg-blush p-6">
          <p className="eyebrow">Good to know</p>
          <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{notes}</p>
        </div>
      )}
    </aside>
  );
}
