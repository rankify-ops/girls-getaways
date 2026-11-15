/*
 * Telling her analytics and her ad pixel that somebody enquired.
 *
 * Both were installed and both counted page views and nothing else. An enquiry,
 * a tailor-made request and a Sisterhood sign-up are the three things this site
 * exists to produce, and neither tool was told about any of them: her ads could
 * be optimised for people who look, and not for people who ask.
 *
 * Analytics and the pixel load on her own domain only (components/analytics/
 * Tracking.tsx), so on the preview these calls find nothing to talk to and do
 * nothing, which is right: a test enquiry on staging is not a lead.
 *
 * `generate_lead` and `sign_up` are Google's own event names and `Lead` and
 * `CompleteRegistration` are Meta's, so each shows up where that tool already
 * looks for it, with nothing to configure.
 */
type Kind = "enquiry" | "tailor-made" | "sisterhood";

export function trackLead(kind: Kind, detail: { item?: string; girls?: number } = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[]; fbq?: (...a: unknown[]) => void };
  const signUp = kind === "sisterhood";
  try {
    // The same shape gtag() itself pushes, so Analytics reads it as an event.
    w.dataLayer?.push({ event: signUp ? "sign_up" : "generate_lead", lead_type: kind, item_name: detail.item, group_size: detail.girls });
    w.fbq?.("track", signUp ? "CompleteRegistration" : "Lead", { content_name: detail.item ?? kind, content_category: kind });
  } catch {
    // Counting an enquiry must never be the reason one fails.
  }
}
