"""Bring her standing pages across from Squarespace, word for word.

The menu and footer of the new site link to seven pages it did not have:
contact, the team, gift cards, booking terms, how it works, the FAQs and
Couples Getaways. Each was an absolute link to the live domain, which works
only while that domain is still Squarespace. The day DNS moves they are 404s,
on every page of the site.

These are her words and, for the booking terms, her contract with her
customers, so nothing here is retyped. The page is fetched, the Squarespace
layout scaffolding is walked away (see capture_diaries.py for how), and what is
left is the copy: headings, paragraphs, lists, links, pictures.

Writes src/content/pages.json. Run it again if she edits a page before cutover:

    python -I scripts/capture_pages.py
"""

import html
import json
import os
import re
import sys
import urllib.request
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "src", "content", "pages.json")
SITE = "https://www.girlsgetaways.com.au"

BLOCK = {"p", "h2", "h3", "h4", "li", "blockquote"}
KEEP = BLOCK | {"ul", "ol", "a", "strong", "em", "br", "img"}
RENAME = {"h1": "h2", "b": "strong", "i": "em"}
DROP_WITH_CONTENT = {"style", "script", "noscript", "svg", "button", "form", "iframe", "header", "footer", "nav"}
VOID = {"br", "img"}

# slug -> what to leave out. Each rule names the text it keys on, so a change
# to her page shows up as a rule that no longer matches rather than as silence.
PAGES = {
    "contact-us": {},
    "gg-team": {"cut_at": ["THE LATEST FROM THE GG DIARIES"]},
    "gift-cards": {},
    # The page's own heading is drawn by the site; the copy starts at its first sentence.
    "booking-terms-and-conditions": {"start_at": "Girls Getaways is a travel service offered by"},
    # The booking process is on the page twice, once laid out for desktop with
    # arrows between the steps and once for phones. One is enough.
    "how-it-works": {"cut_at": ["LOVELY WORDS"], "drop_headings": ["⟶", "⟵"]},
    "frequently-asked-questions": {"start_at": "BEFORE YOU BOOK"},
    "couples-getaways": {},
}


def fetch(path):
    req = urllib.request.Request(SITE + path, headers={"User-Agent": "Mozilla/5.0 (site migration)"})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read().decode("utf-8", "replace")


class Clean(HTMLParser):
    """Keeps the copy, drops the scaffolding. Text counts only inside a real block."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.skip = 0
        self.depth = 0  # open block elements
        self.solo = False  # a link standing on its own: a button

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
        if tag in BLOCK:
            self.depth += 1
            self.out.append("<%s>" % tag)
        elif tag == "a":
            href = (a.get("href") or "").strip()
            if not href or href.lower().startswith("javascript:") or href.startswith("#"):
                return
            href = re.sub(r"^https?://(www\.)?girlsgetaways\.com\.au", "", href) or "/"
            ext = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
            if self.depth == 0:
                self.solo = True
                self.out.append('<p class="cta">')
            self.out.append('<a href="%s"%s>' % (html.escape(href, quote=True), ext))
        elif tag == "img":
            src = (a.get("data-src") or a.get("data-image") or a.get("src") or "").strip()
            if not src or src.startswith("data:"):
                return
            alt = (a.get("alt") or "").strip()
            # A file name is not a description. Better none than "IMG_2914.jpg".
            if re.search(r"\.(jpe?g|png|webp)$", alt, re.I):
                alt = ""
            self.out.append('<img src="%s" alt="%s" loading="lazy">' % (html.escape(re.sub(r"^http://", "https://", src), quote=True), html.escape(alt, quote=True)))
        else:
            self.out.append("<%s>" % tag)

    def handle_endtag(self, tag):
        if tag in DROP_WITH_CONTENT:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        tag = RENAME.get(tag, tag)
        if tag in BLOCK:
            self.depth = max(0, self.depth - 1)
            self.out.append("</%s>" % tag)
        elif tag == "a":
            self.out.append("</a>")
            if self.solo:
                self.solo = False
                self.out.append("</p>")
        elif tag in KEEP and tag not in VOID:
            self.out.append("</%s>" % tag)

    def handle_data(self, data):
        if self.skip or not (self.depth or self.solo):
            return
        self.out.append(html.escape(data, quote=False))


def text_of(markup):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", markup or ""))).strip()


def tidy(s):
    s = s.replace("\xa0", " ")
    s = re.sub(r"[ \t\r\n]+", " ", s)
    # A link opened without an href never opened at all; its close is left over.
    s = re.sub(r"</a>(?![^<]*</a>)", lambda m: m.group(0), s)
    for _ in range(5):
        s = re.sub(r"<(p|h2|h3|h4|li|strong|em|blockquote|ul|ol)>\s*(<br>\s*)*</\1>", "", s)
        s = re.sub(r'<p class="cta">\s*(<a [^>]*>\s*</a>)?\s*</p>', "", s)
        s = re.sub(r"<a [^>]*>\s*</a>", "", s)
    s = re.sub(r"\s*(</?(p|h2|h3|h4|ul|ol|li|blockquote)( class=\"cta\")?>)\s*", r"\1", s)
    s = re.sub(r"(</(p|h2|h3|h4|ul|ol|blockquote)>|<img [^>]*>)", r"\1\n", s)
    return s.strip()


def capture(slug, rules):
    page = fetch("/" + slug)
    main = re.search(r"<main[^>]*>(.*?)</main>", page, re.S | re.I)
    p = Clean()
    p.feed(main.group(1) if main else page)
    body = tidy("".join(p.out))

    blocks = [b for b in body.split("\n") if b.strip()]

    start = rules.get("start_at")
    if start:
        at = next((i for i, b in enumerate(blocks) if start.lower() in text_of(b).lower()), None)
        if at is None:
            print("  ! %s: '%s' is no longer on the page" % (slug, start))
        else:
            blocks = blocks[at:]

    for marker in rules.get("cut_at", []):
        at = next((i for i, b in enumerate(blocks) if marker.lower() in text_of(b).lower()), None)
        if at is None:
            print("  ! %s: '%s' is no longer on the page" % (slug, marker))
        else:
            blocks = blocks[:at]
    drop = rules.get("drop_headings", [])
    blocks = [b for b in blocks if text_of(b) not in drop]

    # The same block twice in a row is the desktop and phone copies of one thing.
    seen, out = set(), []
    for b in blocks:
        key = text_of(b).lower()
        if len(key) > 60 and key in seen:
            continue
        seen.add(key)
        out.append(b)
    blocks = out

    # The page's own heading, and the line under it when it reads as an introduction.
    title = intro = ""
    if blocks and blocks[0].startswith("<h2>"):
        title = text_of(blocks.pop(0))
        if blocks and blocks[0].startswith("<h2>") and len(text_of(blocks[0])) > 60:
            intro = text_of(blocks.pop(0))

    meta = re.search(r'<meta name="description" content="([^"]*)"', page)
    return {
        "slug": slug,
        "title": title,
        "intro": intro,
        "description": html.unescape(meta.group(1)).strip() if meta and meta.group(1).strip() else "",
        "words": len(text_of(" ".join(blocks)).split()),
        "body": "\n".join(blocks),
    }


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    pages = []
    for slug, rules in PAGES.items():
        page = capture(slug, rules)
        pages.append(page)
        print("%-30s %5d words  %-28s %s" % (slug, page["words"], page["title"][:28], ("intro: " + page["intro"][:50]) if page["intro"] else ""))
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(pages, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("wrote %d pages, %d KB" % (len(pages), os.path.getsize(OUT) // 1024))


if __name__ == "__main__":
    main()
