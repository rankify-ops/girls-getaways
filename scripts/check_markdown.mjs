// The renderer is the only thing between a text box and the page. Does it hold?
//
//   node --experimental-strip-types scripts/check_markdown.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { plainText, renderMarkdown, safeHref, safeSrc } from "../src/lib/markdown.ts";

const eq = (src, html) => assert.equal(renderMarkdown(src), html);

// What it is for.
eq("Hello\n\nthere", "<p>Hello</p>\n<p>there</p>");
eq("## A heading", "<h2>A heading</h2>");
eq("# Top", "<h2>Top</h2>"); // never a second page title
eq("- one\n- two", "<ul><li>one</li><li>two</li></ul>");
eq("1. one\n2. two", "<ol><li>one</li><li>two</li></ol>");
eq("> said", "<blockquote>said</blockquote>");
eq("It is **bold** and *soft*.", "<p>It is <strong>bold</strong> and <em>soft</em>.</p>");
eq("line one\nline two", "<p>line one<br>line two</p>");
eq("See [the packages](/package-search/).", '<p>See <a href="/package-search/">the packages</a>.</p>');
eq("[out](https://example.com/a)", '<p><a href="https://example.com/a" target="_blank" rel="noopener">out</a></p>');
eq("![A pool](https://app.rankify.com.au/api/public/media/x)", '<img src="https://app.rankify.com.au/api/public/media/x" alt="A pool" loading="lazy">');
eq(
  "[![](https://app.rankify.com.au/api/public/media/x)](https://www.girlsgetaways.com.au/package-search/a/b)",
  '<a href="/package-search/a/b"><img src="https://app.rankify.com.au/api/public/media/x" alt="" loading="lazy"></a>',
);
// Her old site's working address is this site too.
assert.equal(safeHref("https://fennel-sailfish-2reh.squarespace.com/package-search/x/y"), "/package-search/x/y");

// What it must never do.
eq("<script>alert(1)</script>", "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
eq('<img src=x onerror="alert(1)">', "<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>");
eq("[click](javascript:alert(1))", "<p>click)</p>".replace("click)", "click)")); // the address is refused; the words stay
eq("[x](data:text/html,hi)", "<p>x</p>");
eq('[x](https://a.com/"onmouseover="alert(1))', '<p><a href="https://a.com/&quot;onmouseover=&quot;alert(1" target="_blank" rel="noopener">x</a>)</p>');
eq("![x](javascript:alert(1))", "<p>x)</p>");
eq("![x](http://insecure.example/a.jpg)", "x");
eq('![a" onerror="alert(1)](https://ok.example/a.jpg)', '<img src="https://ok.example/a.jpg" alt="a&quot; onerror=&quot;alert(1)" loading="lazy">');
assert.equal(safeHref("//evil.example"), null);
assert.equal(safeHref(" JAVASCRIPT:alert(1)"), null);
assert.equal(safeSrc("//evil.example/a.jpg"), null);
for (const html of [renderMarkdown("<b onclick=x>hi</b>"), renderMarkdown("## <svg/onload=alert(1)>"), renderMarkdown("- <iframe src=x>")]) {
  assert.ok(!/<(script|svg|iframe|b )/i.test(html), html);
}

// Every post she has: nothing of hers is lost, and nothing unexpected comes out.
const rows = JSON.parse(readFileSync(new URL("../docs/portal-handoff/diaries.json", import.meta.url), "utf8"));
const allowed = /^<\/?(p|h2|h3|h4|ul|ol|li|blockquote|strong|em|br|a|img)(\s[^>]*)?>$/;
let pictures = 0;
for (const r of rows) {
  const html = renderMarkdown(r.data.body);
  for (const tag of html.match(/<[^>]+>/g) ?? []) assert.ok(allowed.test(tag), `${r.slug}: unexpected tag ${tag}`);
  const want = (r.data.body.match(/!\[/g) ?? []).length;
  const got = (html.match(/<img /g) ?? []).length;
  assert.equal(got, want, `${r.slug}: ${want} pictures written, ${got} drawn`);
  pictures += got;
  assert.ok(!/squarespace/i.test(html), `${r.slug} still points at the old host`);
  assert.ok(!/\]\(|\*\*|^#{1,4} /m.test(html.replace(/<[^>]+>/g, "")), `${r.slug}: a mark was left showing as text`);
  assert.ok(plainText(r.data.body).split(" ").length > 300, `${r.slug} lost its words`);
}
console.log(`✔ ${rows.length} posts render: ${pictures} pictures, only the tags an article is made of, nothing left as raw marks`);
