import { Placeholder } from "@/components/admin/Placeholder";

export const metadata = { title: "Destinations" };

export default function DestinationsPage() {
  return (
    <Placeholder
      title="Destinations"
      subtitle="Regions and towns shown across the website"
      blurb="Destinations come from the same database as packages. Once it's connected, this is where you add a region, set its photo and description, and control the order it appears in the menu."
      bullets={[
        "Add, rename and reorder destinations and states",
        "Set the banner photo and intro copy for each region",
        "Hide a destination without deleting its packages",
      ]}
    />
  );
}
