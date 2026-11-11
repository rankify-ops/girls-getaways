"""
Find and save every Girls Getaways asset that exists only on Squarespace.

Their Squarespace account cannot be cancelled until this is complete, so the
job is to leave nothing behind: package galleries, destination banners, brand
assets, page imagery, linked PDFs.

Two phases, because the size matters before the download does:

    python scripts/capture_media.py discover   # crawl, list, size — no files saved
    python scripts/capture_media.py download   # fetch originals + write the manifest

Discovery writes audit/media-candidates.json (url → where it is used, bytes).
Download writes assets-raw/<kind>/<name> plus assets-raw/manifest.json, which
maps original URL → local path → every place it is used. Without the manifest
the files are an archive nobody can rewire, and rewiring is the whole point.

Originals, never the rendered size: a Squarespace CDN URL serves whatever
variant the page asked for, so a 600px thumbnail saved today is a 600px
thumbnail for ever. ?format=original first, ?format=2500w as fallback.
"""

import argparse, concurrent.futures as cf, hashlib, html, json, os, re, sys, time
import urllib.parse, urllib.request
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT = os.path.join(ROOT, "audit")
PAGES = os.path.join(AUDIT, "pages")          # cached non-package HTML
PKG = os.path.join(AUDIT, "pkg")              # cached package HTML (already there)
# The capture runs to ~900 MB and C: is nearly full, so it lives on D: with the
# repo holding only the manifest. Override with GG_MEDIA_ROOT if it moves again.
RAW = os.environ.get("GG_MEDIA_ROOT") or r"D:\RANKIFY-media\girls-getaways"
CANDIDATES = os.path.join(AUDIT, "media-candidates.json")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"

SITE = "https://www.girlsgetaways.com.au"

# Squarespace serves images from these, and uploaded files (PDFs) from static1.
ASSET = re.compile(
    r"https?://(?:images\.squarespace-cdn\.com|static1\.squarespace\.com)/[^\s\"'<>\\)]+",
    re.I,
)
IMG_EXT = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")
DOC_EXT = (".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip")


def get(url: str, path: str, binary: bool = False):
    """Fetch with a small retry, caching to disk."""
    if os.path.exists(path) and os.path.getsize(path) > 500:
        return open(path, "rb").read() if binary else open(path, encoding="utf-8", errors="ignore").read()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                body = r.read()
            if binary:
                open(path, "wb").write(body)
                return body
            txt = body.decode("utf-8", "ignore")
            open(path, "w", encoding="utf-8").write(txt)
            return txt
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1.5 * (attempt + 1))


def page_type(path: str) -> str:
    parts = [p for p in path.split("/") if p]
    if not parts:
        return "home"
    if parts[0] == "package-search":
        if len(parts) > 1 and parts[1] in ("category", "tag"):
            return f"package {parts[1]} archive"
        return "package page" if len(parts) > 1 else "package listing"
    if parts[0] == "the-gg-diaries":
        return "blog post" if len(parts) > 1 else "blog index"
    return "page"


def strip_chrome(doc: str) -> str:
    """Drop header and footer so site furniture isn't mistaken for content."""
    doc = re.sub(r"<header\b.*?</header>", " ", doc, flags=re.S | re.I)
    doc = re.sub(r"<footer\b.*?</footer>", " ", doc, flags=re.S | re.I)
    doc = re.sub(r"<(?:style|script)[^>]*>.*?</(?:style|script)>", " ", doc, flags=re.S | re.I)
    return doc


def clean_url(u: str) -> str:
    u = html.unescape(u).rstrip(").,'\"")
    return u.split("?")[0]


def kind_of(u: str) -> str:
    low = u.lower()
    if low.endswith(DOC_EXT):
        return "document"
    if low.endswith(IMG_EXT):
        return "image"
    return "other"


def discover() -> None:
    os.makedirs(PAGES, exist_ok=True)
    urls = [u.strip() for u in open(os.path.join(AUDIT, "urls-new.txt"), encoding="utf-8") if u.strip()]

    # Every destination page too — they hold the banners and intro copy, and
    # several aren't in the sitemap.
    dests = json.load(open(os.path.join(ROOT, "docs", "portal-handoff", "destinations.json"), encoding="utf-8"))
    urls += [f"{SITE}/{d['slug']}" for d in dests]
    urls = list(dict.fromkeys(urls))
    print(f"{len(urls)} pages to read")

    uses: dict[str, list[dict]] = defaultdict(list)
    failed: list[tuple[str, str]] = []

    def read(u: str):
        path_part = urllib.parse.urlparse(u).path.rstrip("/")
        slug = (path_part.strip("/").replace("/", "__") or "home")
        cached = os.path.join(PKG, f"{path_part.split('/')[-1]}.html")
        local = cached if os.path.exists(cached) and "/package-search/" in u else os.path.join(PAGES, f"{slug}.html")
        try:
            doc = get(u, local)
        except Exception as e:  # noqa: BLE001
            failed.append((u, str(e)[:70]))
            return
        body = strip_chrome(doc)
        seen: set[str] = set()
        for m in ASSET.finditer(body):
            full = clean_url(m.group(0))
            if full in seen or kind_of(full) == "other":
                continue
            seen.add(full)
            uses[full].append({"page": path_part or "/", "type": page_type(path_part)})

    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        for i, _ in enumerate(ex.map(read, urls), 1):
            if i % 60 == 0:
                print(f"  read {i}/{len(urls)}")

    # Anything on most pages is site furniture (logo, favicon) — still wanted,
    # but labelled so it isn't filed as package photography.
    total_pages = len(urls)
    out = []
    for url, where in uses.items():
        pages = {w["page"] for w in where}
        out.append({
            "url": url,
            "kind": kind_of(url),
            "chrome": len(pages) > total_pages * 0.4,
            "uses": where[:40],
            "use_count": len(where),
        })

    json.dump(out, open(CANDIDATES, "w", encoding="utf-8"), indent=1)
    by_kind = defaultdict(int)
    for c in out:
        by_kind[("chrome " if c["chrome"] else "") + c["kind"]] += 1
    print(f"\n{len(out)} unique assets")
    for k, n in sorted(by_kind.items(), key=lambda kv: -kv[1]):
        print(f"  {k:18} {n}")
    if failed:
        print(f"  pages failed: {len(failed)} — {failed[:3]}")
    print("\nNow run: python scripts/capture_media.py size")


def size() -> None:
    """HEAD every candidate so the storage decision has a real number."""
    cands = json.load(open(CANDIDATES, encoding="utf-8"))
    print(f"sizing {len(cands)} assets")

    def head(c: dict) -> int:
        url = c["url"] + ("?format=original" if c["kind"] == "image" else "")
        req = urllib.request.Request(url, headers={"User-Agent": UA}, method="HEAD")
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                return int(r.headers.get("content-length") or 0)
        except Exception:
            return 0

    with cf.ThreadPoolExecutor(max_workers=10) as ex:
        sizes = list(ex.map(head, cands))
    for c, s in zip(cands, sizes):
        c["bytes"] = s
    json.dump(cands, open(CANDIDATES, "w", encoding="utf-8"), indent=1)

    total = sum(sizes)
    unknown = sum(1 for s in sizes if not s)
    print(f"  total: {total / 1_048_576:.0f} MB across {len(cands)} assets")
    print(f"  unknown size (HEAD refused): {unknown}")
    for label, pred in (
        ("package photography", lambda c: any(u["type"] == "package page" for u in c["uses"]) and not c["chrome"]),
        ("blog imagery", lambda c: any(u["type"] == "blog post" for u in c["uses"]) and not c["chrome"]),
        ("other pages", lambda c: any(u["type"] in ("page", "home") for u in c["uses"]) and not c["chrome"]),
        ("site furniture", lambda c: c["chrome"]),
        ("documents", lambda c: c["kind"] == "document"),
    ):
        sel = [c for c in cands if pred(c)]
        print(f"  {label:20} {len(sel):4}  {sum(c['bytes'] for c in sel) / 1_048_576:7.0f} MB")


def download(limit_kinds: list[str] | None = None) -> None:
    cands = json.load(open(CANDIDATES, encoding="utf-8"))
    manifest_path = os.path.join(RAW, "manifest.json")
    manifest = json.load(open(manifest_path, encoding="utf-8")) if os.path.exists(manifest_path) else {}

    def folder(c: dict) -> str:
        if c["kind"] == "document":
            return "documents"
        if c["chrome"]:
            return "brand"
        types = {u["type"] for u in c["uses"]}
        if "package page" in types:
            return "gallery"
        if "blog post" in types:
            return "blog"
        return "pages"

    jobs = [c for c in cands if not limit_kinds or folder(c) in limit_kinds]
    print(f"downloading {len(jobs)} assets")
    failed: list[tuple[str, str]] = []

    def grab(c: dict) -> int:
        f = folder(c)
        out_dir = os.path.join(RAW, f)
        os.makedirs(out_dir, exist_ok=True)
        base = urllib.parse.unquote(c["url"].split("/")[-1])
        base = re.sub(r"[^A-Za-z0-9._-]", "-", base)[:80] or "asset"
        # Squarespace filenames repeat across folders; the URL hash keeps them apart.
        stamp = hashlib.sha1(c["url"].encode()).hexdigest()[:8]
        name = f"{os.path.splitext(base)[0]}-{stamp}{os.path.splitext(base)[1].lower()}"
        path = os.path.join(out_dir, name)
        try:
            for variant in ("?format=original", "?format=2500w", ""):
                try:
                    body = get(c["url"] + variant, path, binary=True)
                    break
                except Exception:
                    continue
            else:
                raise RuntimeError("all variants refused")
            manifest[c["url"]] = {
                "path": f"{f}/{name}",
                "kind": c["kind"],
                "chrome": c["chrome"],
                "bytes": len(body),
                "uses": c["uses"],
            }
            return len(body)
        except Exception as e:  # noqa: BLE001
            failed.append((c["url"], str(e)[:70]))
            return 0

    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        sizes = list(ex.map(grab, jobs))

    os.makedirs(RAW, exist_ok=True)
    json.dump(manifest, open(manifest_path, "w", encoding="utf-8"), indent=1)
    got = [s for s in sizes if s]
    print(f"  saved {len(got)}/{len(jobs)} — {sum(got) / 1_048_576:.0f} MB")
    print(f"  manifest: {len(manifest)} entries at assets-raw/manifest.json")
    if failed:
        print(f"  failed: {len(failed)}")
        for u, e in failed[:8]:
            print("   ", u[:90], e)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("phase", choices=["discover", "size", "download"])
    ap.add_argument("--only", nargs="*", help="folders to fetch: gallery pages brand blog documents")
    a = ap.parse_args()
    {"discover": discover, "size": size, "download": lambda: download(a.only)}[a.phase]()
