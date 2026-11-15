"use client";

import { useState } from "react";
import { asset } from "@/lib/basePath";
import { IconArrow, IconCheck } from "@/components/ui/Icons";
import { trackLead } from "@/lib/track";

export function Sisterhood() {
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — a person never sees this
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");

  /*
   * It keeps the address.
   *
   * This form said "Welcome to the Sisterhood" and sent the email address
   * nowhere: it set a flag and showed the tick. Every sign-up since the page
   * was built was thanked and lost.
   *
   * A sign-up goes to her dashboard, where Sign-ups is a list of its own: who
   * joined and when, with a download for whatever sends her emails. It only
   * says welcome once that has been stored.
   */
  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/enquire/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Sisterhood sign-up",
          email,
          website,
          kind: "signup",
          item: "GG Sisterhood",
        }),
      });
      if (!res.ok) return setState("error");
      setDone(true);
      trackLead("sisterhood");
    } catch {
      setState("error");
    }
  }

  return (
    <section id="sisterhood" className="sec relative overflow-hidden bg-blush">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/img/mark-ink.png")} alt="" aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[420px] opacity-[0.05]" />
      <div className="ctr relative text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/img/mark-ink.png")} alt="" className="mx-auto size-16" />
        <h2 className="h2 mx-auto mt-6 max-w-[16ch]">
          Join the GG <em className="italic text-clay-deep">Sisterhood</em>
        </h2>
        <p className="lede mx-auto mt-4 max-w-[40ch]">Receive exclusive deals, birthday offers &amp; free bubbly!</p>

        {done ? (
          <div className="load-in mx-auto mt-9 flex max-w-[520px] items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-[15px] text-ink shadow-s">
            <IconCheck size={19} className="text-clay-deep" /> Welcome to the Sisterhood{name ? `, ${name.split(" ")[0]}` : ""}!
          </div>
        ) : (
          <form
            onSubmit={join}
            className="mx-auto mt-9 flex max-w-[620px] flex-col gap-2 rounded-[30px] bg-white p-2 shadow-s sm:flex-row sm:rounded-full"
          >
            <label className="sr-only" htmlFor="ss-name">First name</label>
            <input id="ss-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" autoComplete="given-name" className="h-12 flex-1 rounded-full bg-transparent px-5 text-[15px] text-ink outline-none placeholder:text-ink-3" />
            <span aria-hidden className="hidden w-px self-stretch bg-rule sm:block" />
            <label className="sr-only" htmlFor="ss-email">Email</label>
            <input id="ss-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" className="h-12 flex-[1.4] rounded-full bg-transparent px-5 text-[15px] text-ink outline-none placeholder:text-ink-3" />
            {/* Honeypot. Off-screen rather than display:none, which some bots skip. */}
            <span aria-hidden className="pointer-events-none absolute left-[-9999px] h-0 overflow-hidden">
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} aria-label="Website" />
            </span>
            <button type="submit" disabled={state === "sending"} className="btn btn-ink h-12 disabled:opacity-50">
              {state === "sending" ? "Joining…" : "Join now"} <IconArrow size={15} />
            </button>
          </form>
        )}
        {!done && (
          <p className="mx-auto mt-4 max-w-[52ch] text-[12.5px] leading-relaxed text-ink-3" role={state === "error" ? "alert" : undefined}>
            {state === "error"
              ? "That didn’t go through. Please try again in a moment."
              : "By joining you agree to receive emails from Girls Getaways. Unsubscribe any time."}
          </p>
        )}

        <p className="mt-8 text-[14px] text-ink-2">
          Have a question for the GG Team?{" "}
          <a href={"/contact-us"} className="text-ink underline underline-offset-4">
            Get in touch
          </a>
        </p>
      </div>
    </section>
  );
}
