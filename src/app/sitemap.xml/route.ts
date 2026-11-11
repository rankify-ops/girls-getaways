import { getCatalogue, packageHref } from "@/lib/catalogue";
import { requestSite } from "@/lib/host";

/*
 * The sitemap, built from the live catalogue so a package added in the portal
 * appears here within the hour without anybody editing a file.
 *
 * URLs are absolute against the host being served, because the same build runs
 * on the preview and, at cutover, on her own domain — a sitemap listing the
 * wrong host is worse than none.
 */

export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const { origin } = await requestSite();
  const packages = await getCatalogue();

  const urls = [
    { loc: "/", priority: "1.0", freq: "weekly" },
    { loc: "/package-search", priority: "0.9", freq: "daily" },
    ...packages.map((p) => ({ loc: packageHref(p), priority: "0.8", freq: "weekly" })),
  ];

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url><loc>${esc(origin + u.loc)}</loc>` +
          `<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`,
      )
      .join("\n") +
    "\n</urlset>\n";

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
