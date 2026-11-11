"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconSearch, IconUsers, IconMoon, IconClose } from "@/components/ui/Icons";
import { fromPrice, type PriceRow } from "@/lib/portal";
import { pretty } from "@/lib/catalogue";

/*
 * The catalogue, filtered in the browser.
 *
 * All 123 packages ship with the page — the whole set is around 400 KB of
 * text, which is cheaper than a round trip per filter change and makes every
 * filter instant. Photography is lazy-loaded, so the weight on screen is
 * whatever the visitor scrolls to.
 */

type Card = {
  slug: string;
  title: string;
  venue: string | null;
  destination: string | null;
  styles: string[];
  heroImage: string | null;
  guestsMin: number | null;
  guestsMax: number | null;
  nights: number | null;
  priceTable: PriceRow[];
};

type Props = {
  packages: Card[];
  styles: { name: string; count: number }[];
  destinations: { slug: string; name: string; count: number }[];
};

const SORTS = [
  ["featured", "Featured"],
  ["low", "Price: low to high"],
  ["high", "Price: high to low"],
] as const;

export function CatalogueBrowser({ packages, styles, destinations }: Props) {
  const [q, setQ] = useState("");
  const [style, setStyle] = useState("");
  const [dest, setDest] = useState("");
  const [girls, setGirls] = useState(0);
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>("featured");
  const [shown, setShown] = useState(24);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = packages.filter((p) => {
      if (style && !p.styles.includes(style)) return false;
      if (dest && p.destination !== dest) return false;
      if (girls) {
        if (p.guestsMin && girls < p.guestsMin) return false;
        if (p.guestsMax && girls > p.guestsMax) return false;
      }
      if (!needle) return true;
      return [p.title, p.venue, p.destination, ...p.styles]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    if (sort === "featured") return list;
    const price = (p: Card) => fromPrice(p.priceTable) ?? (sort === "low" ? Infinity : -Infinity);
    return [...list].sort((a, b) => (sort === "low" ? price(a) - price(b) : price(b) - price(a)));
  }, [packages, q, style, dest, girls, sort]);

  const filtered = Boolean(q || style || dest || girls);
  const clear = () => {
    setQ("");
    setStyle("");
    setDest("");
    setGirls(0);
  };

  return (
    <section className="sec bg-paper pt-10">
      <div className="ctr">
        {/* Search + sort */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="adm-none relative flex h-12 flex-1 items-center gap-3 rounded-full border border-rule bg-white px-5 shadow-[var(--shadow-s)]">
            <IconSearch size={18} className="flex-none text-ink-3" />
            <span className="sr-only">Search getaways</span>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setShown(24);
              }}
              placeholder="Search by name, venue or destination…"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-12 appearance-none rounded-full border border-rule bg-white pl-5 pr-11 text-[14px] text-ink"
            >
              {SORTS.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Destination + group size */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px]">
          <label>
            <span className="mb-1.5 block text-[12.5px] text-ink-2">Destination</span>
            <select
              value={dest}
              onChange={(e) => {
                setDest(e.target.value);
                setShown(24);
              }}
              className="h-11 w-full rounded-[var(--rs)] border border-rule bg-white px-4 text-[14px] text-ink"
            >
              <option value="">Anywhere ({packages.length})</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name} ({d.count})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[12.5px] text-ink-2">How many girls</span>
            <select
              value={girls}
              onChange={(e) => {
                setGirls(Number(e.target.value));
                setShown(24);
              }}
              className="h-11 w-full rounded-[var(--rs)] border border-rule bg-white px-4 text-[14px] text-ink"
            >
              <option value={0}>Any size</option>
              {[2, 4, 6, 8, 10, 12, 16, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n} girls
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Styles */}
        <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
          <button type="button" className="chip" aria-pressed={!style} onClick={() => setStyle("")}>
            All styles
          </button>
          {styles.map((s) => (
            <button
              key={s.name}
              type="button"
              className="chip"
              aria-pressed={style === s.name}
              onClick={() => {
                setStyle(style === s.name ? "" : s.name);
                setShown(24);
              }}
            >
              {pretty(s.name.replace(/\s+/g, "-"))}
              <span className="text-[11px] opacity-60">{s.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-rule pt-5">
          <p className="text-[14px] text-ink-2" aria-live="polite">
            <span className="font-medium text-ink">{results.length}</span>{" "}
            {results.length === 1 ? "getaway" : "getaways"}
          </p>
          {filtered && (
            <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink">
              <IconClose size={14} /> Clear filters
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="mt-8 rounded-[28px] bg-blush px-6 py-16 text-center">
            <p className="serif text-[30px] leading-tight text-ink">Nothing matches just yet</p>
            <p className="lede mx-auto mt-3 max-w-[46ch]">
              Tell the GG team what you&apos;re after and they&apos;ll design it around your girls.
            </p>
            <button type="button" onClick={clear} className="btn btn-line mt-6">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {results.slice(0, shown).map((p) => (
                <li key={p.slug}>
                  <PackageCard p={p} />
                </li>
              ))}
            </ul>
            {shown < results.length && (
              <div className="mt-12 text-center">
                <button type="button" onClick={() => setShown(shown + 24)} className="btn btn-line">
                  Show more ({results.length - shown} left)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function PackageCard({ p }: { p: Card }) {
  const low = fromPrice(p.priceTable);
  const href = `/package-search/${[p.destination, p.slug].filter(Boolean).join("/")}`;

  return (
    <Link href={href} className="group block">
      <span className="plate plate-zoom block aspect-[10/11] rounded-[var(--r)]">
        {p.heroImage && (
          // Remote Squarespace photography until the portal owns the files.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${p.heroImage}?format=1000w`} alt="" loading="lazy" decoding="async" />
        )}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/45 to-transparent" />
      </span>

      <span className="mt-4 block">
        <span className="eyebrow block">{p.destination ? pretty(p.destination) : "Australia"}</span>
        <span className="serif mt-1.5 block text-[25px] leading-[1.08] text-ink group-hover:text-clay-deep">
          {p.title}
        </span>
        {p.venue && <span className="mt-1 block truncate text-[13px] text-ink-3">{p.venue}</span>}

        <span className="mt-3.5 flex items-center justify-between gap-3 border-t border-rule pt-3.5 text-[13px]">
          <span className="flex items-center gap-3 text-ink-2">
            <span className="flex items-center gap-1.5">
              <IconUsers size={15} />
              {p.guestsMin && p.guestsMax ? `${p.guestsMin}–${p.guestsMax}` : "Any"}
            </span>
            {p.nights && (
              <span className="flex items-center gap-1.5">
                <IconMoon size={14} />
                {p.nights}
              </span>
            )}
          </span>
          <span className="text-ink">
            {low === null ? (
              <span className="text-ink-3">On request</span>
            ) : (
              <>
                <span className="text-ink-3">from </span>
                <span className="font-medium">${low.toLocaleString("en-AU")}</span>
                <span className="text-ink-3"> pp</span>
              </>
            )}
          </span>
        </span>
      </span>
    </Link>
  );
}
