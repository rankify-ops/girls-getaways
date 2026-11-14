"""Bring The GG Diaries across from Squarespace: every post, as clean HTML.

Her blog is 51 posts, linked from the menu on every page and from years of
search results. The new site had none of it, so at cutover the menu link and
every one of those addresses would have been a 404.

Squarespace hands a collection over as JSON, twenty posts at a time. The body
is HTML wrapped in its own layout scaffolding (rows, columns, inline styles,
lazy-load placeholders), so it is not copied: it is walked, and only what an
article is made of survives - paragraphs, headings, lists, links, emphasis and
pictures. A post reads the same and carries none of the old site's markup.

Pictures still load from Squarespace's image CDN, the same as the package
photography. They move when the photo migration finishes; nothing here
depends on which host they are on.

Writes src/content/diaries.json. Run it again to pick up new posts:

    python -I scripts/capture_diaries.py
"""

import html
import json
import os
import re
import time
import urllib.request
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "src", "content", "diaries.json")
SITE = "https://www.girlsgetaways.com.au"
COLLECTION = "/the-gg-diaries"

KEEP = {"p", "h2", "h3", "h4", "ul", "ol", "li", "a", "strong", "em", "br", "blockquote", "img"}
RENAME = {"h1": "h2", "b": "strong", "i": "em"}
DROP_WITH_CONTENT = {"style", "script", "noscript", "svg", "button", "form", "iframe"}
VOID = {"br", "img"}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (site migration)"})
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.load(res)


class Clean(HTMLParser):
    """Keeps the article, drops the scaffolding."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.skip = 0
        self.images = []

    def handle_starttag(self, tag, attrs):
        if tag in DROP_WITH_CONTENT:
            self.skip += 1
            return
        if self.skip:
            return
        tag = RENAME.get(tag, tag)
        if tag not in KEEP:
            return
        a = dict(attrs)
        if tag == "a":
            href = (a.get("href") or "").strip()
            if not href or href.lower().startswith("javascript:"):
                self.out.append("<a>")
                return
            # Her own pages become relative, so they follow the site to its new home.
            href = re.sub(r"^https?://(www\.)?girlsgetaways\.com\.au", "", href) or "/"
            ext = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
            self.out.append('<a href="%s"%s>' % (html.escape(href, quote=True), ext))
        elif tag == "img":
            src = (a.get("data-src") or a.get("data-image") or a.get("src") or "").strip()
            if not src or src.startswith("data:"):
                return
            src = re.sub(r"^http://", "https://", src)
            alt = (a.get("alt") or "").strip()
            self.images.append(src)
            self.out.append('<img src="%s" alt="%s" loading="lazy">' % (html.escape(src, quote=True), html.escape(alt, quote=True)))
        else:
            self.out.append("<%s>" % tag)

    def handle_endtag(self, tag):
        if tag in DROP_WITH_CONTENT:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        tag = RENAME.get(tag, tag)
        if tag in KEEP and tag not in VOID:
            self.out.append("</%s>" % tag)

    def handle_data(self, data):
        if not self.skip:
            self.out.append(html.escape(data, quote=False))


def clean(body):
    p = Clean()
    p.feed(body or "")
    s = "".join(p.out)
    s = s.replace("\xa0", " ")
    s = re.sub(r"[ \t\r\n]+", " ", s)
    # Squarespace leaves spacer paragraphs and empty wrappers behind; an article does not need them.
    for _ in range(4):
        s = re.sub(r"<(p|h2|h3|h4|li|strong|em|a|blockquote|ul|ol)>\s*(<br>\s*)*</\1>", "", s)
    s = re.sub(r"\s*(</?(p|h2|h3|h4|ul|ol|li|blockquote)>)\s*", r"\1", s)
    s = re.sub(r"(</(p|h2|h3|h4|ul|ol|blockquote)>|<img [^>]*>)", r"\1\n", s)
    return s.strip(), p.images


def text_of(markup):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", markup or ""))).strip()


def main():
    posts, url, seen = [], SITE + COLLECTION + "?format=json", set()
    while url:
        page = get(url)
        for it in page.get("items", []):
            if it.get("urlId") in seen:
                continue
            seen.add(it.get("urlId"))
            body, images = clean(it.get("body"))
            words = len(text_of(body).split())
            excerpt = text_of(it.get("excerpt"))
            # Her excerpts are often just the title again. The opening of the article says more.
            if not excerpt or excerpt.lower() == (it.get("title") or "").strip().lower():
                first = re.search(r"<p>(.*?)</p>", body, re.S)
                excerpt = text_of(first.group(1)) if first else ""
            if len(excerpt) > 200:
                excerpt = excerpt[:197].rsplit(" ", 1)[0] + "…"
            posts.append({
                "slug": it["urlId"],
                "title": (it.get("title") or "").strip(),
                "published": time.strftime("%Y-%m-%d", time.gmtime((it.get("publishOn") or it.get("addedOn") or 0) / 1000)),
                "image": re.sub(r"^http://", "https://", it.get("assetUrl") or "") or (images[0] if images else None),
                "excerpt": excerpt,
                "tags": it.get("tags") or [],
                "categories": it.get("categories") or [],
                "words": words,
                "body": body,
            })
        nxt = (page.get("pagination") or {}).get("nextPageUrl") if (page.get("pagination") or {}).get("nextPage") else None
        url = (SITE + nxt + "&format=json") if nxt else None
        time.sleep(0.6)

    posts.sort(key=lambda p: p["published"], reverse=True)
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(posts, f, ensure_ascii=False, indent=1)
        f.write("\n")
    thin = [p["slug"] for p in posts if p["words"] < 80]
    print("%d posts, %d KB, %d pictures" % (len(posts), os.path.getsize(OUT) // 1024, sum(p["body"].count("<img ") for p in posts)))
    print("oldest %s, newest %s" % (posts[-1]["published"], posts[0]["published"]))
    if thin:
        print("under 80 words (check these by eye):", ", ".join(thin))


if __name__ == "__main__":
    main()
