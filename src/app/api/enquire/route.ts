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
  return new NextResponse(null, { status: 204 });
}
