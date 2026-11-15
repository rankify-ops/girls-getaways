"use client";

import { useState } from "react";
import { IconArrow, IconCheck } from "@/components/ui/Icons";
import { useSearchContext } from "@/lib/searchContext";
import { datesLabel } from "@/lib/filters";
import { trackLead } from "@/lib/track";
import { site, telHref } from "@/content/site";

/*
 * The enquiry form on a package page.
 *
 * Posts to /api/enquire, which forwards to the client's portal inbox. The
 * package slug rides along as `item` so the enquiry names the getaway in her
 * inbox even after a rename.
 *
 * Either an email or a phone number is enough — plenty of her enquiries come
 * from people who would rather be called, and demanding both loses them.
 *
 * It opens with what they searched for. Somebody who chose seven girls and a
 * weekend in December on the way here has already answered two of these
 * questions, and a form that asks again reads as a site that was not
 * listening. Group size and date are null until typed in, and until then show
 * the search's (lib/searchContext.ts); once typed, theirs wins.
 */

type Props = { slug: string; title: string; guestsMin: number | null; guestsMax: number | null };

const today = () => new Date().toISOString().slice(0, 10);

export function EnquiryForm({ slug, title, guestsMin, guestsMax }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    groupSize: null as string | null,
    preferredOn: null as string | null,
    message: "",
    website: "", // honeypot — a person never sees this
  });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "offline">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const searched = useSearchContext();
  const groupSize = form.groupSize ?? (searched.girls ? String(searched.girls) : guestsMin ? String(guestsMin) : "");
  const preferredOn = form.preferredOn ?? searched.from;
  // The whole weekend they searched for, when the date is still the one they arrived with.
  const range = searched.to && preferredOn === searched.from ? datesLabel(searched.from, searched.to) : "";

  const emailOk = /^\S+@\S+\.\S+$/.test(form.email);
  const ready = form.name.trim().length > 1 && (emailOk || form.phone.trim().length >= 6);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/enquire/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          groupSize,
          preferredOn,
          message: [range ? `Dates searched: ${range}` : "", form.message].filter(Boolean).join("\n\n"),
          item: slug,
        }),
      });
      // 503 means the inbox isn't wired up — tell the visitor to phone rather
      // than letting them think the message landed somewhere.
      if (res.status === 503) setState("offline");
      else if (res.ok) {
        setState("sent");
        trackLead("enquiry", { item: title, girls: Number(groupSize) || undefined });
      }
      else setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-[28px] border border-rule bg-white p-8 text-center shadow-[var(--shadow)]">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-blush text-clay-deep">
          <IconCheck size={22} />
        </span>
        <h3 className="serif mt-5 text-[30px] leading-tight text-ink">
          Got it, {form.name.split(" ")[0]}!
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          The GG team will check availability for {title} and come back to you
          {emailOk ? ` at ${form.email}` : " shortly"}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="relative rounded-[28px] border border-rule bg-white p-6 shadow-[var(--shadow)] md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor="eq-name">Your name</label>
          <input id="eq-name" className="field" autoComplete="name" value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor="eq-email">Email</label>
          <input id="eq-email" className="field" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor="eq-phone">Phone</label>
          <input id="eq-phone" className="field" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor="eq-girls">How many girls</label>
          <input
            id="eq-girls" className="field" inputMode="numeric" value={groupSize} onChange={set("groupSize")}
            placeholder={guestsMin && guestsMax ? `${guestsMin}–${guestsMax}` : "6"}
          />
        </div>
        <div>
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor="eq-when">Preferred dates</label>
          <input id="eq-when" className="field" type="date" min={today()} value={preferredOn} onChange={set("preferredOn")} />
          {range && <p className="mt-1.5 text-[12.5px] text-ink-3">You searched {range}. We&apos;ll check the whole stay.</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor="eq-msg">Anything else?</label>
          <textarea
            id="eq-msg" className="field h-28 py-3" value={form.message} onChange={set("message")}
            placeholder="The occasion, dietaries, surprises, the bride’s favourite bubbles…"
          />
        </div>
      </div>

      {/* Honeypot. Off-screen rather than display:none, which some bots skip. */}
      <div aria-hidden className="pointer-events-none absolute left-[-9999px] h-0 overflow-hidden">
        <label htmlFor="eq-website">Website</label>
        <input id="eq-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      </div>

      <p className="mt-5 text-[13px] text-ink-3">
        We&apos;ll confirm availability and send a tailored quote — no payment now. Rather talk it through?{" "}
        <a href={telHref} className="link-u text-ink">
          Call {site.phone}
        </a>
        .
      </p>

      {state === "error" && (
        <p className="mt-3 text-[13.5px] text-clay-deep">
          That didn&apos;t send. Please try again, or phone the GG team.
        </p>
      )}
      {state === "offline" && (
        <p className="mt-3 text-[13.5px] text-clay-deep">
          Our enquiry inbox is being set up — please phone or email the GG team and we&apos;ll look after you.
        </p>
      )}

      <button type="submit" disabled={!ready || state === "sending"} className="btn btn-ink mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
        {state === "sending" ? "Sending…" : "Send enquiry"} <IconArrow size={16} />
      </button>
    </form>
  );
}
