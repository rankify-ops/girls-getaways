import type { Metadata } from "next";
import { NotFound } from "@/components/ui/NotFound";

export const metadata: Metadata = { title: "Page not found" };

// Any address that matches no page at all. See components/ui/NotFound.tsx.
export default function GlobalNotFound() {
  return <NotFound />;
}
