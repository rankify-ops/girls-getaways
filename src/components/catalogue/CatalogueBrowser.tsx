"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconChevron, IconSearch, IconUsers, IconMoon, IconClose } from "@/components/ui/Icons";
import { imageAt, type PriceRow } from "@/lib/portal";
import { pretty } from "@/lib/catalogue";
import { TailorMade } from "@/components/catalogue/TailorMade";
import {
  datesLabel, matchesGirls, matchesPlace, matchesState, presetQuery, priceFor, searchTitle, slugify, stateName,
  type Preset, type Sort,
} from "@/lib/filters";

/*
 * The results page: what was searched, said back, and the packages that answer it.
 *
 * It is what a search lands on, so it behaves like one. The heading is the
 * search ("Hens getaways in Queensland for 7 girls"), the first packages are on
 * the first screen, every control shows what is actually being filtered, and a
 * price is the price for the group that was searched for.
 *
 * It did none of that. A visitor who searched Queensland for seven girls
 * arrived under "Every escape we design, 123 packages", then the concierge,
 * then the filters, with the first result a screen and a half down, the group
 * size box reading "Any size" and every card priced "from" its cheapest group.
 *
 * The search arrives already applied: the page reads the address on the server
 * and hands it in as `initial`, so the first thing drawn is the answer and not
 * the whole catalogue narrowing a moment later. Every change is written back
 * to the address, so a refresh, a shared link and the back button from a
 * package all return to the same results.
 *
 * All 123 packages ship with the page (about 400 KB of text), which makes
 * every filter instant. Photography is lazy-loaded.
 */

type Card = {
  slug: string;
  title: string;
  venue: string | null;
  destination: string | null;
  area: string | null;
  placeTags: string[];
  state: string | null;
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
  /** The search in the address when the page was asked for. */
  initial: Preset;
};

const SORTS: [Sort, string][] = [
  ["featured", "Featured"],
  ["low", "Price: low to high"],
  ["high", "Price: high to low"],
];

// The order her site lists them in. A state with no packages is not offered.
const STATE_ORDER = ["NSW", "QLD", "VIC", "ACT", "SA", "WA", "TAS", "NT", "Bali"];
const SIZES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 25, 30];

const select = "h-12 w-full appearance-none truncate rounded-full border border-rule bg-white pl-4 pr-9 text-[14px] text-ink sm:pl-5";
// The arrow a select loses with its native look. Without it these read as text boxes.
const Arrow = () => <IconChevron size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-3" />;

export function CatalogueBrowser({ packages, styles, destinations, initial }: Props) {
  const [q, setQ] = useState(initial.q);
  const [style, setStyle] = useState(() => styles.find((s) => slugify(s.name) === slugify(initial.style))?.name ?? "");
  // One "where": a state or a place, never both. "state:QLD" | "place:gold-coast" | "".
  const [where, setWhere] = useState(initial.state ? `state:${initial.state}` : initial.place ? `place:${initial.place}` : "");
  const [girls, setGirls] = useState(initial.girls);
  const [dates, setDates] = useState({ from: initial.from, to: initial.to });
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [shown, setShown] = useState(24);
  const [allStyles, setAllStyles] = useState(false);

  const stateCode = where.startsWith("state:") ? where.slice(6) : "";
  const place = where.startsWith("place:") ? where.slice(6) : "";

  /*
   * The "where" list: the states she has packages in, then her destinations.
   *
   * Counted with the same test the filter uses, so the number beside a name is
   * the number of packages choosing it shows. A place in the address that is
   * not one of her destinations (a town filed as an area, from an old link) is
   * added, so the box always names what is being filtered.
   */
  const whereOptions = useMemo(() => {
    const states = STATE_ORDER.map((code) => ({
      value: `state:${code}`,
      name: stateName(code),
      count: packages.filter((p) => matchesState(p, code)).length,
    })).filter((s) => s.count > 0);
    const places = destinations.map((d) => ({
      value: `place:${d.slug}`,
      name: d.name,
      count: packages.filter((p) => matchesPlace(p, d.slug)).length,
    }));
    if (place && !places.some((d) => d.value === `place:${place}`)) {
      places.unshift({ value: `place:${place}`, name: pretty(place), count: packages.filter((p) => matchesPlace(p, place)).length });
    }
    places.sort((a, b) => a.name.localeCompare(b.name));
    return { states, places };
  }, [packages, destinations, place]);

  const placeName = whereOptions.places.find((d) => d.value === where)?.name;
  // The sizes offered, plus whatever was searched for: seven girls is a group even though the list skips it.
  const sizes = useMemo(() => [...new Set([...SIZES, girls].filter(Boolean))].sort((a, b) => a - b), [girls]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = packages.filter((p) => {
      if (style && !p.styles.includes(style)) return false;
      if (place && !matchesPlace(p, place)) return false;
      if (stateCode && !matchesState(p, stateCode)) return false;
      if (!matchesGirls(p, girls)) return false;
      if (!needle) return true;
      return [p.title, p.venue, p.destination, p.area, ...p.styles]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    if (sort === "featured") return list;
    // Sorted by what this group would pay, when a group size has been chosen.
    const price = (p: Card) => priceFor(p.priceTable, girls)?.price ?? (sort === "low" ? Infinity : -Infinity);
    return [...list].sort((a, b) => (sort === "low" ? price(a) - price(b) : price(b) - price(a)));
  }, [packages, q, style, girls, sort, place, stateCode]);

  const search: Preset = {
    state: stateCode,
    place,
    style: style ? slugify(style).replace(/-/g, " ") : "",
    girls,
    from: dates.from,
    to: dates.to,
    q: q.trim(),
    sort,
  };
  const query = presetQuery(search);
  // What a package needs to know about the search: who is going and when.
  const carry = presetQuery({ girls, from: dates.from, to: dates.to });

  /*
   * The address follows the filters.
   *
   * replaceState, not a navigation: nothing is fetched and the page does not
   * move. It is there so that a refresh, a link sent to the group and the back
   * button from a package all come back to these results and not to the whole
   * catalogue.
   */
  useEffect(() => {
    const next = `${window.location.pathname}${query}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", next);
  }, [query]);

  const tabTitle = searchTitle({ ...search, q: "", style: style ? pretty(slugify(style)) : "" }, placeName);
  // The tab says the search too, as it does when the page is first sent.
  useEffect(() => {
    document.title = `${tabTitle || "All getaways"} | Girls Getaways`;
  }, [tabTitle]);

  // Seventeen styles is three rows of buttons between a search and its results. The seven
  // most used fit on one, with the chosen one always among them; the rest are a click away.
  const offered = allStyles ? styles : styles.filter((s, i) => i < 7 || s.name === style);

  const filtered = Boolean(q.trim() || style || where || girls);
  const clear = () => {
    setWhere("");
    setQ("");
    setStyle("");
    setGirls(0);
    setShown(24);
  };
  const narrow = () => setShown(24);

  const heading = searchTitle({ ...search, style: style ? pretty(slugify(style)) : "" }, placeName);
  const when = datesLabel(dates.from, dates.to);
  // What they have chosen, as a sentence for the team when no set package fits it.
  const looking = [heading, when].filter(Boolean).join(", ");

  return (
    <>
      <section className="bg-blush pb-6 pt-[120px] md:pb-9 md:pt-32">
        <div className="ctr">
          <p className="eyebrow">{filtered ? "Your search" : "All getaways"}</p>
          <h1 className="serif mt-2.5 max-w-[34ch] text-[32px] leading-[1.08] text-ink md:text-[42px]">
            {heading || (
              <>
                Every escape we <em className="italic text-clay-deep">design</em>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-[64ch] text-[14.5px] leading-relaxed text-ink-2" aria-live="polite">
            {filtered ? (
              <>
                <span className="font-medium text-ink">{results.length}</span> of {packages.length} getaways.
              </>
            ) : (
              <>{packages.length} packages across Australia and Bali.</>
            )}{" "}
            {girls ? `Prices are per person for a group of ${girls}.` : "Prices are per person and change with the size of your group."}
            {filtered && (
              <button type="button" onClick={clear} className="link-u ml-2 text-ink">
                Clear search
              </button>
            )}
          </p>

          {when && (
            <p className="mt-4 flex flex-wrap items-center gap-2.5 text-[13.5px] text-ink-2">
              <button
                type="button"
                className="chip bg-white"
                onClick={() => setDates({ from: "", to: "" })}
                aria-label={`Remove the dates ${when}`}
              >
                {when} <IconClose size={12} />
              </button>
              <span>We&apos;ll check these dates with each property when you enquire.</span>
            </p>
          )}
        </div>
      </section>

      <section className="sec bg-paper pt-7 md:pt-8">
        <div className="ctr">
          {/* Where · who · sort · words: one row on a wide screen, so the results start straight under it. */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
            <label className="relative">
              <span className="sr-only">Where</span>
              <select
                value={where}
                onChange={(e) => {
                  setWhere(e.target.value);
                  narrow();
                }}
                className={select}
              >
                <option value="">Anywhere ({packages.length})</option>
                <optgroup label="States">
                  {whereOptions.states.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.name} ({s.count})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Destinations">
                  {whereOptions.places.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.name} ({d.count})
                    </option>
                  ))}
                </optgroup>
              </select>
              <Arrow />
            </label>
            <label className="relative">
              <span className="sr-only">How many girls</span>
              <select
                value={girls}
                onChange={(e) => {
                  setGirls(Number(e.target.value));
                  narrow();
                }}
                className={select}
              >
                <option value={0}>Any group size</option>
                {sizes.map((n) => (
                  <option key={n} value={n}>
                    {n} girls
                  </option>
                ))}
              </select>
              <Arrow />
            </label>
            <label className="relative">
              <span className="sr-only">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={select}>
                {SORTS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
              <Arrow />
            </label>
            <label className="relative flex h-12 items-center gap-3 rounded-full border border-rule bg-white px-5">
              <IconSearch size={17} className="flex-none text-ink-3" />
              <span className="sr-only">Search getaways by name</span>
              <input
                id="catalogue-q"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  narrow();
                }}
                placeholder="Name or venue…"
                className="min-w-0 flex-1 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-ink-3"
              />
            </label>
          </div>

          {/* Styles */}
          <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
            <button type="button" className="chip" aria-pressed={!style} onClick={() => setStyle("")}>
              All styles
            </button>
            {offered.map((s) => (
              <button
                key={s.name}
                type="button"
                className="chip"
                aria-pressed={style === s.name}
                onClick={() => {
                  setStyle(style === s.name ? "" : s.name);
                  narrow();
                }}
              >
                {pretty(s.name.replace(/\s+/g, "-"))}
                <span className="text-[11px] opacity-60">{s.count}</span>
              </button>
            ))}
            {styles.length > offered.length && (
              <button type="button" className="chip flex-none text-ink-2" onClick={() => setAllStyles(true)}>
                More styles ({styles.length - offered.length})
              </button>
            )}
          </div>

          {results.length === 0 ? (
            /*
             * No set package for what they chose is where a tailor-made one
             * starts, not where the page ends. The form takes what they
             * searched for as the brief and asks for the rest.
             */
            <div className="mt-8 max-w-[760px]">
              <TailorMade asked={looking} people={girls || null} />
              <button type="button" onClick={clear} className="link-u mt-5 text-[14px] text-ink-2">
                Or clear the search and see every getaway
              </button>
            </div>
          ) : (
            <>
              <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {results.slice(0, shown).map((p) => (
                  <li key={p.slug}>
                    <PackageCard p={p} girls={girls} carry={carry} />
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
    </>
  );
}

function PackageCard({ p, girls, carry }: { p: Card; girls: number; carry: string }) {
  const cost = priceFor(p.priceTable, girls);
  // The search goes with the click, so the package page opens knowing who is going and when.
  const href = `/package-search/${[p.destination, p.slug].filter(Boolean).join("/")}/${carry}`;

  return (
    <Link href={href} className="group block">
      <span className="plate plate-zoom block aspect-[10/11] rounded-[var(--r)]">
        {p.heroImage && (
          // Served by the portal's own media store.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageAt(p.heroImage, 1000)!} alt="" loading="lazy" decoding="async" />
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
            {cost === null ? (
              <span className="text-ink-3">On request</span>
            ) : cost.exact ? (
              // Her price for a group this size. "from" only where she offers that size two ways.
              <>
                {cost.options > 1 && <span className="text-ink-3">from </span>}
                <span className="font-medium">${cost.price.toLocaleString("en-AU")}</span>
                <span className="text-ink-3"> pp for {girls}</span>
              </>
            ) : (
              <>
                <span className="text-ink-3">from </span>
                <span className="font-medium">${cost.price.toLocaleString("en-AU")}</span>
                <span className="text-ink-3"> pp</span>
              </>
            )}
          </span>
        </span>
      </span>
    </Link>
  );
}
