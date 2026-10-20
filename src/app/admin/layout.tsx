import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./admin.css";

// Fraunces is the portal's display face (the public site uses Cormorant).
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Portal · Girls Getaways", template: "%s · Girls Getaways Portal" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={`adm ${fraunces.variable}`}>{children}</div>;
}
