"use client";

import { useId, useState } from "react";
import { IconArrow, IconCheck } from "@/components/ui/Icons";
import { TAILOR_ITEM, WISHES, groupOf, tailorHeadline, tailorMessage } from "@/lib/tailor";
import { trackLead } from "@/lib/track";
import { site, telHref } from "@/content/site";

/*
 * "We'll tailor one for you" — what a visitor gets when no set package fits.
 *
 * It used to be a sentence saying she had nothing like that and a button back
 * to the catalogue. Most of what the GG team books is designed to order, so
 * that sentence was wrong about the business and it ended the conversation at
 * the exact moment somebody had described a trip they want to pay for.
 *
 * This keeps the conversation going: it says the trip back to them, asks what
 * they would love in it, and takes a name and a way to reach them. It goes to
 * the same inbox as every other enquiry (/api/enquire), filed as a tailor-made
 * request with their own words at the top.
 *
 * The wishes are requests, not stock. Nothing here says a thing is available:
 * the team goes and finds what it can and comes back with a plan and a price,
 * and the words on screen say that.
 *
 * `item` is a title with a space in it, not a slug. The portal looks an item
 * up by slug and, finding none, files the enquiry under the words it was
 * given, so this reads "Tailor-made getaway" in her inbox with no package
 * behind it. A slug cannot contain a space, so it can never match one.
 */

type Props = {
  /** What they asked for, in their words or as the filters they chose. */
  asked: string;
  /** The group size, when they gave one. */
  people?: number | null;
};

const today = () => new Date().toISOString().slice(0, 10);

export function TailorMade({ asked, people }: Props) {
  const id = useId();
  const group = groupOf(people);
  const [wishes, setWishes] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    groupSize: group ? String(group) : "",
    preferredOn: "",
    notes: "",
    website: "", // honeypot — a person never sees this
  });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "offline">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });
  const toggle = (w: string) => setWishes((on) => (on.includes(w) ? on.filter((x) => x !== w) : [...on, w]));

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
          name: form.name,
          email: form.email,
          phone: form.phone,
          groupSize: form.groupSize,
          preferredOn: form.preferredOn,
          website: form.website,
          item: TAILOR_ITEM,
          message: tailorMessage({ asked, wishes, notes: form.notes }),
        }),
      });
      // 503 means the inbox isn't wired up. Say so, so nobody thinks it landed.
      if (res.status === 503) setState("offline");
      else if (res.ok) {
        setState("sent");
        trackLead("tailor-made", { item: TAILOR_ITEM, girls: Number(form.groupSize) || undefined });
      }
      else setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-[28px] border border-rule bg-white p-8 text-center shadow-[var(--shadow)]" role="status">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-blush text-clay-deep">
          <IconCheck size={22} />
        </span>
        <h3 className="serif mt-5 text-[30px] leading-tight text-ink">Got it, {form.name.trim().split(" ")[0]}!</h3>
        <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">
          The GG team will see what they can line up and come back to you
          {emailOk ? ` at ${form.email}` : " shortly"} with a plan and a price.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="relative rounded-[28px] border border-rule bg-white p-6 text-left shadow-[var(--shadow)] md:p-9"
    >
      <p className="eyebrow">Tailor-made</p>
      <h3 className="serif mt-3 max-w-[20ch] text-[30px] leading-[1.08] text-ink md:text-[36px]">
        {tailorHeadline(asked, people)}
      </h3>
      <p className="lede mt-3 max-w-[56ch]">
        Most of our getaways are designed to order. Tell us what you&apos;d love and the GG team will see what
        they can line up, then come back to you with a plan and a price.
      </p>

      <fieldset className="mt-7">
        <legend className="text-[14px] font-medium text-ink">Anything you&apos;d love to lock in?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {WISHES.map((w) => (
            <button key={w} type="button" className="chip" aria-pressed={wishes.includes(w)} onClick={() => toggle(w)}>
              {w}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label className="mb-2 block text-[13px] text-ink-2" htmlFor={`${id}-notes`}>
          Anything else you have your heart set on?
        </label>
        <textarea
          id={`${id}-notes`}
          className="field h-24 py-3"
          maxLength={2000}
          value={form.notes}
          onChange={set("notes")}
          placeholder="Where, roughly when, the occasion, a budget each, the bride’s favourite bubbles…"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor={`${id}-name`}>Your name</label>
          <input id={`${id}-name`} className="field" autoComplete="name" value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor={`${id}-email`}>Email</label>
          <input id={`${id}-email`} className="field" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor={`${id}-phone`}>Phone</label>
          <input id={`${id}-phone`} className="field" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor={`${id}-girls`}>How many girls</label>
          <input id={`${id}-girls`} className="field" inputMode="numeric" value={form.groupSize} onChange={set("groupSize")} placeholder="6" />
        </div>
        <div>
          <label className="mb-2 block text-[13px] text-ink-2" htmlFor={`${id}-when`}>Preferred dates</label>
          <input id={`${id}-when`} className="field" type="date" min={today()} value={form.preferredOn} onChange={set("preferredOn")} />
        </div>
      </div>

      {/* Honeypot. Off-screen rather than display:none, which some bots skip. */}
      <div aria-hidden className="pointer-events-none absolute left-[-9999px] h-0 overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      </div>

      <p className="mt-5 text-[13px] text-ink-3">
        An email or a phone number is enough. No payment now, and nothing is booked until you say yes to the plan.
        Rather talk it through?{" "}
        <a href={telHref} className="link-u text-ink">
          Call {site.phone}
        </a>
        .
      </p>

      {state === "error" && (
        <p className="mt-3 text-[13.5px] text-clay-deep" role="alert">
          That didn&apos;t send. Please try again, or phone the GG team.
        </p>
      )}
      {state === "offline" && (
        <p className="mt-3 text-[13.5px] text-clay-deep" role="alert">
          Our enquiry inbox is being set up. Please phone or email the GG team and we&apos;ll look after you.
        </p>
      )}

      <button
        type="submit"
        disabled={!ready || state === "sending"}
        className="btn btn-ink mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {state === "sending" ? "Sending…" : "Send it to the GG team"} <IconArrow size={16} />
      </button>
    </form>
  );
}
