import { headers } from "next/headers";

/*
 * Which site is being served, decided from the request rather than from a
 * build-time constant.
 *
 * It matters because the same build runs on girls-getaways.vercel.app and, at
 * cutover, on girlsgetaways.com.au. Her Squarespace site is live and indexed
 * today: if a search engine indexes the preview, it competes with her own
 * pages for her own terms. So the preview says no to crawlers and the real
 * domain says yes, and nobody has to remember to flip anything on the day.
 */

/** The live customer-facing domain, with or without www. */
export const isLiveDomain = (host: string): boolean =>
  /(^|\.)girlsgetaways\.com\.au$/i.test(host.split(":")[0]);

export async function requestSite(): Promise<{ host: string; origin: string; live: boolean }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  // Anything that is not a local dev server is https. Trusting the forwarded
  // header would let one http request publish an http sitemap and an http
  // canonical for a site that only answers on https.
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
  const proto = local ? "http" : "https";
  return { host, origin: `${proto}://${host}`, live: isLiveDomain(host) };
}
