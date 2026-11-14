"""Turn the captured blog into what the portal holds: one item per post.

Two things change on the way, and both are for the person who will edit these.

1. The body becomes plain writing, not markup. The portal edits a post in a
   text box, and a box full of <p> and <img src=…> is not something a client
   can be asked to maintain. So a post is stored the way people already write
   in a box: a blank line between paragraphs, "## " in front of a heading,
   "- " in front of a list item, **bold**, [a link](address), and a picture on
   a line of its own as ![what it shows](address). The site turns that back
   into a page (src/lib/markdown.ts).

2. Every picture points at her own library. docs/portal-handoff/image-map.json
   says where each Squarespace picture went (rankify-editor's
   scripts/import-url-images.mjs wrote it). A picture with no entry there is
   reported, and the build stops: a post must not go into the portal still
   leaning on the old host.

Reads  docs/portal-handoff/diaries-captured.json  (scripts/capture_diaries.py)
Writes docs/portal-handoff/diaries.json            the rows, for the import and as the site's fallback
       docs/portal-handoff/diaries-schema.json     the collection's fields

    python -I scripts/build_diary_rows.py
"""

import html
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
HANDOFF = os.path.join(os.path.dirname(HERE), "docs", "portal-handoff")

SCHEMA = [
    {"key": "title", "label": "Title", "type": "text", "required": True, "maxLength": 160},
    {"key": "published", "label": "Date published", "type": "text", "required": True, "maxLength": 10,
     "help": "Year-month-day, like 2026-09-29. Posts are listed newest first."},
    {"key": "image", "label": "Main picture", "type": "image",
     "help": "Shown at the top of the list of posts and when the post is shared."},
    {"key": "excerpt", "label": "One or two lines about it", "type": "textarea", "maxLength": 300,
     "help": "Shown under the title in the list of posts, and in Google."},
    {"key": "body", "label": "The post", "type": "richtext", "maxLength": 40000,
     "help": "Leave a blank line between paragraphs. Start a line with ## for a heading, or - for a list. "
             "**Two stars** make bold, and [words](https://address) make a link."},
    {"key": "tags", "label": "Tags", "type": "tags"},
]

# Marks a picture while the rest of a block is still being read. A character
# that cannot appear in her writing, so it can never be confused with it.
MARK = chr(1)
PICTURE = re.compile(MARK + r"(!\[[^\]]*\]\([^)]+\))" + MARK)
NEWLINE = chr(10)
BREAK = NEWLINE + NEWLINE


def inline(s, images):
    """One block's inner markup → the same thing as plain writing."""
    s = re.sub(r"<br>\s*", NEWLINE, s)
    s = re.sub(r"<strong>\s*(.*?)\s*</strong>", lambda m: "**%s**" % m.group(1) if m.group(1) else "", s, flags=re.S)
    s = re.sub(r"<em>\s*(.*?)\s*</em>", lambda m: "*%s*" % m.group(1) if m.group(1) else "", s, flags=re.S)

    # Pictures first. Many of hers are wrapped in a link to the package they show, and
    # reading the link first would find no words inside it and throw the picture away.
    def picture(m):
        src, alt = html.unescape(m.group(1)), html.unescape(m.group(2)).replace("]", "").strip()
        images.append(src)
        return "%s![%s](%s)%s" % (MARK, alt, src, MARK)

    s = re.sub(r'<img src="([^"]*)" alt="([^"]*)"[^>]*>', picture, s)

    def link(m):
        href, inner = html.unescape(m.group(1)), m.group(2)
        pic = PICTURE.search(inner)
        if pic:
            # A picture that is itself the link: [![what it shows](picture)](where it goes)
            return "%s[%s](%s)%s" % (BREAK, pic.group(1), href, BREAK)
        text = re.sub(r"<[^>]+>", "", inner).strip()
        return "[%s](%s)" % (text, href) if text else ""

    s = re.sub(r'<a href="([^"]*)"[^>]*>(.*?)</a>', link, s, flags=re.S)
    s = re.sub(r"</?a[^>]*>", "", s)
    # A picture on its own stands on its own line.
    s = PICTURE.sub(lambda m: BREAK + m.group(1) + BREAK, s)
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s)


def one_line(s):
    """A heading or a list item is one line; a picture inside it still gets its own."""
    parts = [" ".join(p.split()) for p in s.split(BREAK)]
    return BREAK.join(p for p in parts if p)


def to_writing(body):
    images, out = [], []

    # Lists first, so their items are not mistaken for paragraphs.
    def listed(m):
        mark = "1." if m.group(1) == "ol" else "-"
        lines = []
        for item in re.findall(r"<li>(.*?)</li>", m.group(2), flags=re.S):
            text = one_line(inline(item, images))
            if text:
                lines.append("%s %s" % (mark, text))
        return BREAK + NEWLINE.join(lines) + BREAK

    body = re.sub(r"<(ul|ol)>(.*?)</\1>", listed, body, flags=re.S)
    for tag, mark in (("h2", "## "), ("h3", "### "), ("h4", "#### ")):
        body = re.sub(
            r"<%s>(.*?)</%s>" % (tag, tag),
            lambda m, k=mark: BREAK + k + one_line(inline(m.group(1), images)) + BREAK,
            body,
            flags=re.S,
        )
    body = re.sub(r"<blockquote>(.*?)</blockquote>", lambda m: BREAK + "> " + one_line(inline(m.group(1), images)) + BREAK, body, flags=re.S)
    body = re.sub(r"<p[^>]*>(.*?)</p>", lambda m: BREAK + inline(m.group(1), images).strip() + BREAK, body, flags=re.S)
    body = inline(body, images)  # pictures and anything left standing on its own
    for block in re.split(r"\n\s*\n", body):
        block = NEWLINE.join(line.strip() for line in block.strip().split(NEWLINE) if line.strip())
        if block:
            out.append(block)
    return BREAK.join(out), images


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    captured = json.load(open(os.path.join(HANDOFF, "diaries-captured.json"), encoding="utf-8"))
    moved = json.load(open(os.path.join(HANDOFF, "image-map.json"), encoding="utf-8"))

    rows, missing = [], []
    for i, post in enumerate(captured):
        body, images = to_writing(post["body"])
        hero = post.get("image")
        # Her posts open with the same picture that is the post's main one. Shown once, at the top.
        first = re.match(r"!\[[^\]]*\]\(([^)]+)\)\n\n", body)
        if first and hero and first.group(1) == hero:
            body = body[first.end():]
        for src in set(images + ([hero] if hero else [])):
            if src not in moved:
                missing.append("%s: %s" % (post["slug"], src))
            body = body.replace("(%s)" % src, "(%s)" % moved.get(src, src))
        # One of her posts links to a package by the working address Squarespace gave the
        # site while it was being built. That address goes when the account does; the
        # page it points at is this site's.
        body = re.sub(r"\(https?://[a-z0-9-]+\.squarespace\.com(?=/)", "(", body)
        rows.append({
            "slug": post["slug"],
            "status": "published",
            "position": i,
            "data": {
                "title": post["title"],
                "published": post["published"],
                "image": moved.get(hero) if hero else None,
                "excerpt": post["excerpt"],
                "body": body,
                "tags": post.get("tags") or [],
            },
        })

    if missing:
        print("%d picture(s) are not in the portal's library yet:" % len(missing))
        for m in missing[:20]:
            print("  " + m)
        raise SystemExit(1)

    for name, value in (("diaries.json", rows), ("diaries-schema.json", SCHEMA)):
        with open(os.path.join(HANDOFF, name), "w", encoding="utf-8", newline="\n") as f:
            json.dump(value, f, ensure_ascii=False, indent=2)
            f.write("\n")

    old = sum(r["data"]["body"].count("squarespace") for r in rows)
    print("%d posts, %d pictures in the body, longest post %d characters" % (len(rows), sum(r["data"]["body"].count("![") for r in rows), max(len(r["data"]["body"]) for r in rows)))
    print("still pointing at the old host: %d" % old)


if __name__ == "__main__":
    main()
