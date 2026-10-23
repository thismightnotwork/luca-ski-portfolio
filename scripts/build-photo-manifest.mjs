import { readdir, writeFile } from "node:fs/promises";

/**
 * Scans the photos/ folder and writes photos/manifest.json, which the gallery
 * loads instead of the rate-limited GitHub Contents API. Regenerated on every
 * deploy by .github/workflows/deploy.yml, so it never goes stale.
 *
 * The filename filters and caption rules mirror app.js so the manifest and the
 * GitHub API fallback always produce the same gallery.
 */

const PHOTOS_DIR = "photos";
const OUTPUT = "photos/manifest.json";

const allowedExt = /\.(avif|gif|jpe?g|png|webp)$/i;
const excludedNames = /^(favicon|apple-touch-icon|web-app-manifest|manifest)/i;
const locationLabels = [
  { pattern: /^hemel/i, label: "Hemel Hempstead" },
  { pattern: /^mk\b/i, label: "Milton Keynes" },
  { pattern: /^tignes/i, label: "Tignes" }
];

function captionFor(filename) {
  const stem = filename.replace(/\.[^.]+$/, "");
  const match = locationLabels.find((l) => l.pattern.test(stem));
  const place = match ? match.label : stem.replace(/[-_]/g, " ");
  return "Luca Finnis-Bernard — " + place;
}

async function main() {
  const entries = await readdir(PHOTOS_DIR);

  const photos = entries
    .filter((name) =>
      allowedExt.test(name) &&
      !excludedNames.test(name) &&
      name.toLowerCase() !== "image.jpeg"
    )
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({
      file,
      src: PHOTOS_DIR + "/" + file,
      caption: captionFor(file)
    }));

  await writeFile(OUTPUT, JSON.stringify({
    updated: new Date().toISOString(),
    count: photos.length,
    photos
  }, null, 2) + "\n");

  console.log("Wrote " + photos.length + " photos to " + OUTPUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
