"""
Close out the Squarespace capture.

Three jobs the main crawl left behind:

1. Repair truncated URLs. A handful of candidates came out of the HTML cut
   short, so every variant 404s. The full URL is in the cached pages — match on
   the prefix, fetch, add to the manifest.
2. Destination banners and intro copy. Their 37 destination pages hold a
   banner image and a paragraph of copy that exists nowhere else; both fields
   sit empty in the portal today.
3. The redirect map. Their live URLs include 44 category and 64 tag archives
   that nothing else records. Every one 404s at cutover and costs her rankings
   unless it is redirected.

    python scripts/finish_capture.py
"""

import concurrent.futures as cf, hashlib, html, json, os, re, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT = os.path.join(ROOT, "audit")
OUT = os.path.join(ROOT, "docs", "portal-handoff")
RAW = os.environ.get("GG_MEDIA_ROOT") or r"D:\RANKIFY-media\girls-getaways"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"
SITE = "https://www.girlsgetaways.com.au"

manifest_path = os.path.join(RAW, "manifest.json")
manifest = json.load(open(manifest_path, encoding="utf-8"))
candidates = json.load(open(os.path.join(AUDIT, "media-candidates.json"), encoding="utf-8"))


def cached_html() -> list[str]:
    out = []
    for folder in ("pkg", "pages"):
        d = os.path.join(AUDIT, folder)
        if not os.path.isdir(d):
            continue
        for f in os.listdir(d):
            if f.endswith(".html"):
                out.append(os.path.join(d, f))
    return out


def text(s: str) -> str:
    s = re.sub(r"<(?:style|script)[^>]*>.*?</(?:style|script)>", " ", s, flags=re.S | re.I)
    out = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)))
    for _ in range(2):
        once = html.unescape(out)
        if once == out:
            break
        out = once
    return re.sub(r"\s+", " ", out.replace("\xa0", " ")).strip()


def fetch(url: str, path: str, binary: bool = False):
    if os.path.exists(path) and os.path.getsize(path) > 500:
        return open(path, "rb").read() if binary else open(path, encoding="utf-8", errors="ignore").read()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        body = r.read()
    if binary:
        open(path, "wb").write(body)
        return body
    txt = body.decode("utf-8", "ignore")
    open(path, "w", encoding="utf-8").write(txt)
    return txt


# ── 1. repair truncated URLs ────────────────────────────────────────────
missing = [c for c in candidates if c["url"] not in manifest]
print(f"1. repairing {len(missing)} assets the crawl couldn't fetch")

corpus = "\n".join(open(f, encoding="utf-8", errors="ignore").read() for f in cached_html())
FULL = re.compile(r"https://images\.squarespace-cdn\.com/[^\s\"'<>\\)]+")
all_urls = set(FULL.findall(corpus))

repaired = 0
for c in missing:
    longer = [u for u in all_urls if u.startswith(c["url"]) and len(u) > len(c["url"])]
    if not longer:
        print(f"   no longer form found: {c['url'][:80]}")
        continue
    real = html.unescape(sorted(longer, key=len)[0]).split("?")[0]
    base = re.sub(r"[^A-Za-z0-9._-]", "-", urllib.parse.unquote(real.split("/")[-1]))[:80]
    stamp = hashlib.sha1(real.encode()).hexdigest()[:8]
    name = f"{os.path.splitext(base)[0]}-{stamp}{os.path.splitext(base)[1].lower()}"
    folder = "gallery" if any(u["type"] == "package page" for u in c["uses"]) else "pages"
    os.makedirs(os.path.join(RAW, folder), exist_ok=True)
    try:
        body = fetch(real + "?format=original", os.path.join(RAW, folder, name), binary=True)
    except Exception:
        try:
            body = fetch(real + "?format=2500w", os.path.join(RAW, folder, name), binary=True)
        except Exception as e:  # noqa: BLE001
            print(f"   still failing: {real[:80]} — {str(e)[:50]}")
            continue
    manifest[real] = {"path": f"{folder}/{name}", "kind": "image", "chrome": False,
                      "bytes": len(body), "uses": c["uses"], "repaired_from": c["url"]}
    repaired += 1
print(f"   repaired {repaired}")

# ── 2. destination banners and intro copy ───────────────────────────────
dests = json.load(open(os.path.join(OUT, "destinations.json"), encoding="utf-8"))
print(f"\n2. reading {len(dests)} destination pages for banner + intro copy")
os.makedirs(os.path.join(AUDIT, "pages"), exist_ok=True)


def destination(d: dict) -> dict:
    slug = d["slug"]
    path = os.path.join(AUDIT, "pages", f"{slug}.html")
    try:
        page = fetch(f"{SITE}/{slug}", path)
    except Exception:
        return d  # several destinations have no page of their own
    body = re.sub(r"<header\b.*?</header>", " ", page, flags=re.S | re.I)
    body = re.sub(r"<footer\b.*?</footer>", " ", body, flags=re.S | re.I)

    og = re.findall(r'<meta property="og:image" content="([^"]+)"', page)
    desc = re.findall(r'<meta (?:property="og:description"|name="description") content="([^"]+)"', page)

    # The intro is the first substantial paragraph that isn't a package card.
    paras = [text(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", body, re.S)]
    intro = next((p for p in paras if len(p) > 80 and "$" not in p), None)

    d["data"]["image"] = og[0].split("?")[0] if og else None
    d["data"]["blurb"] = text(desc[0]) if desc else intro
    return d


with cf.ThreadPoolExecutor(max_workers=6) as ex:
    dests = list(ex.map(destination, dests))

with_img = sum(1 for d in dests if d["data"]["image"])
with_blurb = sum(1 for d in dests if d["data"]["blurb"])
json.dump(dests, open(os.path.join(OUT, "destinations.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"   banners found: {with_img}/{len(dests)} · intro copy: {with_blurb}/{len(dests)}")

# Pull the banners themselves into the archive.
new_banners = 0
for d in dests:
    url = d["data"]["image"]
    if not url or url in manifest:
        continue
    base = re.sub(r"[^A-Za-z0-9._-]", "-", urllib.parse.unquote(url.split("/")[-1]))[:80]
    name = f"{d['slug']}-{hashlib.sha1(url.encode()).hexdigest()[:8]}{os.path.splitext(base)[1].lower() or '.jpg'}"
    os.makedirs(os.path.join(RAW, "destinations"), exist_ok=True)
    try:
        body = fetch(url + "?format=original", os.path.join(RAW, "destinations", name), binary=True)
        manifest[url] = {"path": f"destinations/{name}", "kind": "image", "chrome": False,
                         "bytes": len(body), "uses": [{"page": f"/{d['slug']}", "type": "destination banner"}]}
        new_banners += 1
    except Exception:
        pass
print(f"   banners saved: {new_banners}")

json.dump(manifest, open(manifest_path, "w", encoding="utf-8"), indent=1)

# ── 3. redirect map ─────────────────────────────────────────────────────
urls = [u.strip() for u in open(os.path.join(AUDIT, "urls-new.txt"), encoding="utf-8") if u.strip()]


def classify(path: str) -> str:
    parts = [p for p in path.split("/") if p]
    if not parts:
        return "home"
    if parts[0] == "package-search":
        if len(parts) > 1 and parts[1] in ("category", "tag"):
            return f"package-{parts[1]}-archive"
        return "package" if len(parts) > 1 else "package-listing"
    if parts[0] == "the-gg-diaries":
        return "blog-post" if len(parts) > 1 else "blog-index"
    return "page"


redirects = []
for u in sorted(urls):
    p = urllib.parse.urlparse(u).path.rstrip("/") or "/"
    redirects.append({"from": p, "type": classify(p), "to": None})

json.dump(redirects, open(os.path.join(OUT, "redirects.json"), "w", encoding="utf-8"), indent=1)
counts: dict[str, int] = {}
for r in redirects:
    counts[r["type"]] = counts.get(r["type"], 0) + 1
print(f"\n3. redirect map: {len(redirects)} live URLs → docs/portal-handoff/redirects.json")
for k, v in sorted(counts.items(), key=lambda kv: -kv[1]):
    print(f"   {k:26} {v}")
print("\n   'to' is null everywhere: targets are a decision, not a scrape.")

total = sum(m["bytes"] for m in manifest.values())
print(f"\nmanifest: {len(manifest)} assets, {total / 1_048_576:.0f} MB")
