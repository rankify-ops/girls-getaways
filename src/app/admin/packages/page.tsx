import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { IPlus } from "@/components/admin/AdminIcons";
import { getPackages, placeLabel, priceLabel, seedImageName } from "@/lib/admin-data";
import { PackageBrowser } from "@/components/admin/PackageBrowser";
import { asset } from "@/lib/basePath";

export const metadata = { title: "Packages" };
export const revalidate = 0;

export default async function PackagesPage() {
  const { data, source } = await getPackages();

  // The seed has no uploaded hero yet, so fall back to the optimised local
  // photography the public site already ships.
  const cards = data.map((p) => ({
    ...p,
    image: p.heroImage ?? (seedImageName(p.slug) ? asset(`/img/${seedImageName(p.slug)}-800.webp`) : null),
    place: placeLabel(p),
    price: priceLabel(p),
  }));

  return (
    <Shell
      title="Packages"
      subtitle={`${data.length} getaways${source === "seed" ? " · preview data" : ""}`}
      actions={
        <Link href="/admin/packages/new" className="adm-btn adm-btn-rose">
          <IPlus size={16} /> New package
        </Link>
      }
    >
      <PackageBrowser packages={cards} />
    </Shell>
  );
}
