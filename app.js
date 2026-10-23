/* Full portfolio behaviour; all race results and race statistics come from GBSki data. */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  (function preloader() {
    const el = document.querySelector(".preloader");
    const bar = document.querySelector(".preloader-bar");
    if (!el) return;
    let progress = 0;
    const finish = () => {
      el.classList.add("is-hidden");
      setTimeout(() => el.remove(), 500);
    };
    if (reduceMotion) { finish(); return; }
    const tick = () => {
      progress = Math.min(100, progress + Math.random() * 18 + 6);
      if (bar) bar.style.width = progress + "%";
      if (progress >= 100) { finish(); return; }
      setTimeout(tick, 90);
    };
    tick();
    setTimeout(finish, 2500);
    window.addEventListener("load", () => setTimeout(finish, 200));
  })();

  (function nav() {
    const navEl = document.querySelector(".nav");
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector(".mobile-menu");
    const overlay = document.querySelector(".menu-overlay");
    const links = document.querySelectorAll(".mobile-menu a, .nav-links a");

    const onScroll = () => {
      if (window.scrollY > 24) navEl.classList.add("is-scrolled");
      else navEl.classList.remove("is-scrolled");
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function openMenu() {
      menu.classList.add("is-open");
      overlay.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      const first = menu.querySelector("a");
      if (first) first.focus();
    }
    function closeMenu() {
      menu.classList.remove("is-open");
      overlay.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      const first = menu.querySelector("a");
      if (first) first.focus();
    }
    if (toggle) {
      toggle.addEventListener("click", () => {
        toggle.getAttribute("aria-expanded") === "true" ? closeMenu() : openMenu();
      });
    }
    if (overlay) overlay.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    links.forEach((a) => a.addEventListener("click", closeMenu));

    const sections = document.querySelectorAll("main section[id]");
    const navAnchors = document.querySelectorAll(".nav-links a, .mobile-menu a");
    if (sections.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          navAnchors.forEach((a) => {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
          });
        });
      }, { rootMargin: "-45% 0% -45% 0%" });
      sections.forEach((s) => io.observe(s));
    }
  })();

  (function reveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  })();

  (function slalomCourse() {
    const rail = document.querySelector(".slalom-rail");
    const progressFill = document.querySelector(".progress-bar-fill");
    if (!rail && !progressFill) return;

    const path = rail ? rail.querySelector(".course-path") : null;
    const marker = rail ? rail.querySelector(".marker") : null;
    const gateLayer = rail ? rail.querySelector(".gate-layer") : null;
    let pathLength = 0;

    function buildGates() {
      if (!path || !gateLayer) return;
      gateLayer.innerHTML = "";
      pathLength = path.getTotalLength();
      const count = window.innerWidth <= 900 ? 6 : 12;
      for (let i = 1; i <= count; i++) {
        const frac = i / (count + 1);
        const pt = path.getPointAtLength(frac * pathLength);
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const colour = i % 2 === 0 ? "#57b8ff" : "#ff3d3d";
        g.setAttribute("class", "gate " + (i % 2 === 0 ? "blue" : "red"));
        g.setAttribute("transform", "translate(" + (pt.x - 1.5) + ", " + (pt.y - 6) + ")");
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", "3");
        rect.setAttribute("height", "12");
        rect.setAttribute("rx", "1.5");
        rect.setAttribute("fill", colour);
        g.appendChild(rect);
        gateLayer.appendChild(g);
      }
    }

    function updateMarker() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const frac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (progressFill) progressFill.style.width = frac * 100 + "%";
      if (marker && path && !reduceMotion) {
        const pt = path.getPointAtLength(frac * pathLength);
        marker.setAttribute("transform", "translate(" + pt.x + ", " + pt.y + ")");
      }
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { updateMarker(); ticking = false; });
    }

    if (path) {
      const revealRail = () => {
        buildGates();
        updateMarker();
        if (rail) rail.classList.add("is-ready");
      };
      window.addEventListener("load", revealRail);
      window.addEventListener("resize", () => { buildGates(); updateMarker(); });
      setTimeout(revealRail, 400);
    } else if (rail) {
      rail.classList.add("is-ready");
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    updateMarker();
  })();

  (function resultsAndStats() {
    const list = document.getElementById("results-list");
    const summary = document.getElementById("results-toggle");
    const statGrid = document.getElementById("season-stats");
    const intro = document.querySelector("#skiing .section-inner > p.lede");
    if (!list) return;

    let currentRaces = [];
    let usingLiveData = false;

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
      const details = [];

      if (race.venue) details.push(race.venue);
      if (race.discipline) details.push(race.discipline);
      if (race.place) details.push(race.place);
      if (race.time) details.push("Time: " + race.time);
      if (race.points) details.push("Result points: " + race.points);

      return {
        place: race.place || raw[0] || "Result",
        event: race.event || raw[2] || "GBSki race",
        venue: race.venue || raw[1] || "",
        discipline: race.discipline || "",
        date: race.date || "",
        display: formatDate(race.date),
        details: race.details || details.join(" · "),
        times: race.times && race.times.length ? race.times : (race.time ? [race.time] : []),
        points: race.points || ""
      };
    }

    function render() {
      if (!currentRaces.length) {
        list.innerHTML = '<div class="result-row"><span class="result-place">—</span><div><strong>Loading GBSki results</strong><span>Fetching the latest race data</span></div><time></time><span class="discipline-tag">GBSki</span></div>';
        return;
      }

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
    }

    function categoryPlace(race) {
      const bracket = String(race.place || "").match(/\(([^)]+)\)/);
      if (bracket && /^\d+$/.test(bracket[1].trim())) return Number(bracket[1].trim());
      const overall = String(race.place || "").match(/^(\d+)/);
      return overall ? Number(overall[1]) : Infinity;
    }

    function calculateStats() {
      const slalom = currentRaces.filter((race) => String(race.discipline).includes("SL"));
      const giantSlalom = currentRaces.filter((race) => String(race.discipline).includes("GS"));

      return {
        races: currentRaces.length,
        wins: currentRaces.filter((race) => categoryPlace(race) === 1).length,
        podiums: currentRaces.filter((race) => categoryPlace(race) <= 3).length,
        topTens: currentRaces.filter((race) => categoryPlace(race) <= 10).length,
        slalom: slalom.length,
        giantSlalom: giantSlalom.length
      };
    }

    function updateRaceStats() {
      if (!statGrid || !currentRaces.length) return;
      const stats = calculateStats();

      statGrid.innerHTML = [
        { value: stats.races, label: "Races" },
        { value: stats.wins, label: "Win" + (stats.wins === 1 ? "" : "s") },
        { value: stats.podiums, label: "Podiums" },
        { value: stats.topTens, label: "Top-10s" },
        { value: stats.slalom, label: "Slalom races" },
        { value: stats.giantSlalom, label: "GS races" }
      ].map((stat) => (
        '<div class="stat-card"><strong>' + stat.value + '</strong><span>' + stat.label + '</span></div>'
      )).join("");

      if (intro) {
        intro.textContent = "I’ve recorded " + stats.races + " races across slalom and giant slalom, with " +
          stats.wins + " win" + (stats.wins === 1 ? "" : "s") + ", " + stats.podiums + " podiums and " +
          stats.topTens + " top-ten finishes — " + stats.slalom + " slalom starts and " +
          stats.giantSlalom + " giant slalom starts. All results are sourced from GBSki.";
      }

      if (summary) {
        summary.innerHTML = "View all " + stats.races + " race results <span class=\"plus\">+</span>";
      }
    }

    async function loadLiveResults() {
      const endpoint = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.gbskiApi)
        ? SITE_CONFIG.gbskiApi
        : "data/gbski.json?cache=" + Date.now();

      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) throw new Error("Race data returned " + response.status);
        const data = await response.json();
        if (!data || !Array.isArray(data.races) || !data.races.length) throw new Error("No live races");

        currentRaces = data.races
          .map(normaliseLiveRace)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        usingLiveData = true;
      } catch (error) {
        console.warn("GBSki race data unavailable.", error);
        list.innerHTML = '<div class="result-row"><span class="result-place">—</span><div><strong>GBSki results unavailable</strong><span>Please check back shortly</span></div><time></time><span class="discipline-tag">GBSki</span></div>';
      }
      render();
      updateRaceStats();
    }

    if (summary) {
      summary.addEventListener("click", () => {
        const open = summary.getAttribute("aria-expanded") === "true";
        summary.setAttribute("aria-expanded", String(!open));
        list.classList.toggle("is-open", !open);
      });
    }

    render();
    if (statGrid && typeof SEASON_STATS !== "undefined") {
      statGrid.innerHTML = SEASON_STATS.map((s) => (
        '<div class="stat-card"><strong>' + s.value + '</strong><span>' + s.label + '</span></div>'
      )).join("");
    }
    loadLiveResults();
  })();

  (function renderEquipment() {
    const equipGrid = document.getElementById("equipment-grid");
    if (equipGrid && typeof EQUIPMENT !== "undefined") {
      equipGrid.innerHTML = EQUIPMENT.map((e) => (
        '<div><b>' + e.part + '</b><span>' + e.brand + '</span></div>'
      )).join("");
    }
  })();

  (function renderTimeline() {
    const el = document.getElementById("journey-timeline");
    if (!el || typeof JOURNEY === "undefined") return;
    el.innerHTML = JOURNEY.map((j) => (
      '<li class="timeline-item" data-reveal>' +
        '<p class="timeline-date">' + j.date + '</p>' +
        '<span class="timeline-tag">' + j.category + '</span>' +
        '<h3>' + j.title + '</h3>' +
        '<p>' + j.description + '</p>' +
      '</li>'
    )).join("");
    const items = el.querySelectorAll("[data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("in-view"));
    } else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add("in-view"); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.15 });
      items.forEach((i) => io.observe(i));
    }
  })();

  (function gallery() {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;

    const owner = "thismightnotwork";
    const repo = "luca-ski-portfolio";
    const branch = "main";
    const allowedExt = /\.(avif|gif|jpe?g|png|webp)$/i;
    const excludedNames = /^(favicon|apple-touch-icon|web-app-manifest)/i;
    const locationLabels = [
      { pattern: /^hemel/i, label: "Hemel Hempstead" },
      { pattern: /^mk\b/i, label: "Milton Keynes" },
      { pattern: /^tignes/i, label: "Tignes" }
    ];
    let items = [];

    function captionFor(filename) {
      const stem = filename.replace(/\.[^.]+$/, "");
      const match = locationLabels.find((l) => l.pattern.test(stem));
      const place = match ? match.label : stem.replace(/[-_]/g, " ");
      return "Luca Finnis-Bernard — " + place;
    }

    function renderLoading() {
      const skeleton = '<div class="gallery-tile" aria-hidden="true"><div class="gallery-skeleton"></div></div>';
      grid.innerHTML = '<p class="gallery-status" role="status">Loading photos…</p>' + skeleton.repeat(6);
    }

    function renderEmpty() {
      grid.innerHTML = '<div class="gallery-placeholder gallery-message"><strong>Photos coming soon</strong>' +
        '<span>New shots from training and race days will appear here.</span></div>';
    }

    function renderError() {
      grid.innerHTML = '<div class="gallery-error" role="alert">' +
        '<strong>Photos couldn’t be loaded.</strong>' +
        '<p>The photo service didn’t respond. Try again, or see the latest photos on ' +
        '<a href="https://instagram.com/luca.fb_ski" target="_blank" rel="noopener noreferrer">Instagram</a>.</p>' +
        '<button class="btn btn-secondary" type="button" data-gallery-retry>Try again</button>' +
        '</div>';
      const retry = grid.querySelector("[data-gallery-retry]");
      if (retry) retry.addEventListener("click", loadPhotos);
    }

    function renderGrid() {
      if (!items.length) {
        renderEmpty();
        return;
      }
      grid.innerHTML = items.map((item, i) => (
        '<button class="gallery-tile" data-index="' + i + '" aria-label="Open photo: ' + item.caption + '">' +
          '<img src="' + item.src + '" alt="' + item.caption + '" loading="lazy" width="640" height="800">' +
          '<figcaption>' + item.caption + '</figcaption>' +
        '</button>'
      )).join("");

      grid.querySelectorAll("button.gallery-tile").forEach((btn) => {
        btn.addEventListener("click", () => openLightbox(Number(btn.dataset.index)));
      });
    }

    // Primary source: the checked-in manifest, generated by scripts/build-photo-manifest.mjs.
    async function loadFromManifest() {
      const res = await fetch("photos/manifest.json?cache=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("Manifest returned " + res.status);
      const data = await res.json();
      if (!data || !Array.isArray(data.photos)) throw new Error("Manifest has no photos array");
      return data.photos.map((p) => ({
        type: "image",
        src: p.src || "photos/" + p.file,
        caption: p.caption || captionFor(p.file)
      }));
    }

    // Fallback: the GitHub Contents API, for local edits made before the manifest is regenerated.
    async function loadFromGitHub() {
      const res = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/photos?ref=" + branch, {
        headers: { Accept: "application/vnd.github+json" }, cache: "no-store"
      });
      if (!res.ok) throw new Error("GitHub returned " + res.status);
      const files = await res.json();
      if (!Array.isArray(files)) throw new Error("Unexpected GitHub response");
      return files
        .filter((f) => f.type === "file" && allowedExt.test(f.name) && !excludedNames.test(f.name) && f.name.toLowerCase() !== "image.jpeg")
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((f) => ({ type: "image", src: f.download_url, caption: captionFor(f.name) }));
    }

    async function loadPhotos() {
      renderLoading();
      try {
        try {
          items = await loadFromManifest();
        } catch (manifestError) {
          console.warn("Gallery: manifest unavailable, falling back to GitHub.", manifestError);
          items = await loadFromGitHub();
        }
      } catch (error) {
        console.warn("Gallery: could not load photos.", error);
        items = [];
        renderError();
        return;
      }
      renderGrid();
    }

    const lb = document.getElementById("lightbox");
    const lbImg = lb ? lb.querySelector("img") : null;
    const lbCaption = lb ? lb.querySelector(".lightbox-caption") : null;
    let currentIndex = 0;
    let lastFocused = null;

    function imageIndexes() {
      return items.map((it, i) => (it.type === "image" ? i : -1)).filter((i) => i >= 0);
    }

    function openLightbox(index) {
      if (!lb) return;
      currentIndex = index;
      const item = items[index];
      lbImg.src = item.src;
      lbImg.alt = item.caption;
      lbCaption.textContent = item.caption;
      lb.classList.add("is-open");
      lastFocused = document.activeElement;
      lb.querySelector(".lightbox-close").focus();
      document.body.style.overflow = "hidden";
    }
    function closeLightbox() {
      if (!lb) return;
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }
    function step(dir) {
      const idxs = imageIndexes();
      if (!idxs.length) return;
      let pos = idxs.indexOf(currentIndex);
      pos = (pos + dir + idxs.length) % idxs.length;
      openLightbox(idxs[pos]);
    }

    if (lb) {
      lb.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
      lb.querySelector(".lightbox-prev").addEventListener("click", () => step(-1));
      lb.querySelector(".lightbox-next").addEventListener("click", () => step(1));
      lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
      document.addEventListener("keydown", (e) => {
        if (!lb.classList.contains("is-open")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      });
    }

    loadPhotos();
  })();

  (function contactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const status = document.getElementById("form-status");
    const endpoint = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.formEndpoint) || "";

    function setStatus(msg, type) {
      status.textContent = msg;
      status.className = "form-status is-visible " + type;
    }
    function validateField(field) {
      const group = field.closest(".form-group");
      const error = group.querySelector(".form-error");
      let valid = true, msg = "";
      if (field.hasAttribute("required") && !field.value.trim()) { valid = false; msg = "This field is required."; }
      else if (field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        valid = false; msg = "Enter a valid email address.";
      }
      group.classList.toggle("has-error", !valid);
      if (error) { error.textContent = msg; error.classList.toggle("is-visible", !valid); }
      return valid;
    }

    form.querySelectorAll("input, textarea").forEach((f) => {
      f.addEventListener("blur", () => validateField(f));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fields = Array.from(form.querySelectorAll("input, textarea"));
      const allValid = fields.map(validateField).every(Boolean);
      if (!allValid) { setStatus("Please fix the highlighted fields.", "error"); return; }

      if (!endpoint) {
        setStatus("Direct form submission isn't connected yet. Please reach out via Instagram, TikTok or your GB Ski profile below.", "info");
        return;
      }

      const submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        if (!res.ok) throw new Error("Request failed");
        setStatus("Message sent — thanks for getting in touch.", "success");
        form.reset();
      } catch (err) {
        setStatus("Something went wrong sending your message. Please try again or use a social channel below.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send message";
      }
    });
  })();

  (function renderSocials() {
    const targets = document.querySelectorAll("[data-socials]");
    if (!targets.length || typeof SITE_CONFIG === "undefined") return;
    const html = SITE_CONFIG.socials.map((s) => (
      '<a href="' + s.href + '" target="_blank" rel="noopener noreferrer">' + s.label + '<span>' + s.handle + '</span></a>'
    )).join("");
    targets.forEach((t) => (t.innerHTML = html));
    document.querySelectorAll("[data-gb-ski]").forEach((a) => (a.href = SITE_CONFIG.gbSkiProfile));
  })();

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }
})();
