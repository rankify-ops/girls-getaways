import { Hero } from "@/components/sections/Hero";
import { Trust } from "@/components/sections/Trust";
import { Regions } from "@/components/sections/Regions";
import { Results } from "@/components/booking/Results";
import { Experiences } from "@/components/sections/Experiences";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Specials } from "@/components/sections/Specials";
import { Sisterhood } from "@/components/sections/Sisterhood";
import { getCatalogue } from "@/lib/catalogue";

// The portal's cache window, so the count on this page follows her catalogue.
export const revalidate = 60;

export default async function Home() {
  // How many getaways there really are, for the links that lead to all of them.
  const total = (await getCatalogue()).length;
  return (
    <>
      <Hero />
      <Trust />
      <Regions />
      <Results total={total} />
      <Experiences />
      <HowItWorks />
      <Specials />
      <Sisterhood />
    </>
  );
}
