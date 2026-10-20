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
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      // Package photography uploaded through the portal into Supabase Storage.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
