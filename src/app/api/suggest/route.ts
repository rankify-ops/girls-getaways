import { NextResponse } from "next/server";

/*
 * "Tell us about your trip" -> packages, answered by the client's portal.
 *
 * Proxied for the same reason enquiries and views are: the portal's suggest
 * endpoint carries the site id in its path, and the site id is the key to the
 * whole collection API. A NEXT_PUBLIC_ one would ship in the bundle.
 *
 * The ranking, the prices and the order are the portal's answer. Nothing is
 * re-sorted, re-filtered or re-priced here or in the component that renders
 * it: the price table has duplicate group sizes by design and the portal is
 * the one place that reads it correctly.
 */

const BASE = process.env.PORTAL_API_BASE;
const SITE_ID = process.env.PORTAL_SITE_ID;

/*
 * The key that unlocks the written suggestions, read from the environment and
 * never given a fallback literal: a default here would live in git history and
 * then in whatever is built from it. Absent or wrong simply means the matched
 * packages keep coming back, for ever, so there is nothing to handle.
 */
const SUGGEST_KEY = process.env.RANKIFY_SUGGEST_KEY;

const isIp = (v: string): boolean =>
  /^\d{1,3}(\.\d{1,3}){3}$/.test(v) || (/^[0-9a-f:]{3,45}$/i.test(v) && v.includes(":"));

/**
 * Who is asking, for the portal's per-visitor limit.
 *
 * Every visitor reaches the portal from one Vercel address, so without this
 * they would all share a bucket. Taken from the edge rather than the body
 * because a visitor must not be able to choose their own bucket.
 *
 * Null when it cannot be established — everyone unidentified then shares a
 * single, tighter bucket, which is the point. A placeholder or a random id
 * would hand each of them a fresh allowance instead.
 */
function visitorId(req: Request): string | null {
  for (const name of ["x-vercel-forwarded-for", "x-forwarded-for"]) {
    const raw = req.headers.get(name);
    if (!raw) continue;
    // Every hop appends, so the RIGHTMOST entry is the one our nearest trusted
    // proxy wrote. Anything left of it is whatever the client claimed to be.
    const ip = raw.split(",").pop()?.trim() ?? "";
    if (isIp(ip)) return ip;
  }
  return null;
}

export async function POST(req: Request) {
  if (!BASE || !SITE_ID) {
    // Nothing to ask. The component hides itself rather than offering a
    // search box that cannot answer.
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  let input: Record<string, unknown>;
  try {
    input = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const what = typeof input.what === "string" ? input.what.trim().slice(0, 400) : "";
  // The portal wants 2-400 characters and 400s anything shorter. Catch it here
  // so a stray keystroke is a quiet no-op instead of a round trip.
  if (what.length < 2) return NextResponse.json({ error: "too-short" }, { status: 400 });

  let res: Response;
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
    };
    // Both server-side only. Neither may reach the browser.
    if (SUGGEST_KEY) headers["x-rankify-key"] = SUGGEST_KEY;
    const visitor = visitorId(req);
    if (visitor) headers["x-visitor-id"] = visitor;

    res = await fetch(`${BASE}/sites/${SITE_ID}/suggest`, {
      method: "POST",
      headers,
      body: JSON.stringify({ what }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  if (res.status === 400) return NextResponse.json({ error: "bad-request" }, { status: 400 });
  if (res.status === 429) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });
  if (!res.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  // Passed through unchanged, including `by` and `note`.
  return NextResponse.json(await res.json(), {
    headers: { "cache-control": "no-store" },
  });
}
