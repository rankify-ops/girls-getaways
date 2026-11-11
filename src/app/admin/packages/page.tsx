import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { IPlus } from "@/components/admin/AdminIcons";
import { getPackages, placeLabel, priceLabel } from "@/lib/admin-data";
import { PackageBrowser } from "@/components/admin/PackageBrowser";

export const metadata = { title: "Packages" };
export const revalidate = 0;

export default async function PackagesPage() {
  const { data, source } = await getPackages();

  const cards = data.map((p) => ({
    ...p,
    // Their photography is still served from Squarespace until the portal
    // owns the files; ask for a card-sized rendition rather than the original.
    image: p.heroImage ? `${p.heroImage}?format=750w` : null,
    place: placeLabel(p),
    price: priceLabel(p),
  }));

  return (
    <Shell
      title="Packages"
      subtitle={`${data.length} getaways${source === "captured" ? " · live catalogue, editing in the portal" : ""}`}
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
