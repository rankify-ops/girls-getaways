import { NextResponse } from "next/server";

/*
 * Enquiries → the client's portal inbox.
 *
 * The browser posts here rather than straight to app.rankify.com.au so the
 * site id stays server-side: it is the key to the whole collection API, and a
 * NEXT_PUBLIC_ one would be sitting in the shipped bundle for anyone to spray.
 *
 * The portal resolves `item` to the real package, so an enquiry still names
 * the right getaway after the client renames it. `website` is a honeypot the
 * portal discards silently — it is forwarded, never judged here, so there is
 * one place deciding what a bot looks like.
 */

const BASE = process.env.PORTAL_API_BASE;
const SITE_ID = process.env.PORTAL_SITE_ID;
const WEB3FORMS_KEY = process.env.WEB3FORMS_KEY;

const text = (v: unknown, max: number): string | undefined => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : undefined;
};

export async function POST(req: Request) {
  if (!BASE || !SITE_ID) {
    // No inbox to put it in. Say so plainly rather than swallowing an
    // enquiry — the form tells the visitor to phone instead.
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  let input: Record<string, unknown>;
  try {
    input = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const name = text(input.name, 120);
  const email = text(input.email, 200);
  const phone = text(input.phone, 40);
  if (!name) return NextResponse.json({ error: "name-required" }, { status: 400 });
  if (!email && !phone) return NextResponse.json({ error: "contact-required" }, { status: 400 });

  const size = Number(input.groupSize);
  const on = text(input.preferredOn, 10);

  const res = await fetch(`${BASE}/sites/${SITE_ID}/enquiries`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      name,
      email,
      phone,
      groupSize: Number.isFinite(size) && size > 0 ? Math.min(Math.round(size), 999) : undefined,
      // The portal wants YYYY-MM-DD; anything else is dropped rather than guessed at.
      preferredOn: on && /^\d{4}-\d{2}-\d{2}$/.test(on) ? on : undefined,
      message: text(input.message, 4000),
      item: text(input.item, 200),
      website: text(input.website, 200),
    }),
    cache: "no-store",
  });

  if (res.status === 429) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });

  // Stored first, emailed second, never both at once.
  //
  // Parallel posts can disagree quietly, and the bad case reads as success: an
  // email arrives for an enquiry that was never recorded, and whoever replies
  // is answering something with no row behind it. Storing first means the
  // email is always a notification about an enquiry that definitely exists.
  //
  // The email is a courtesy on top. If it fails the enquiry is already safe,
  // so this never changes what the visitor is told — it is logged and dropped.
  await notify({ name, email, phone, size, on, message: text(input.message, 4000), item: text(input.item, 200) });

  return new NextResponse(null, { status: 204 });
}

type Notice = {
  name: string;
  email?: string;
  phone?: string;
  size: number;
  on?: string;
  message?: string;
  item?: string;
};

async function notify(n: Notice) {
  if (!WEB3FORMS_KEY) return; // no key configured yet — the row is still stored
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `New enquiry — ${n.item ?? "Girls Getaways"}`,
        from_name: "Girls Getaways website",
        // Web3Forms uses this for the reply-to, so a reply goes to the person
        // who enquired rather than into the void.
        email: n.email,
        package: n.item ?? "—",
        name: n.name,
        phone: n.phone ?? "—",
        girls: Number.isFinite(n.size) && n.size > 0 ? n.size : "—",
        preferred_date: n.on ?? "—",
        message: n.message ?? "—",
        note: "Recorded in the portal at app.rankify.com.au — reply there, not to this email.",
      }),
      cache: "no-store",
    });
  } catch (err) {
    console.error("enquiry stored but the notification email failed", err);
  }
}
