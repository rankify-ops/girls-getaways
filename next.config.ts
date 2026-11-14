import { readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/*
 * The site now runs on Vercel (site + /admin portal in one project), so the
 * static-export settings are gone: the admin needs a server, and the public
 * pages revalidate from the database rather than being baked at build time.
 *
 * The old GitHub Pages build (output: "export" + basePath) is kept in
 * next.config.ts.bak until the domain is cut over, in case we need to ship a
 * static preview again.
 */
/*
 * Her old site's plain addresses that are not pages here: a page per state, per
 * town, a few campaign pages. Each goes to the catalogue narrowed to what it was
 * about (see scripts/build_redirect_map.py, which writes this file and says why
 * for every one). Tag and category archives are handled in the pages, not here.
 */
const oldPaths: Record<string, string> = JSON.parse(
  readFileSync(path.join(process.cwd(), "src/content/redirects.json"), "utf8"),
).paths;

const nextConfig: NextConfig = {
  trailingSlash: true,
  async redirects() {
    return Object.entries(oldPaths).map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  images: {
    remotePatterns: [
      // Package photography uploaded through the portal into Supabase Storage.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
