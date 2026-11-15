// Does every page on the site load, and does everything on it lead somewhere?
//
// Walks the real site the way a visitor and a search engine do: every address
// in the sitemap, then every internal link and every picture those pages use.
// Reports any page that does not answer 200, any link to a page that is not
// there, any picture that does not load, and any page with no title or no
// heading.
//
//   node scripts/check_site.mjs                       (the staging site)
//   node scripts/check_site.mjs https://www.girlsgetaways.com.au
//
// Reads only. Sends no forms.
const BASE = (process.argv[2] ?? "https://girls-getaways.vercel.app").replace(/\/+$/, "");
const UA = "Mozilla/5.0 (site check)";

const get = (url, method = "GET") =>
  fetch(url, { method, headers: { "user-agent": UA }, redirect: "manual" }).catch(() => ({ status: 0, headers: new Headers(), text: async () => "" }));

async function pool(items, size, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const n = i++;
        out[n] = await fn(items[n]);
      }
    }),
  );
  return out;
}

const local = (href) => {
  try {
    const u = new URL(href, BASE);
    return u.origin === new URL(BASE).origin ? u.pathname + u.search : null;
  } catch {
    return null;
  }
};

const sitemap = await (await get(`${BASE}/sitemap.xml`)).text();
const pages = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname))];
if (!pages.includes("/")) pages.unshift("/");
console.log(`${BASE}: ${pages.length} pages in the sitemap`);

const problems = [];
const links = new Map(); // path -> first page that links to it
const images = new Map();

let redirected = 0;
await pool(pages, 8, async (path) => {
  let res = await get(BASE + path);
  // A sitemap should list the address a page lives at, not one that sends you on to it.
  if (res.status >= 300 && res.status < 400) {
    redirected += 1;
    const next = local(res.headers.get("location") ?? "");
    if (next) res = await get(BASE + next);
  }
  if (res.status !== 200) {
    problems.push(`page ${res.status}: ${path}`);
    return;
  }
  const html = await res.text();
  if (!/<title>[^<]{3,}<\/title>/.test(html)) problems.push(`no title: ${path}`);
  if (!/<h1[\s>]/.test(html)) problems.push(`no main heading: ${path}`);
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"#]+)(?:#[^"]*)?"/g)) {
    const to = local(m[1].replace(/&amp;/g, "&"));
    if (to && !to.startsWith("/_next/") && !links.has(to)) links.set(to, path);
  }
  for (const m of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
    const src = m[1].replace(/&amp;/g, "&");
    if (src.startsWith("data:")) continue;
    const abs = new URL(src, BASE).href;
    if (!images.has(abs)) images.set(abs, path);
  }
});

if (redirected) problems.push(`the sitemap lists ${redirected} address(es) that redirect instead of answering`);
console.log(`${links.size} different internal links, ${images.size} different pictures`);

await pool([...links.keys()], 10, async (to) => {
  let res = await get(BASE + to);
  // A few hops: a trailing slash, then an old address being sent on, is fine if it lands somewhere real.
  for (let hop = 0; hop < 4 && res.status >= 300 && res.status < 400; hop++) {
    const next = local(res.headers.get("location") ?? "");
    if (!next) break;
    res = await get(BASE + next);
  }
  if (res.status !== 200) problems.push(`broken link ${res.status}: ${to}  (on ${links.get(to)})`);
});

await pool([...images.keys()], 16, async (src) => {
  let res = await get(src, "HEAD");
  if (res.status === 405 || res.status === 0) res = await get(src);
  if (res.status !== 200) problems.push(`broken picture ${res.status}: ${src}  (on ${images.get(src)})`);
});

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems.sort().slice(0, 80)) console.log("  " + p);
  if (problems.length > 80) console.log(`  … and ${problems.length - 80} more`);
  process.exit(1);
}
console.log("✔ every page loads, every internal link lands, every picture loads");
