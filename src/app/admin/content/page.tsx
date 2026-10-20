import { Placeholder } from "@/components/admin/Placeholder";

export const metadata = { title: "Homepage content" };

export default function ContentPage() {
  return (
    <Placeholder
      title="Homepage content"
      subtitle="Wording and sections on the public site"
      blurb="The headline, the three how-it-works steps, the experience tiles and the Sisterhood panel are all editable text. Once the database is connected you can change them here without a developer."
      bullets={[
        "Hero headline, subheading and button labels",
        "How it works — the three steps",
        "Experience tiles and the Sisterhood sign-up copy",
      ]}
    />
  );
}
