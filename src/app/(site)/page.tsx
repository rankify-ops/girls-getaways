import { Hero } from "@/components/sections/Hero";
import { Trust } from "@/components/sections/Trust";
import { Regions } from "@/components/sections/Regions";
import { Results } from "@/components/booking/Results";
import { Experiences } from "@/components/sections/Experiences";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Specials } from "@/components/sections/Specials";
import { Sisterhood } from "@/components/sections/Sisterhood";
import { Concierge } from "@/components/catalogue/Concierge";
import { FeaturedReview, ReviewTrio } from "@/components/sections/Reviews";
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
      {/*
        * "Tell us about your trip", straight under the hero. It was only on the
        * catalogue page, which is where somebody goes after they have already
        * decided to browse. The visitor it is for is the one who arrives with a
        * sentence ("12 of us, hens, Gold Coast") and no idea which of 123
        * packages that is.
        */}
      <Concierge tone="blush" />
      <Regions />
      <Results total={total} />
      {/* A review with a section to itself, twice, and three more before the sign-up (sections/Reviews.tsx). */}
      <FeaturedReview index={0} />
      <Experiences />
      <FeaturedReview index={1} />
      <HowItWorks />
      <Specials />
      <ReviewTrio />
      <Sisterhood />
    </>
  );
}
