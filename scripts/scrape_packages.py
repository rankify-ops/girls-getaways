"""
Capture the full package catalogue from the live Squarespace site.

Their package pages are consistently structured, so this reads the real thing
rather than guessing: title, venue line, the inclusions list, the getaway copy,
the per-group-size price table, their own category tags (destination, group
size and getaway style), and the hero image.

Nothing is invented. A field the page does not carry comes out as null, which
is what "price on request" means on their site.

    python scripts/scrape_packages.py --limit 5     # try a handful first
    python scripts/scrape_packages.py               # the whole catalogue

Writes audit/pkg/<slug>.html (cached, so re-runs are free) and
docs/portal-handoff/packages.json in the shape the portal imports.
"""

import argparse, concurrent.futures as cf, html, json, os, re, sys, time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "audit", "pkg")
OUT = os.path.join(ROOT, "docs", "portal-handoff")
SITEMAP_URLS = os.path.join(ROOT, "audit", "urls-packages.txt")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"


def fetch(url: str, path: str) -> str:
    if os.path.exists(path) and os.path.getsize(path) > 10_000:
        return open(path, encoding="utf-8", errors="ignore").read()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read().decode("utf-8", "ignore")
            open(path, "w", encoding="utf-8").write(body)
            return body
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))
    return ""


def text(s: str) -> str:
    """Visible text only.

    Squarespace puts a <style> block inside each content block, so stripping
    tags without dropping those first pours CSS into the copy — it reads fine
    in a count but ships "#block-0c34 { --stroke-style: none }" as a package
    description.
    """
    s = re.sub(r"<(?:style|script)[^>]*>.*?</(?:style|script)>", " ", s, flags=re.S | re.I)
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s))).strip()


def section(article: str, heading: str) -> str:
    """The markup between one h2 and the next."""
    m = re.search(
        rf"<h2[^>]*>\s*(?:<[^>]+>\s*)*{heading}.*?</h2>(.*?)(?=<h2|\Z)",
        article, re.S | re.I,
    )
    return m.group(1) if m else ""


def parse(url: str, page: str) -> dict:
    slug = url.rstrip("/").split("/")[-1]
    # Do this before any slicing: section() cuts between headings, and a
    # <style> block straddling that cut loses its tags and reads as copy.
    page = re.sub(r"<(?:style|script)[^>]*>.*?</(?:style|script)>", " ", page, flags=re.S | re.I)
    art = re.search(r"<article[^>]*>(.*?)</article>", page, re.S)
    article = art.group(1) if art else page

    h1 = text(re.findall(r"<h1[^>]*>(.*?)</h1>", page, re.S)[0]) if re.findall(r"<h1[^>]*>(.*?)</h1>", page, re.S) else ""
    h3s = [text(x) for x in re.findall(r"<h3[^>]*>(.*?)</h3>", article, re.S) if text(x)]
    h2s = [text(x) for x in re.findall(r"<h2[^>]*>(.*?)</h2>", article, re.S) if text(x)]

    # The display title is the h3; the h1 repeats it with the destination appended.
    title = h3s[0] if h3s else re.sub(r"\s*-\s*[^-]+$", "", h1).strip()

    # The line above the title is the venue / location ("THE TROPIC, BURLEIGH HEADS").
    venue = next((v for v in h2s if v.upper() not in
                  {"INCLUSIONS", "THE GETAWAY", "ESCAPE STYLE", "PRICING", "NOTES"}), None)

    # Their own tags: /package-search/category/<x> and /tag/<x>.
    tags = [html.unescape(urllib.parse.unquote(t)).strip().lower()
            for t in re.findall(r'href="/package-search/(?:category|tag)/([^"?]+)"', page)]
    tags = list(dict.fromkeys(tags))

    group_tags = [t for t in tags if re.match(r"^\d+\s*(?:[-+]|or\b)", t) or "girls" in t]
    # Their tag list mixes the destination in with the getaway styles, and the
    # destination is already a field. Drop any tag that matches a path segment
    # of this package's own URL ("byron bay" on /package-search/byron-bay/...).
    path_words = {s.replace("-", " ") for s in urllib.parse.urlparse(url).path.split("/") if s}
    style_tags = [t for t in tags if t not in group_tags and t not in path_words]

    # Price table: "No. of Girls / Price Per Person" → rows of (n, $pp).
    pricing = section(article, "PRICING") or article
    pairs = re.findall(r"(\d{1,2})\s*\$\s*([0-9,]+)\s*PP", text(pricing), re.I)
    price_table = [{"girls": int(n), "price": int(p.replace(",", ""))} for n, p in pairs]
    prices = [r["price"] for r in price_table]
    sizes = [r["girls"] for r in price_table]

    inclusions = [text(li) for li in re.findall(r"<li[^>]*>(.*?)</li>", section(article, "INCLUSIONS"), re.S)]
    inclusions = [i for i in inclusions if i]

    getaway = text(section(article, "THE GETAWAY"))
    notes = text(section(article, "NOTES"))
    escape_style = text(section(article, "ESCAPE STYLE"))

    desc = re.findall(r'<meta (?:property="og:description"|name="description") content="([^"]+)"', page)
    hero = re.findall(r'<meta property="og:image" content="([^"]+)"', page)

    nights = None
    nm = re.search(r"(\d+)\s*nights?", " ".join(inclusions) + " " + getaway, re.I)
    if nm:
        nights = int(nm.group(1))

    path = urllib.parse.urlparse(url).path.rstrip("/")
    dest = path.split("/")[2] if len(path.split("/")) > 3 else None

    return {
        "slug": slug,
        "status": "published",
        "data": {
            "title": title,
            "venue": venue,
            "destination": dest,
            "area": path.split("/")[3] if len(path.split("/")) > 4 else None,
            "blurb": html.unescape(desc[0]).strip() if desc else None,
            "description": getaway or None,
            "notes": notes or None,
            "escape_style": escape_style or None,
            "price_from": min(prices) if prices else None,
            "price_table": price_table,
            "guests_min": min(sizes) if sizes else None,
            "guests_max": max(sizes) if sizes else None,
            "nights": nights,
            "hero_image": hero[0].split("?")[0] if hero else None,
            "inclusions": [{"text": i, "included": True} for i in inclusions],
            "styles": style_tags,
            "group_tags": group_tags,
            "legacy_path": path,
        },
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)

    # audit/urls-packages.txt is the live sitemap filtered to real package
    # pages. Their sitemap also lists 44 category and 64 tag archives, which
    # are listings, not packages — counting those is what produced the wrong
    # "234 packages" figure.
    urls = [u.strip() for u in open(SITEMAP_URLS, encoding="utf-8") if u.strip()]
    urls = [u for u in urls if u.rstrip("/") != "https://www.girlsgetaways.com.au/package-search"]
    if args.limit:
        urls = urls[: args.limit]
    print(f"{len(urls)} package pages")

    items, failed = [], []

    def one(u):
        slug = u.rstrip("/").split("/")[-1]
        try:
            return parse(u, fetch(u, os.path.join(CACHE, f"{slug}.html")))
        except Exception as e:  # noqa: BLE001 — report, don't abort the run
            failed.append((u, str(e)[:90]))
            return None

    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        for i, got in enumerate(ex.map(one, urls), 1):
            if got:
                items.append(got)
            if i % 25 == 0:
                print(f"  {i}/{len(urls)}")

    places = {i["data"]["destination"].replace("-", " ") for i in items if i["data"]["destination"]}
    places |= {i["data"]["area"].replace("-", " ") for i in items if i["data"]["area"]}
    places |= {"nsw south coast", "south coast", "north coast", "sydney surrounds", "snowy mountains"}
    dests_file = os.path.join(OUT, "destinations.json")
    if os.path.exists(dests_file):
        places |= {d["data"]["name"].lower() for d in json.load(open(dests_file, encoding="utf-8"))}
    for i in items:
        d = i["data"]
        d["place_tags"] = [t for t in d["styles"] if t in places]
        d["styles"] = [t for t in d["styles"] if t not in places]
        # A package filed only under a destination has no destination segment
        # in its URL; recover it from its own tags.
        if not d["destination"] and d["place_tags"]:
            d["destination"] = d["place_tags"][0].replace(" ", "-")

    items.sort(key=lambda x: x["slug"])
    for i, it in enumerate(items):
        it["position"] = i

    with open(os.path.join(OUT, "packages.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
        f.write("\n")

    priced = [i for i in items if i["data"]["price_from"]]
    print(f"\nwrote {len(items)} packages")
    print(f"  with a price table: {len(priced)}")
    print(f"  with inclusions:    {sum(1 for i in items if i['data']['inclusions'])}")
    print(f"  with a hero image:  {sum(1 for i in items if i['data']['hero_image'])}")
    print(f"  with styles:        {sum(1 for i in items if i['data']['styles'])}")
    if failed:
        print(f"  FAILED: {len(failed)}")
        for u, e in failed[:10]:
            print("   ", u, e)


if __name__ == "__main__":
    import urllib.parse  # noqa: E402 — used inside parse()
    main()
