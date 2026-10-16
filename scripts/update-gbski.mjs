import { writeFile, mkdir } from "node:fs/promises";

const GBSKI_URL = "https://gbski.com/biography.php?id=42382";
const OUTPUT = "data/gbski.json";

const entityMap = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&#39;": "'", "&nbsp;": " " };

function decodeEntities(value) {
  return String(value || "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match) => entityMap[match] || match)
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return decodeEntities(String(value || "").replace(/<[^>]*>/g, " "));
}

function looksLikeRaceRow(cells) {
  const text = cells.join(" | ");
  const hasDate = /\b(\d{1,2}[\/-][A-Za-z]{3}[\/-]\d{2,4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/.test(text);
  const hasDiscipline = /\b(SL|GS|SG|DH|AC)\b/i.test(text);
  const hasTime = /\b\d{1,2}:\d{2}\.\d{1,3}\b|\b\d{1,2}\.\d{1,3}\b/.test(text);
  return cells.length >= 3 && (hasDate || hasDiscipline || hasTime);
}

function buildRace(cells) {
  const text = cells.join(" | ");
  const dateMatch = text.match(/\b(\d{1,2}[\/-][A-Za-z]{3}[\/-]\d{2,4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/);
  const disciplineMatch = text.match(/\b(SL|GS|SG|DH|AC)\b/i);
  const placeMatch = text.match(/\b(\d{1,3})(?:st|nd|rd|th)\b/i) || text.match(/\b(\d{1,3})\b/);
  const timeMatches = text.match(/\b\d{1,2}:\d{2}\.\d{1,3}\b|\b\d{1,2}\.\d{1,3}\b/g) || [];
  const pointsMatch = text.match(/\b\d{1,3}\.\d{1,2}\b/g);

  return {
    date: dateMatch ? dateMatch[1] : "",
    event: cells[1] || "",
    venue: cells[2] || "",
    discipline: disciplineMatch ? disciplineMatch[1].toUpperCase() : "",
    place: placeMatch ? placeMatch[1] : "",
    times: timeMatches,
    points: pointsMatch ? pointsMatch[pointsMatch.length - 1] : "",
    raw: cells
  };
}

function parseHtmlRaces(text) {
  const races = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(text)) !== null) {
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }

    if (looksLikeRaceRow(cells)) races.push(buildRace(cells));
  }

  return races;
}

function parseMarkdownRaces(text) {
  const races = [];

  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("|")) continue;

    const cells = line
      .split("|")
      .map((cell) => decodeEntities(cell.replace(/^\s*[-:]+\s*$/, "").trim()))
      .filter((cell) => cell !== "");

    if (!looksLikeRaceRow(cells)) continue;

    const race = buildRace(cells);
    if (race.date || race.discipline || race.times.length) races.push(race);
  }

  return races;
}

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

  const text = await response.text();
  const htmlRaces = parseHtmlRaces(text);
  const races = htmlRaces.length ? htmlRaces : parseMarkdownRaces(text);

  if (!races.length) {
    throw new Error("No GBSki race rows could be parsed");
  }

  await mkdir("data", { recursive: true });
  await writeFile(OUTPUT, JSON.stringify({
    source: GBSKI_URL,
    updated: new Date().toISOString(),
    count: races.length,
    races
  }, null, 2) + "\n");

  console.log("Wrote " + races.length + " races to " + OUTPUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
