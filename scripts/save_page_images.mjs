// The photographs on the standing pages, saved into the site.
//
// The team, gift cards, how it works and couples pages each carry a few
// pictures that were still being loaded from her old Squarespace account. They
// are part of the page's design rather than content she edits, so they live
// here with the rest of the site's own images, not in her portal library:
// re-encoded, held to 1600px, and named for what they are.
//
// After this runs, nothing on those pages depends on the old account.
//
//   node scripts/save_page_images.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const CDN = "https://images.squarespace-cdn.com/content/v1/60e11aa53e6d353c238d7259";
const OUT = new URL("../public/img/pages/", import.meta.url);

const images = {
  "team-hero": `${CDN}/1645661054376-8PFU3J35F6J0SFCDV676/Champe%CC%80reShoot_JenAnson-19+%281%29.jpg`,
  "team-jen": `${CDN}/3e54f0a8-917b-4cad-8ae1-42a3b87852cc/Jen+Headshot+cropped+%281%29.jpeg`,
  "team-kathryn": `${CDN}/91c49061-e698-47ab-b2ad-a583dbcf6cef/IMG_2914.jpg`,
  "team-prue": `${CDN}/06b945f4-1145-4c31-a026-e34a5b1d7bb2/Prue+1.jpg`,
  "team-diana": `${CDN}/58a58560-4798-49b5-ae2f-2bc0177baf29/Diana+Y..jpg`,
  "gift-cards": `${CDN}/eef6a75a-6d26-4e10-93a8-7e04cab0f808/GiftCard_BurleighPavillion_Gourmet%26Gourmand.jpg`,
  "how-it-works": `${CDN}/1629637160261-Z9R8H5M9SYHBLCG65ZQJ/HowItWorks_ByronBay.jpg`,
  "couples-hero": `${CDN}/0b2a4755-17f6-414a-8c73-902ca15946ec/DSC_7358+%283%29+%282%29.jpg`,
  "couples-jervis-bay": `${CDN}/7a5b10c9-8e50-4b27-9a2e-1bea23036c1a/Luna-Jervis-Bay-Accommodation-Pet-Friendly-17.jpg`,
  "couples-yamba": `${CDN}/d86325b5-28fb-4dfa-b46d-57d4cb2d6081/EliseHassey_YambaSurf_3021.jpg`,
  "couples-mudgee": `${CDN}/ba829309-4785-4a5f-8ff3-118cd13de655/luxury-eco-glamping-hut-tub-experience-romantic.jpg`,
  "couples-noosa": `${CDN}/7a3a79b7-93bd-4a02-a6d5-c4ddbab46dfc/Noosa_Peppers-Resort%2811%29.jpg`,
};

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [name, url] of Object.entries(images)) {
  const res = await fetch(`${url}?format=2500w`, { headers: { "user-agent": "Mozilla/5.0 (site migration)" } });
  if (!res.ok) throw new Error(`${name}: the old host answered ${res.status}`);
  const out = await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  writeFileSync(new URL(`${name}.webp`, OUT), out.data);
  total += out.data.length;
  console.log(`${name.padEnd(20)} ${out.info.width}x${out.info.height}  ${Math.round(out.data.length / 1024)} KB`);
}
console.log(`\n${Object.keys(images).length} pictures, ${Math.round(total / 1024)} KB in all`);
