import { BookingProvider } from "@/lib/booking";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBar } from "@/components/layout/MobileBar";
import { MobileSearchSheet } from "@/components/booking/MobileSearchSheet";
import { QuickView } from "@/components/booking/QuickView";
import { ViewBeacon } from "@/components/analytics/ViewBeacon";
import { Tracking } from "@/components/analytics/Tracking";

/*
 * Chrome for the public website only.
 *
 * It lives in a route group so /admin renders without the site's header,
 * footer, sticky search bar and booking drawer — the portal has its own shell.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <BookingProvider>
      <Header />
      <main>{children}</main>
      <Footer />
      <MobileBar />
      <MobileSearchSheet />
      <QuickView />
      <ViewBeacon />
      <Tracking />
    </BookingProvider>
  );
}
