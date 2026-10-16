/* Live GBSki renderer using data/gbski.json; static results remain as fallback. */
(function () {
  "use strict";

  (function renderResults() {
    const list = document.getElementById("results-list");
    const summary = document.getElementById("results-toggle");
    if (!list || typeof RACE_RESULTS === "undefined") return;

    let currentRaces = RACE_RESULTS.slice();
    let isLive = false;

    function escapeHtml(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function formatDate(value) {
      if (!value) return "";
      const parsed = new Date(value);
      if (isNaN(parsed)) return value;
      return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }

    function normaliseLiveRace(race) {
      const raw = Array.isArray(race.raw) ? race.raw : [];
      const times = Array.isArray(race.times) ? race.times : [];
      const details = [];

      if (race.venue) details.push(race.venue);
      if (race.discipline) details.push(race.discipline);
      if (race.place) details.push(race.place);
      if (times.length) details.push("Times: " + times.join(" / "));
      if (race.points) details.push("Points: " + race.points);

      return {
        place: race.place || raw[0] || "Result",
        event: race.event || raw[1] || "GBSki race",
        venue: race.venue || raw[2] || "",
        discipline: race.discipline || "",
        date: race.date || "",
        display: formatDate(race.date),
        details: details.join(" · "),
        times,
        points: race.points || ""
      };
    }

    function render() {
      list.innerHTML = currentRaces.map((race) => {
        const detail = race.details || [race.tier, race.venue].filter(Boolean).join(" · ");
        const timeInfo = race.times && race.times.length ? '<span class="result-times">' + escapeHtml(race.times.join(" / ")) + '</span>' : "";
        const pointInfo = race.points ? '<span class="result-points">' + escapeHtml(race.points) + ' pts</span>' : "";

        return '<div class="result-row">' +
          '<span class="result-place">' + escapeHtml(race.place) + '</span>' +
          '<div><strong>' + escapeHtml(race.event) + '</strong><span>' + escapeHtml(detail) + '</span>' + timeInfo + pointInfo + '</div>' +
          '<time datetime="' + escapeHtml(race.date) + '">' + escapeHtml(race.display || formatDate(race.date)) + '</time>' +
          '<span class="discipline-tag ' + escapeHtml(race.discipline || "") + '">' + escapeHtml(race.discipline || "Race") + '</span>' +
          '</div>';
      }).join("");

      const status = document.getElementById("gbski-status");
      if (status) status.textContent = isLive ? "Live from GBSki" : "Showing saved race record";
    }

    async function loadLiveResults() {
      try {
        const response = await fetch("data/gbski.json?cache=" + Date.now(), { cache: "no-store" });
        if (!response.ok) throw new Error("Race data returned " + response.status);
        const data = await response.json();
        if (!data || !Array.isArray(data.races) || !data.races.length) throw new Error("No live races");

        currentRaces = data.races.map(normaliseLiveRace);
        isLive = true;
      } catch (error) {
        console.warn("Live GBSki data unavailable; using saved results.", error);
        isLive = false;
      }
      render();
    }

    if (summary) {
      summary.addEventListener("click", () => {
        const open = summary.getAttribute("aria-expanded") === "true";
        summary.setAttribute("aria-expanded", String(!open));
        list.classList.toggle("is-open", !open);
      });
    }

    const panel = document.querySelector("#skiing .results-panel");
    if (panel && !document.getElementById("gbski-status")) {
      const status = document.createElement("p");
      status.id = "gbski-status";
      status.className = "gbski-status";
      panel.insertBefore(status, panel.firstChild);
    }

    render();
    loadLiveResults();
  })();
})();
