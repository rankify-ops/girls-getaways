/*
 * A post, as she writes it in the portal, turned into a page.
 *
 * Her blog is edited in a plain text box, so a post is stored as plain writing
 * with the handful of marks people already use in a box:
 *
 *   a blank line          a new paragraph
 *   ## Heading            a heading (### for a smaller one)
 *   - item                a list (1. for a numbered one)
 *   > words               a quote
 *   **bold**  *italic*
 *   [words](address)      a link
 *   ![what it shows](address)             a picture, on a line of its own
 *   [![what it shows](picture)](address)  a picture that is a link
 *
 * That is the whole language, on purpose. Anything else she types is shown as
 * she typed it.
 *
 * It is also the only thing standing between a text box and the page, so it is
 * built the safe way round: every character is escaped first, and markup is
 * only ever produced here, from a fixed list of tags. Nothing typed into the
 * box can become a tag, a script or an attribute. Addresses are checked too: a
 * link may go to this site, a web address, an email or a phone number, and a
 * picture must come over https. Anything else is left as words.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Her old site's own domain, and the working address Squarespace gave it, are this site. */
const ours = (href: string) =>
  href.replace(/^https?:\/\/(www\.)?girlsgetaways\.com\.au(?=\/|$)/i, "").replace(/^https?:\/\/[a-z0-9-]+\.squarespace\.com(?=\/)/i, "") || "/";

/** An address a link may go to, tidied, or null. Takes the raw (unescaped) address. */
export function safeHref(raw: string): string | null {
  const href = ours(raw.trim());
  if (/^(\/(?!\/)|#)/.test(href)) return href;
  if (/^https?:\/\/[^\s]+$/i.test(href)) return href;
  if (/^(mailto:[^\s@]+@[^\s@]+|tel:\+?[\d\s()-]+)$/i.test(href)) return href;
  return null;
}

/** A picture's address: over https, or from this site. */
export function safeSrc(raw: string): string | null {
  const src = raw.trim();
  return /^https:\/\/[^\s]+$/i.test(src) || /^\/(?!\/)[^\s]*$/.test(src) ? src : null;
}

const img = (alt: string, src: string) => {
  const ok = safeSrc(src);
  return ok ? `<img src="${esc(ok)}" alt="${esc(alt)}" loading="lazy">` : esc(alt);
};

const anchor = (href: string, inner: string) => {
  const ok = safeHref(href);
  if (!ok) return inner;
  const out = /^https?:/i.test(ok) ? ' target="_blank" rel="noopener"' : "";
  return `<a href="${esc(ok)}"${out}>${inner}</a>`;
};

/** Marks inside a line: pictures, links, bold, italic. Works on the raw text and escapes as it goes. */
function inline(text: string): string {
  let out = "";
  let rest = text;
  // A picture that is a link, a picture, or a link, whichever comes first.
  const next = /\[!\[([^\]\n]*)\]\(([^)\s]+)\)\]\(([^)\s]+)\)|!\[([^\]\n]*)\]\(([^)\s]+)\)|\[([^\]\n]+)\]\(([^)\s]+)\)/;
  for (let m = next.exec(rest); m; m = next.exec(rest)) {
    out += emphasis(rest.slice(0, m.index));
    if (m[2] !== undefined) out += anchor(m[3], img(m[1], m[2]));
    else if (m[5] !== undefined) out += img(m[4], m[5]);
    else out += anchor(m[7], emphasis(m[6]));
    rest = rest.slice(m.index + m[0].length);
  }
  return out + emphasis(rest);
}

function emphasis(text: string): string {
  return esc(text)
    .replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
}

/** Plain writing → the page's markup. */
export function renderMarkdown(source: string): string {
  const blocks = (source ?? "").replace(/\r\n?/g, "\n").split(/\n\s*\n/);
  const out: string[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

    const heading = /^(#{1,4})\s+(.+)$/.exec(block);
    if (heading && lines.length === 1) {
      // One # is still a heading inside the article, never a second page title.
      const level = Math.min(4, Math.max(2, heading[1].length));
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      out.push(`<ul>${lines.map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`);
      continue;
    }
    if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
      out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`);
      continue;
    }
    if (lines.every((l) => /^>\s?/.test(l))) {
      out.push(`<blockquote>${lines.map((l) => inline(l.replace(/^>\s?/, ""))).join("<br>")}</blockquote>`);
      continue;
    }
    // A picture, or a linked picture, standing alone is not wrapped in a paragraph.
    if (lines.length === 1 && /^(\[!\[[^\]\n]*\]\([^)\s]+\)\]\([^)\s]+\)|!\[[^\]\n]*\]\([^)\s]+\))$/.test(block)) {
      out.push(inline(block));
      continue;
    }
    out.push(`<p>${lines.map(inline).join("<br>")}</p>`);
  }
  return out.join("\n");
}

/** The words alone, for a count or a summary. */
export const plainText = (source: string) =>
  (source ?? "")
    .replace(/\[?!\[[^\]]*\]\([^)]*\)(\]\([^)]*\))?/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^(#{1,4}|[-*]|\d+[.)]|>)\s+/gm, "")
    .replace(/\*+/g, "")
    .replace(/\s+/g, " ")
    .trim();
