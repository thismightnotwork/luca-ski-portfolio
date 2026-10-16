/* Cloudflare Worker: live GBSki race feed for Luca Finnis-Bernard. */
const DEFAULT_GBSKI_URL = "https://gbski.com/biography.php?id=42382";
const CACHE_TTL = 600;

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

function parseRaceRows(html) {
  const races = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }

    if (cells.length < 3) continue;

    const rowText = cells.join(" | ");
    const dateMatch = rowText.match(/\b(\d{1,2}[\/-][A-Za-z]{3}[\/-]\d{2,4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/);
    const disciplineMatch = rowText.match(/\b(SL|GS|SG|DH|AC)\b/i);
    const placeMatch = rowText.match(/\b(\d{1,3})(?:st|nd|rd|th)\b/i) || rowText.match(/\b(\d{1,3})\b/);
    const timeMatches = rowText.match(/\b\d{1,2}:\d{2}\.\d{1,3}\b|\b\d{1,2}\.\d{1,3}\b/g) || [];
    const pointsMatch = rowText.match(/\b\d{1,3}\.\d{1,2}\b/g);

    if (!dateMatch && !disciplineMatch && timeMatches.length === 0) continue;

    races.push({
      date: dateMatch ? dateMatch[1] : "",
      event: cells[1] || "",
      venue: cells[2] || "",
      discipline: disciplineMatch ? disciplineMatch[1].toUpperCase() : "",
      place: placeMatch ? placeMatch[1] : "",
      times: timeMatches,
      points: pointsMatch ? pointsMatch[pointsMatch.length - 1] : "",
      raw: cells
    });
  }

  return races;
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

    const sourceUrl = env.GBSKI_URL || DEFAULT_GBSKI_URL;
    const cache = caches.default;
    const cacheKey = new Request(url.origin + "/api/gbski", request);

    if (url.searchParams.get("refresh") !== "1") {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
    }

    try {
      const upstream = await fetch(sourceUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LucaFinnisBernardPortfolio/1.0)",
          "Accept": "text/html,application/xhtml+xml"
        },
        cf: { cacheTtl: CACHE_TTL, cacheEverything: true }
      });

      if (!upstream.ok) {
        return jsonResponse({ error: "GBSki request failed", status: upstream.status }, 502);
      }

      const html = await upstream.text();
      const races = parseRaceRows(html);
      const payload = {
        source: sourceUrl,
        updated: new Date().toISOString(),
        count: races.length,
        races
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
