import { NextResponse } from "next/server";

/*
 * Page views → the client's portal.
 *
 * A proxy for the same reason /api/enquire is one: the portal URL carries the
 * site id, which is the key to the whole collection API, and a NEXT_PUBLIC_
 * one would ship in the bundle.
 *
 * This answers 204 to everything, always, including when the portal is not
 * configured or is down. A view counter is the least important thing on the
 * page and must never surface an error to a visitor.
 */

const BASE = process.env.PORTAL_API_BASE;
const SITE_ID = process.env.PORTAL_SITE_ID;

const ok = () => new NextResponse(null, { status: 204 });

export async function POST(req: Request) {
  if (!BASE || !SITE_ID) return ok();

  try {
    const body = (await req.json()) as { path?: unknown; item?: unknown };
    const raw = typeof body.path === "string" ? body.path : "";
    // Query strings and fragments carry whatever a visitor arrived with; a
    // per-path counter has no use for them. The portal strips them too.
    const path = raw.split(/[?#]/)[0].replace(/\/+$/, "").slice(0, 300) || "/";
    if (!path.startsWith("/")) return ok();

    const item = typeof body.item === "string" && body.item.trim() ? body.item.trim().slice(0, 200) : undefined;

    await fetch(`${BASE}/sites/${SITE_ID}/view`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, item }),
      cache: "no-store",
    });
  } catch {
    // Counting is best-effort by design.
  }
  return ok();
}
