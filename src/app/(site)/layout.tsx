import { BookingProvider } from "@/lib/booking";
import { getCatalogue, packageHref, placeText, priceFromOf, stateOf } from "@/lib/catalogue";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBar } from "@/components/layout/MobileBar";
import { MobileSearchSheet } from "@/components/booking/MobileSearchSheet";
import { ViewBeacon } from "@/components/analytics/ViewBeacon";
import { Tracking } from "@/components/analytics/Tracking";

/*
 * Chrome for the public website only.
 *
 * It lives in a route group so /admin renders without the site's header,
 * footer, sticky search bar and booking drawer — the portal has its own shell.
 */
// The portal's cache window, so the menus follow her catalogue within the minute.
export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Her real packages, light, for the menus and the search: what is in each
  // state and place, by name, with a link. See MenuPackage in lib/booking.tsx.
  const catalogue = (await getCatalogue()).map((p) => ({
    slug: p.slug,
    title: p.title,
    venue: p.venue,
    path: packageHref(p),
    image: p.heroImage,
    place: placeText(p),
    from: priceFromOf(p),
    destination: p.destination,
    area: p.area,
    placeTags: p.placeTags,
    state: stateOf(p),
    styles: p.styles,
    guestsMin: p.guestsMin,
    guestsMax: p.guestsMax,
  }));
  return (
    <BookingProvider catalogue={catalogue}>
      <Header />
      <main>{children}</main>
      <Footer />
      <MobileBar />
      <MobileSearchSheet />
      <ViewBeacon />
      <Tracking />
    </BookingProvider>
  );
}
