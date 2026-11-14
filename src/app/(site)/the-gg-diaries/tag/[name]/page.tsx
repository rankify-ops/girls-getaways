import { permanentRedirect } from "next/navigation";
import { archiveTarget } from "@/lib/redirects";

// Her blog's old tag archives. Each goes to the part of the catalogue it was about, or to
// the blog itself (src/lib/redirects.ts).
export default async function DiaryArchive({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  permanentRedirect(archiveTarget("the-gg-diaries/tag", name) ?? "/the-gg-diaries/");
}
