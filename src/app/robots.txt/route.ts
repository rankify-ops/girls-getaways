import { requestSite } from "@/lib/host";

/*
 * robots.txt, decided per host.
 *
 * On the real domain: everything open except the backend and the API, with the
 * sitemap named. The AI crawlers are listed explicitly rather than left to a
 * default — being recommended by an assistant is the point of all this, and a
 * crawler that is not named is a crawler somebody later assumes was allowed.
 *
 * On the preview: nothing. Her Squarespace site is live and indexed, and a
 * second copy of 123 identical package pages competing with it for her own
 * terms is the one way this migration could cost her traffic rather than
 * protect it. It opens itself at cutover, when the domain changes.
 */

export const dynamic = "force-dynamic";

const CRAWLERS = [
  "GPTBot",            // OpenAI, training and browsing
  "OAI-SearchBot",     // OpenAI search
  "ChatGPT-User",      // a person asking ChatGPT to open the page
  "ClaudeBot",         // Anthropic
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",   // Gemini / AI Overviews
  "Applebot-Extended",
  "Bingbot",
  "CCBot",             // Common Crawl, which most of the rest learn from
];

export async function GET() {
  const { origin, live } = await requestSite();

  const body = live
    ? [
        ...CRAWLERS.map((ua) => `User-agent: ${ua}\nAllow: /`),
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /api/",
        "",
        `Sitemap: ${origin}/sitemap.xml`,
        "",
        "# Machine-readable catalogue and a description of this business:",
        `# ${origin}/llms.txt`,
        "",
      ].join("\n")
    : [
        "# Staging copy of girlsgetaways.com.au — not for indexing.",
        "# The live site is https://www.girlsgetaways.com.au",
        "User-agent: *",
        "Disallow: /",
        "",
      ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
