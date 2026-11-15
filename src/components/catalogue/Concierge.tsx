"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { IconSparkle, IconUsers, IconMoon, IconClose } from "@/components/ui/Icons";
import { pretty } from "@/lib/catalogue";
import { TailorMade } from "@/components/catalogue/TailorMade";

/*
 * "Tell us about your trip" — plain English in, her own packages out.
 *
 * The matching, the ordering and the prices all come from the portal. This
 * renders the answer in the order it arrives and does not re-rank, re-filter
 * or re-price any of it: `fromPrice` is resolved at the group size the visitor
 * described, by the one piece of code that reads a price table with duplicate
 * group sizes correctly.
 *
 * Three states that are easy to get wrong, so they are deliberate here:
 *
 *  - No matches is not "no". "Skiing in Japan for 6" has no set package behind
 *    it, and three packages that happen to fit six people would be a worse
 *    answer than none. But most of what she books is designed to order, so the
 *    answer to an empty shortlist is "we'll tailor one", with a form that
 *    takes the trip and their details (TailorMade). The same form is offered
 *    under real matches too, for the visitor who wanted something close to
 *    them but not them.
 *  - `url` may be null for a package with no path. The card then renders
 *    unlinked rather than pointing at /null.
 *  - `why` is null while the written layer is switched off, which is the
 *    normal state and not a degraded one. The package's own notes take its
 *    place, and nothing on screen mentions which layer answered.
 */

type Suggestion = {
  id: string;
  name: string;
  url: string | null;
  place: string | null;
  nights: number | null;
  styles: string[];
  image: string | null;
  fromPrice: number | null;
  groupSizes: number[];
  notes: string[];
  why: string | null;
};

type Answer = {
  understood: { people: number | null; budget: number | null; nights: number | null };
  count: number;
  note?: string | null;
  packages: Suggestion[];
};

/*
 * Kept short enough to sit in a 375px row without the chip itself becoming
 * the thing that scrolls the page sideways.
 */
const EXAMPLES = [
  "6 of us, winery weekend, under $400 each",
  "Hens weekend on the Gold Coast for 12",
  "Spa weekend for 8, two nights",
];

/** A package note, as a chip. The price already has its own slot on the card. */
function noteLabel(note: string): string | null {
  if (/^from \$/i.test(note)) return null;
  if (/^priced/i.test(note)) return note.charAt(0).toUpperCase() + note.slice(1);
  return pretty(note.replace(/\s+/g, "-"));
}

export function Concierge() {
  const [what, setWhat] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [answer, setAnswer] = useState<Answer | null>(null);
  // The sentence the answer on screen is an answer to. Not `what`: that is the
  // box, and they can go on typing in it while the answer is still showing.
  const [asked, setAsked] = useState("");
  // Whether the tailor-made form is open under a list of matches.
  const [tailor, setTailor] = useState(false);
  // Only the newest question may paint. Two quick submissions otherwise race,
  // and the loser can land last and overwrite the answer on screen.
  const turn = useRef(0);

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 2) return;
    const mine = ++turn.current;
    setState("busy");
    setWhat(q);

    try {
      const res = await fetch("/api/suggest/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ what: q }),
      });
      if (mine !== turn.current) return;
      if (!res.ok) {
        setState("error");
        return;
      }
      setAnswer((await res.json()) as Answer);
      setAsked(q);
      setTailor(false);
      setState("done");
    } catch {
      if (mine === turn.current) setState("error");
    }
  }

  const reset = () => {
    turn.current++;
    setWhat("");
    setAnswer(null);
    setAsked("");
    setTailor(false);
    setState("idle");
  };

  const u = answer?.understood;
  const read = [
    u?.people ? `${u.people} girls` : null,
    u?.nights ? `${u.nights} ${u.nights === 1 ? "night" : "nights"}` : null,
    u?.budget ? `under $${u.budget.toLocaleString("en-AU")} each` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="sec bg-sand pb-12 pt-12">
      <div className="ctr">
        <p className="eyebrow flex items-center gap-2">
          <IconSparkle size={15} /> Tell us about your trip
        </p>
        <h2 className="serif mt-3 max-w-[22ch] text-[30px] leading-[1.08] text-ink md:text-[36px]">
          Describe it in your own words
        </h2>

        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(what);
          }}
        >
          {/* min-h as well as h: stacked on a phone this is a flex column, where flex-1 lets the height collapse to the text. */}
          <label className="flex h-14 min-h-14 flex-1 items-center rounded-full border border-rule bg-white px-6 shadow-[var(--shadow-s)]">
            <span className="sr-only">Describe your getaway</span>
            <input
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              maxLength={400}
              placeholder="8 of us, hens weekend, somewhere near the beach…"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
            />
          </label>
          <button
            type="submit"
            disabled={state === "busy" || what.trim().length < 2}
            className="btn btn-ink w-full disabled:opacity-45 sm:w-auto"
          >
            {state === "busy" ? "Looking…" : "Find my getaway"}
          </button>
        </form>

        {state === "idle" && (
          // One scrolling row on a phone, wrapped on a wide screen — the same
          // pattern the style filters below use, so a long example never drags
          // the whole page sideways.
          <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
            {EXAMPLES.map((e) => (
              <button key={e} type="button" className="chip flex-none" onClick={() => void ask(e)}>
                {e}
              </button>
            ))}
          </div>
        )}

        {state === "error" && (
          <p className="mt-5 text-[14px] text-ink-2" role="status">
            That didn&apos;t go through. Try again, or{" "}
            <Link href="/package-search" className="link-u text-ink">
              browse every getaway
            </Link>
            .
          </p>
        )}

        {state === "done" && answer && (
          <div className="mt-7" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
              <p className="text-[14px] text-ink-2">
                {answer.count > 0 ? (
                  <>
                    <span className="font-medium text-ink">{answer.count}</span>{" "}
                    {answer.count === 1 ? "getaway" : "getaways"}
                    {read.length > 0 && <> for {read.join(", ")}</>}
                  </>
                ) : (
                  <>That&apos;s one we&apos;d tailor for you</>
                )}
              </p>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink"
              >
                <IconClose size={14} /> Start again
              </button>
            </div>

            {answer.count === 0 ? (
              <div className="mt-6 max-w-[760px]">
                <TailorMade key={asked} asked={asked} people={u?.people} />
              </div>
            ) : (
              <>
                <ul className="mt-7 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                  {answer.packages.map((p) => (
                    <li key={p.id}>
                      <Card p={p} />
                    </li>
                  ))}
                </ul>
                {answer.note && (
                  <p className="mt-8 max-w-[62ch] text-[12.5px] leading-relaxed text-ink-3">{answer.note}</p>
                )}

                {/*
                  * Close, but not it. A set package is a starting point as often
                  * as it is the answer, and the visitor who wants the Gold Coast
                  * one with a brunch added should not have to work out that the
                  * way to say so is the enquiry form on a package they did not
                  * quite want.
                  */}
                {tailor ? (
                  <div className="mt-10 max-w-[760px]">
                    <TailorMade key={asked} asked={asked} people={u?.people} />
                  </div>
                ) : (
                  <div className="mt-10 flex flex-col items-start gap-4 rounded-[28px] bg-white px-6 py-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
                    <p className="text-[15px] leading-relaxed text-ink-2">
                      <span className="serif block text-[23px] leading-tight text-ink">Not quite it?</span>
                      We design getaways to order. Tell us what you&apos;d change and we&apos;ll tailor one.
                    </p>
                    <button type="button" onClick={() => setTailor(true)} className="btn btn-ink w-full flex-none sm:w-auto">
                      Tailor one for us
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Card({ p }: { p: Suggestion }) {
  const min = p.groupSizes.length ? Math.min(...p.groupSizes) : null;
  const max = p.groupSizes.length ? Math.max(...p.groupSizes) : null;
  const chips = (p.why ? [] : p.notes.map(noteLabel).filter(Boolean).slice(0, 3)) as string[];

  const body = (
    <>
      <span className="plate plate-zoom block aspect-[10/11] rounded-[var(--r)]">
        {p.image && (
          // Served by the portal's own media store.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" loading="lazy" decoding="async" />
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/45 to-transparent"
        />
      </span>

      <span className="mt-4 block">
        {p.place && <span className="eyebrow block">{pretty(p.place)}</span>}
        <span className="serif mt-1.5 block text-[25px] leading-[1.08] text-ink group-hover:text-clay-deep">
          {p.name}
        </span>

        {p.why ? (
          <span className="mt-2 block text-[13.5px] leading-relaxed text-ink-2">{p.why}</span>
        ) : (
          chips.length > 0 && (
            <span className="mt-2.5 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span key={c} className="rounded-full bg-blush px-2.5 py-1 text-[11.5px] text-ink-2">
                  {c}
                </span>
              ))}
            </span>
          )
        )}

        <span className="mt-3.5 flex items-center justify-between gap-3 border-t border-rule pt-3.5 text-[13px]">
          <span className="flex items-center gap-3 text-ink-2">
            <span className="flex items-center gap-1.5">
              <IconUsers size={15} />
              {min && max ? (min === max ? `${min}` : `${min}–${max}`) : "Any"}
            </span>
            {p.nights && (
              <span className="flex items-center gap-1.5">
                <IconMoon size={14} />
                {p.nights}
              </span>
            )}
          </span>
          <span className="text-ink">
            {p.fromPrice === null ? (
              <span className="text-ink-3">On request</span>
            ) : (
              <>
                <span className="text-ink-3">from </span>
                <span className="font-medium">${p.fromPrice.toLocaleString("en-AU")}</span>
                <span className="text-ink-3"> each</span>
              </>
            )}
          </span>
        </span>
      </span>
    </>
  );

  // A package with no path is still worth showing; it just cannot be a link.
  return p.url ? (
    <Link href={p.url} className="group block">
      {body}
    </Link>
  ) : (
    <div className="group block">{body}</div>
  );
}
