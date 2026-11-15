"use client";

import { useSyncExternalStore } from "react";

/*
 * Is this the preview, or her real domain?
 *
 * The same build serves girls-getaways.vercel.app and, at cutover,
 * girlsgetaways.com.au. Some things are right to show on the first and wrong
 * on the second: a stand-in review is how Tom and Shaun see where the real
 * ones will go, and it is a made-up testimonial the moment a customer reads it.
 *
 * False on the server and until the browser has answered, so a placeholder is
 * never in the HTML that is sent. On her real domain it is never drawn at all,
 * and nobody has to remember to remove anything on the day.
 */
const LIVE = /(^|\.)girlsgetaways\.com\.au$/i;
const never = () => () => {};

export const usePreview = (): boolean =>
  useSyncExternalStore(
    never,
    () => !LIVE.test(window.location.hostname),
    () => false,
  );
