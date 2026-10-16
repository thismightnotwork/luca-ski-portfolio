import { writeFile, mkdir } from "node:fs/promises";

const GBSKI_URL = "https://gbski.com/biography.php?id=42382";
const OUTPUT = "data/gbski.json";
const DEBUG_OUTPUT = "gbski-debug.html";

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

function ordinal(number) {
  const n = Number(number);
  if (!Number.isFinite(n)) return String(number);
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";
  return n + suffix;
}

function isValidRaceRow(cells) {
  if (!Array.isArray(cells) || cells.length < 12) return false;

  const date = cells[0] || "";
  const discipline = (cells[4] || "").trim().toUpperCase();
  const status = (cells[5] || "").trim().toUpperCase();
  const place = cells[6] || "";

  const validDate = /\b\d{1,2}-[A-Za-z]{3}-\d{2,4}\b|\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/.test(date);
  const validDiscipline = ["SL", "GS", "SG", "DH", "AC"].includes(discipline);
  const validStatus = ["QLF", "DNF", "DNS", "DSQ", "NPS"].includes(status);
  const validPlace = /\b\d{1,3}\s*\(\d{1,3}\)\b/.test(place);

  return validDate && validDiscipline && validStatus && validPlace;
}

function buildRace(cells) {
  const date = cells[0] || "";
  const venue = cells[1] || "";
  const event = cells[2] || "";
  const codex = cells[3] || "";
  const discipline = cells[4].trim().toUpperCase();
  const status = cells[5].trim().toUpperCase();
  const placeRaw = cells[6] || "";
  const time = cells[7] || "";
  const racePoints = cells[8] || "";
  const penalty = cells[9] || "";
  const resultPoints = cells[10] || "";
  const list = cells[11] || "";

  const placeMatch = placeRaw.match(/(\d{1,3})\s*\((\d{1,3})\)/);
  const overall = placeMatch ? ordinal(placeMatch[1]) : "";
  const category = placeMatch ? ordinal(placeMatch[2]) : "";

  const details = [venue, event, discipline];
  if (overall && category) details.push(overall + " overall, " + category + " in category");
  if (time) details.push("Time: " + time);
  if (racePoints) details.push("Race points: " + racePoints);
  if (penalty) details.push("Penalty: " + penalty);
  if (resultPoints) details.push("Result points: " + resultPoints);

  return {
    date,
    event,
    venue,
    codex,
    discipline,
    status,
    place: overall && category ? overall + " (" + category + ")" : overall,
    category,
    time,
    times: [time].filter(Boolean),
    racePoints,
    penalty,
    points: resultPoints,
    list,
    details: details.join(" · "),
    raw: cells
  };
}

function parseHtmlRaces(text) {
  const races = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  let rowCount = 0;

  while ((rowMatch = rowRegex.exec(text)) !== null) {
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }

    if (rowCount < 20) console.log("Row " + rowCount + ":", JSON.stringify(cells));
    rowCount++;

    if (isValidRaceRow(cells)) races.push(buildRace(cells));
  }

  console.log("Total table rows found:", rowCount);
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
  await writeFile(DEBUG_OUTPUT, text);
  console.log("GBSki HTML length:", text.length);

  const races = parseHtmlRaces(text);

  if (!races.length) {
    throw new Error("No valid GBSki Results rows could be parsed");
  }

  await mkdir("data", { recursive: true });
  await writeFile(OUTPUT, JSON.stringify({
    source: GBSKI_URL,
    updated: new Date().toISOString(),
    count: races.length,
    races
  }, null, 2) + "\n");

  console.log("Wrote " + races.length + " valid races to " + OUTPUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
