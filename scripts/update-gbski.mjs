import { writeFile, mkdir } from "node:fs/promises";

const GBSKI_URL = "https://gbski.com/biography.php?id=42382";
const OUTPUT = "gbski-debug.html";

async function main() {
  const response = await fetch(GBSKI_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error("GBSki request failed: HTTP " + response.status);
  }

  const html = await response.text();
  await mkdir(".", { recursive: true });
  await writeFile(OUTPUT, html);

  console.log("GBSki HTML length:", html.length);

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let rowMatch;
  let rowCount = 0;

  while ((rowMatch = rowRegex.exec(html)) !== null && rowCount < 100) {
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
    }
    console.log("Row " + rowCount + ":", JSON.stringify(cells));
    rowCount++;
  }

  console.log("Saved GBSki HTML to", OUTPUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
