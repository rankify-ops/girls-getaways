"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/*
 * Her analytics and her ad pixel, carried over from the old site.
 *
 * The Squarespace site loads three things on every page: her Google Tag
 * Manager container, her Google Analytics 4 property, and her Meta Pixel. Cut
 * over without them and her traffic history stops on the day and her ad
 * audiences stop filling, with nothing anywhere saying so. These are the same
 * three ids, read off her live pages on 14 Nov 2026, loaded the same way.
 *
 * Only on her own domain. The same build is served on the preview address, and
 * a preview that reports into her real analytics puts our testing into her
 * numbers. The check is on the address in the browser, not on the server,
 * because asking the server which host it is would stop every page here being
 * served ready-made.
 *
 * The pixel needs one thing Squarespace never did: this site moves between
 * pages without reloading, and the pixel only counts a page when it is told
 * to. So a page view is sent on each change of address after the first.
 * Analytics notices those by itself.
 */
const GTM = "GTM-MNBMSMJB";
const GA4 = "G-5PXVLXCVGG";
const PIXEL = "732855876508995";

const isHerDomain = (host: string) => /(^|\.)girlsgetaways\.com\.au$/i.test(host);

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; push: unknown; loaded: boolean; version: string };
declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function load(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

export function Tracking() {
  const pathname = usePathname();
  const started = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    if (started.current || !isHerDomain(window.location.hostname)) return;
    started.current = true;

    // Google Tag Manager, then Analytics, sharing one dataLayer as they did before.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    load(`https://www.googletagmanager.com/gtm.js?id=${GTM}`);
    // gtag must push the arguments object itself, not an array of them.
    const gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    } as unknown as (...a: unknown[]) => void;
    gtag("js", new Date());
    gtag("config", GA4);
    load(`https://www.googletagmanager.com/gtag/js?id=${GA4}`);

    // The Meta Pixel's own loader, unchanged in what it does.
    if (!window.fbq) {
      const fbq = function (...args: unknown[]) {
        if (fbq.callMethod) fbq.callMethod(...args);
        else fbq.queue.push(args);
      } as Fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      window.fbq = fbq;
      window._fbq = fbq;
      load("https://connect.facebook.net/en_US/fbevents.js");
    }
    window.fbq!("init", PIXEL);
    window.fbq!("track", "PageView");
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (started.current) window.fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}
