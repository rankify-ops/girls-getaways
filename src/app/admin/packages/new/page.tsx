import { Placeholder } from "@/components/admin/Placeholder";

export const metadata = { title: "New package" };

export default function NewPackagePage() {
  return (
    <Placeholder
      title="New package"
      subtitle="Create a getaway"
      blurb="Creating packages writes to the database, so this unlocks as soon as the client's Supabase project is connected. The form is the same one used for editing an existing package."
      bullets={[
        "Name, venue, destination and description",
        "Pricing, group size and nights",
        "Photos, inclusions and getaway styles",
      ]}
    />
  );
}
