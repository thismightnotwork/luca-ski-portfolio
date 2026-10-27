/* Cloudflare Worker: live GBSki race feed for Luca Finnis-Bernard. */
const GBSKI_URL = "https://gbski.com/biography.php?id=42382";
const CACHE_TTL = 600;

const SOURCES = [
  GBSKI_URL,
  "http://gbski.com/biography.php?id=42382",
  "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(GBSKI_URL),
  "https://corsproxy.io/?url=" + encodeURIComponent(GBSKI_URL),
  "https://r.jina.ai/" + GBSKI_URL,
  "https://api.allorigins.win/raw?url=" + encodeURIComponent(GBSKI_URL)
];

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
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
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

function parseRaces(text) {
  const htmlRaces = parseHtmlRaces(text);
  if (htmlRaces.length) return htmlRaces;
  return parseMarkdownRaces(text);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300"
    }
  });
}

async function fetchFirstAvailable() {
  const errors = [];

  for (const source of SOURCES) {
    try {
      const response = await fetch(source, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,text/plain,*/*"
        },
        redirect: "follow",
        cf: { cacheTtl: CACHE_TTL, cacheEverything: true }
      });

      if (!response.ok) {
        errors.push(source + " -> HTTP " + response.status);
        continue;
      }

      const text = await response.text();
      if (!text || text.length < 100) {
        errors.push(source + " -> empty response");
        continue;
      }

      const races = parseRaces(text);
      if (!races.length) {
        errors.push(source + " -> no race rows parsed");
        continue;
      }

      return { text, source, races };
    } catch (error) {
      errors.push(source + " -> " + String(error));
    }
  }

  throw new Error(errors.join("; "));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname !== "/api/gbski") {
      return jsonResponse({ error: "Not found" }, 404);
    }

    const cache = caches.default;
    const cacheKey = new Request(url.origin + "/api/gbski", request);

    if (url.searchParams.get("refresh") !== "1") {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
    }

    try {
      const result = await fetchFirstAvailable();
      const payload = {
        source: result.source,
        updated: new Date().toISOString(),
        count: result.races.length,
        races: result.races
      };

      const response = jsonResponse(payload);
      response.headers.set("Cache-Control", "public, max-age=" + CACHE_TTL);
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (error) {
      return jsonResponse({ error: "Could not load GBSki data", detail: String(error) }, 502);
    }
  }
};
