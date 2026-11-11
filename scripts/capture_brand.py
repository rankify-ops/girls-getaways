"""
Capture the brand assets the content crawl deliberately skipped.

capture_media.py strips <header> and <footer> so site furniture isn't filed as
package photography — which is exactly where a logo and favicon live, so they
were missed. This is the inverse sweep: furniture only, plus the icons
declared in <link rel> and the logo URLs in Squarespace's own site config.

    python scripts/capture_brand.py
"""

import hashlib, html, json, os, re, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT = os.path.join(ROOT, "audit")
OUT = os.path.join(ROOT, "docs", "portal-handoff")
RAW = os.environ.get("GG_MEDIA_ROOT") or r"D:\RANKIFY-media\girls-getaways"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"
BRAND = os.path.join(RAW, "brand")

ASSET = re.compile(
    r"https?:(?://|\\?/\\?/)?(?:images\.squarespace-cdn\.com|static1\.squarespace\.com)/[^\s\"'<>\\)]+",
    re.I,
)
PROTOCOL_LESS = re.compile(r"//(?:images\.squarespace-cdn\.com|static1\.squarespace\.com)/[^\s\"'<>\\)]+", re.I)


def pages() -> list[str]:
    out = []
    for folder in ("pkg", "pages"):
        d = os.path.join(AUDIT, folder)
        if os.path.isdir(d):
            out += [os.path.join(d, f) for f in os.listdir(d) if f.endswith(".html")]
    home = os.path.join(AUDIT, "home.html")
    if os.path.exists(home):
        out.append(home)
    return out


def furniture(doc: str) -> str:
    """Header and footer only — the opposite of what the content crawl keeps."""
    parts = re.findall(r"<header\b.*?</header>", doc, flags=re.S | re.I)
    parts += re.findall(r"<footer\b.*?</footer>", doc, flags=re.S | re.I)
    parts += re.findall(r"<link[^>]*rel=\"[^\"]*icon[^\"]*\"[^>]*>", doc, flags=re.I)
    # Squarespace's own config, where the site logo and share image are declared.
    parts += re.findall(r"\"(?:logoImageUrl|socialLogoImageUrl|faviconUrl)\":\"[^\"]+\"", doc)
    return "\n".join(parts)


found: dict[str, set[str]] = {}
for f in pages():
    doc = open(f, encoding="utf-8", errors="ignore").read()
    chunk = furniture(doc)
    urls = set(ASSET.findall(chunk)) | {"https:" + u for u in PROTOCOL_LESS.findall(chunk)}
    for u in urls:
        clean = html.unescape(u.replace("\\/", "/")).split("?")[0]
        if not clean.startswith("http"):
            clean = "https:" + clean
        found.setdefault(clean, set()).add(os.path.basename(f))

print(f"{len(found)} furniture assets across {len(pages())} cached pages")

os.makedirs(BRAND, exist_ok=True)
manifest_path = os.path.join(RAW, "manifest.json")
manifest = json.load(open(manifest_path, encoding="utf-8"))

saved, skipped = 0, 0
for url, where in sorted(found.items()):
    name_src = urllib.parse.unquote(url.split("/")[-1])
    base = re.sub(r"[^A-Za-z0-9._-]", "-", name_src)[:80] or "asset"
    stamp = hashlib.sha1(url.encode()).hexdigest()[:8]
    name = f"{os.path.splitext(base)[0]}-{stamp}{os.path.splitext(base)[1].lower()}"
    path = os.path.join(BRAND, name)

    if url in manifest and os.path.exists(os.path.join(RAW, manifest[url]["path"])):
        skipped += 1
        continue
    body = None
    for variant in ("?format=original", "?format=2500w", ""):
        try:
            req = urllib.request.Request(url + variant, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read()
            break
        except Exception:
            continue
    if not body:
        print(f"  failed: {url[:90]}")
        continue
    open(path, "wb").write(body)
    manifest[url] = {
        "path": f"brand/{name}",
        "kind": "image",
        "chrome": True,
        "bytes": len(body),
        "uses": [{"page": "site header/footer", "type": "brand"}],
        "seen_on_pages": len(where),
    }
    saved += 1
    print(f"  saved {name}  ({len(body) / 1024:.0f} KB, on {len(where)} pages)")

json.dump(manifest, open(manifest_path, "w", encoding="utf-8"), indent=1)
json.dump(manifest, open(os.path.join(OUT, "media-manifest.json"), "w", encoding="utf-8"), indent=1)
print(f"\nsaved {saved}, already held {skipped}; manifest now {len(manifest)} assets")
