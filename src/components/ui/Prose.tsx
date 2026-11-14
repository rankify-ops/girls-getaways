/*
 * Her own words, brought across from the old site as clean markup.
 *
 * The markup is ours: scripts/capture_pages.py and capture_diaries.py build it
 * from an allow-list of tags (paragraphs, headings, lists, links, emphasis,
 * pictures) and escape everything else, so there is nothing in it that was not
 * put there deliberately. That is what makes setting it as HTML safe.
 */
export function Prose({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`prose-gg ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
