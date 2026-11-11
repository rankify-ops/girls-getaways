import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { PackageEditor } from "@/components/admin/PackageEditor";
import { getPackages } from "@/lib/admin-data";
import { allStyles, destinations, getCatalogue } from "@/lib/catalogue";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await getPackages();
  return { title: data.find((p) => p.slug === slug)?.title ?? "Package" };
}

export default async function EditPackage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, source } = await getPackages();
  const pkg = data.find((p) => p.slug === slug);
  if (!pkg) notFound();

  const image = pkg.heroImage ? `${pkg.heroImage}?format=1500w` : null;

  return (
    <Shell
      title={pkg.title}
      subtitle={pkg.venue ?? "Package"}
      actions={
        <Link href="/admin/packages" className="adm-btn adm-btn-ghost">
          Back to packages
        </Link>
      }
    >
      <PackageEditor
        pkg={pkg}
        image={image}
        readOnly={source !== "database"}
        destinations={destinations.map((d) => ({ slug: d.slug, name: d.name }))}
        styles={allStyles(await getCatalogue()).map((s) => s.name)}
      />
    </Shell>
  );
}
