/* Redesigned portfolio behaviour */
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
      setTimeout(() => el.remove(), 700);
    };
    if (reduceMotion) { finish(); return; }
    const tick = () => {
      progress = Math.min(100, progress + Math.random() * 16 + 8);
      if (bar) bar.style.width = progress + "%";
      if (progress >= 100) { finish(); return; }
      setTimeout(tick, 80);
    };
    tick();
    setTimeout(finish, 2200);
    window.addEventListener("load", () => setTimeout(finish, 300));
  })();

  (function nav() {
    const navEl = document.querySelector(".nav");
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector(".mobile-menu");
    const overlay = document.querySelector(".menu-overlay");
    const links = document.querySelectorAll(".mobile-menu a, .nav-links a");

    const onScroll = () => {
      if (window.scrollY > 32) navEl.classList.add("is-scrolled");
      else navEl.classList.remove("is-scrolled");
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function openMenu() {
      menu.classList.add("is-open");
      overlay.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeMenu() {
      menu.classList.remove("is-open");
      overlay.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
    if (toggle) toggle.addEventListener("click", () => toggle.getAttribute("aria-expanded") === "true" ? closeMenu() : openMenu());
    if (overlay) overlay.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
    links.forEach((a) => a.addEventListener("click", closeMenu));
  })();

  (function progress() {
    const fill = document.querySelector(".progress-bar-fill");
    if (!fill) return;
    const update = () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      fill.style.transform = "scaleX(" + Math.min(100, Math.max(0, scrolled)) / 100 + ")";
    };
    document.addEventListener("scroll", update, { passive: true });
    update();
  })();

  (function year() {
    const el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  })();

  (function backToTop() {
    const btn = document.querySelector(".back-to-top");
    if (!btn) return;
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
  })();

  (function reveal() {
    if (reduceMotion) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in-view"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("is-in-view"), i * 60);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
  })();

  (function populate() {
    if (typeof SEASON_STATS !== "undefined" && Array.isArray(SEASON_STATS)) {
      const grid = document.getElementById("season-stats");
      if (grid) {
        grid.innerHTML = "";
        SEASON_STATS.forEach((s) => {
          const card = document.createElement("div");
          card.className = "stat-card";
          card.innerHTML = "<strong>" + escapeHtml(s.value) + "</strong><span>" + escapeHtml(s.label) + "</span>";
          grid.appendChild(card);
        });
      }
    }
    if (typeof EQUIPMENT !== "undefined" && Array.isArray(EQUIPMENT)) {
      const grid = document.getElementById("equipment-grid");
      if (grid) {
        grid.innerHTML = "";
        EQUIPMENT.forEach((e) => {
          const div = document.createElement("div");
          div.innerHTML = "<b>" + escapeHtml(e.part) + "</b><span>" + escapeHtml(e.brand) + "</span>";
          grid.appendChild(div);
        });
      }
    }
    if (typeof JOURNEY !== "undefined" && Array.isArray(JOURNEY)) {
      const list = document.getElementById("journey-timeline");
      if (list) {
        list.innerHTML = "";
        JOURNEY.forEach((j) => {
          const item = document.createElement("li");
          item.className = "timeline-item";
          const cat = String(j.category || "").toLowerCase();
          if (cat === "racing") item.dataset.cat = "racing";
          else if (cat === "training") item.dataset.cat = "training";
          else if (cat === "instruction") item.dataset.cat = "instruction";
          else item.dataset.cat = cat;
          item.innerHTML = '<div class="timeline-marker"></div><div class="timeline-content"><span class="timeline-date">' + escapeHtml(j.date) + '</span><h3>' + escapeHtml(j.title) + '</h3><span class="timeline-tag">' + escapeHtml(j.category || "") + '</span><p>' + escapeHtml(j.description) + '</p></div>';
          list.appendChild(item);
        });
      }
    }
    if (typeof SITE_CONFIG !== "undefined") {
      const socials = document.querySelector("[data-socials]");
      if (socials && Array.isArray(SITE_CONFIG.socials)) {
        socials.innerHTML = "";
        SITE_CONFIG.socials.forEach((s) => {
          const a = document.createElement("a");
          a.href = s.href;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.innerHTML = "<span>" + escapeHtml(s.label) + "</span><span>" + escapeHtml(s.handle) + "</span>";
          socials.appendChild(a);
        });
      }
      const gb = document.querySelector("[data-gb-ski]");
      if (gb && SITE_CONFIG.gbSkiProfile) {
        gb.href = SITE_CONFIG.gbSkiProfile;
      }
    }
  })();

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  (function resultsToggle() {
    const btn = document.getElementById("results-toggle");
    const list = document.getElementById("results-list");
    if (!btn || !list) return;
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      list.classList.toggle("is-open", !open);
    });
  })();

  (function loadResults() {
    const tbody = document.querySelector(".results-table tbody");
    if (!tbody) return;
    const url = "data/gbski.json?cache=" + Date.now();
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const races = Array.isArray(data.races) ? data.races : [];
        if (!races.length) {
          const tr = document.createElement("tr");
          tr.innerHTML = '<td colspan="6"><div class="results-state"><strong>No results available</strong><span>Check back soon.</span></div></td>';
          tbody.appendChild(tr);
          return;
        }
        races.forEach((race) => {
          const tr = document.createElement("tr");
          const place = race.place || "-";
          const event = race.event || "";
          const venue = race.venue || "";
          const discipline = race.discipline || race.type || "";
          const date = race.date || "";
          const cat = race.category || race.class || "";
          const times = race.times || race.time || "";
          tr.innerHTML = '<td class="result-place">' + escapeHtml(place) + '</td>' +
            '<td class="result-event"><strong>' + escapeHtml(event) + '</strong><span>' + escapeHtml(venue) + '</span></td>' +
            '<td><span class="discipline-tag ' + escapeHtml(discipline) + '">' + escapeHtml(discipline || "-") + '</span></td>' +
            '<td>' + escapeHtml(date) + '</td>' +
            '<td>' + escapeHtml(cat) + '</td>' +
            '<td class="result-times">' + escapeHtml(times) + '</td>';
          tbody.appendChild(tr);
        });
      })
      .catch(() => {
        const tr = document.createElement("tr");
        tr.innerHTML = '<td colspan="6"><div class="results-state is-error"><strong>Unable to load results</strong><span>Results are sourced from GBSki.</span></div></td>';
        tbody.appendChild(tr);
      });
  })();

  (function gallery() {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;
    const lightbox = document.getElementById("lightbox");
    const lbImg = lightbox.querySelector("img");
    const lbCap = lightbox.querySelector("#lb-cap") || lightbox.querySelector(".lightbox-caption");
    const lbClose = lightbox.querySelector("#lb-close") || lightbox.querySelector(".lightbox-close");
    const lbPrev = lightbox.querySelector("#lb-prev") || lightbox.querySelector(".lightbox-prev");
    const lbNext = lightbox.querySelector("#lb-next") || lightbox.querySelector(".lightbox-next");
    let items = [];
    let idx = 0;
    let lastTrigger = null;

    function open(i, trigger) {
      idx = i;
      lastTrigger = trigger || null;
      const it = items[idx];
      lbImg.src = it.src;
      lbImg.alt = it.alt || it.name || "";
      if (lbCap) lbCap.textContent = it.alt || it.name || "";
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
      if (lbClose) lbClose.focus();
    }
    function close() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      lbImg.src = "";
      if (lbImg) lbImg.removeAttribute("src");
      if (lastTrigger) { lastTrigger.focus(); lastTrigger = null; }
    }
    function nav(dir) {
      idx = (idx + dir + items.length) % items.length;
      const it = items[idx];
      lbImg.src = it.src;
      lbImg.alt = it.alt || it.name || "";
      if (lbCap) lbCap.textContent = it.alt || it.name || "";
    }
    if (lbClose) lbClose.addEventListener("click", close);
    if (lbPrev) lbPrev.addEventListener("click", () => nav(-1));
    if (lbNext) lbNext.addEventListener("click", () => nav(1));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") nav(-1);
      if (e.key === "ArrowRight") nav(1);
    });

    function load(src) {
      fetch(src + "?cache=" + Date.now(), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          const raw = Array.isArray(data)
            ? data
            : (data && Array.isArray(data.photos) ? data.photos : []);
          if (raw.length) {
            items = raw.map((entry) => {
              const file = typeof entry === "string" ? entry : (entry.file || entry.name || "");
              const srcPath = typeof entry === "object" && entry.src ? entry.src : "photos/" + file;
              const src = "photos/" + encodeURIComponent(String(srcPath).replace(/^photos\//, "")).replace(/%2F/g, "/");
              const alt = typeof entry === "object" && (entry.caption || entry.alt) ? (entry.caption || entry.alt) : file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
              return { src: src, name: file, alt: alt };
            });
            render();
            return;
          }
          throw new Error();
        })
        .catch(() => showError());
    }

    function render() {
      grid.innerHTML = "";
      items.forEach((it, i) => {
        const fig = document.createElement("figure");
        const btn = document.createElement("button");
        btn.className = "gallery-tile";
        btn.setAttribute("aria-label", it.alt ? "View photo: " + it.alt : "View photo");
        btn.innerHTML = '<div class="gallery-skeleton"></div><img data-src="' + escapeAttr(it.src) + '" alt="' + escapeAttr(it.alt) + '" loading="lazy">';
        btn.addEventListener("click", () => open(i, btn));
        const cap = document.createElement("figcaption");
        cap.textContent = it.alt;
        fig.appendChild(btn);
        fig.appendChild(cap);
        grid.appendChild(fig);
      });
      lazy();
    }

    function lazy() {
      const imgs = grid.querySelectorAll("img[data-src]");
      if (!("IntersectionObserver" in window)) {
        imgs.forEach((img) => { img.src = img.dataset.src; img.removeAttribute("data-src"); img.previousElementSibling?.remove(); });
        return;
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            img.addEventListener("load", () => img.previousElementSibling?.remove(), { once: true });
            io.unobserve(img);
          }
        });
      }, { rootMargin: "200px" });
      imgs.forEach((img) => io.observe(img));
    }

    function showError() {
      grid.innerHTML = '<div class="gallery-error"><strong>Gallery unavailable</strong><p>Photos could not be loaded. Please try again later.</p></div>';
    }

    load("photos/manifest.json");
  })();

  (function form() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const legacyStatus = document.getElementById("form-status");
    const status = legacyStatus || document.getElementById("form-msg");
    const tailwindMode = !legacyStatus && !!status;
    const endpoint = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.formEndpoint) ? SITE_CONFIG.formEndpoint : "";

    function showStatus(msg, kind) {
      if (!status) return;
      if (tailwindMode) {
        const palette = kind === "error"
          ? "border-red-500/40 bg-red-500/10 text-white/90"
          : kind === "success"
            ? "border-white/15 bg-white/5 text-white/90"
            : "border-white/15";
        status.className = "p-4 border text-sm " + palette;
        status.innerHTML = msg;
      } else {
        const cls = kind === "error" ? "form-status is-visible error"
          : kind === "success" ? "form-status is-visible success"
            : "form-status is-visible info";
        status.className = cls;
        status.innerHTML = msg;
      }
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      form.querySelectorAll("[data-err]").forEach((err) => { err.classList.add("hidden"); err.textContent = ""; });
      form.querySelectorAll("[aria-invalid]").forEach((i) => i.removeAttribute("aria-invalid"));
      form.querySelectorAll(".form-group").forEach((g) => g.classList.remove("has-error"));
      form.querySelectorAll(".form-error").forEach((err) => { err.classList.remove("is-visible"); err.textContent = ""; });
      if (tailwindMode && status) { status.classList.add("hidden"); status.textContent = ""; }
      else if (status) { status.className = "form-status"; status.textContent = ""; }

      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const message = (data.get("message") || "").toString().trim();
      const gotcha = (data.get("_gotcha") || "").toString();
      let valid = true;
      if (!name) { showErr("name", "Please enter your name"); valid = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr("email", "Please enter a valid email"); valid = false; }
      if (message.length < 10) { showErr("message", "Please enter a message (at least 10 characters)"); valid = false; }
      if (!valid) return;

      if (!endpoint) {
        showStatus("Direct sending isn't configured yet. Email <a href=\"mailto:contact@lucafinnisbernard.co.uk\" class=\"underline underline-offset-2\">contact@lucafinnisbernard.co.uk</a> or reach out via social media.", "info");
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.innerHTML = "<span>Sending...</span>"; }

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: data
        });
        const payload = await res.json().catch(() => ({}));
        if (res.ok && (payload.ok !== false)) {
          form.reset();
          showStatus('Message sent successfully. I\'ll get back to you soon.');
        } else {
          showStatus((payload.errors && payload.errors[0] && payload.errors[0].message) || "Something went wrong. Please email <a href=\"mailto:contact@lucafinnisbernard.co.uk\" class=\"underline underline-offset-2\">contact@lucafinnisbernard.co.uk</a> instead.", "error");
        }
      } catch {
        showStatus("Something went wrong. Please email <a href=\"mailto:contact@lucafinnisbernard.co.uk\" class=\"underline underline-offset-2\">contact@lucafinnisbernard.co.uk</a> instead.", "error");
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = "<span>Send message</span>"; }
      }
    });

    function showErr(id, msg) {
      const input = document.getElementById(id);
      if (!input) return;
      const group = input.closest(".form-group");
      const err = group && group.querySelector(".form-error")
        ? group.querySelector(".form-error")
        : form.querySelector('[data-err="' + id + '"]');
      if (group && group.classList) group.classList.add("has-error");
      if (err) {
        err.textContent = msg;
        err.classList.remove("hidden");
        err.classList.add("is-visible");
      }
      input.setAttribute("aria-invalid", "true");
    }
  })();

  (function slalomRail() {
    const svg = document.querySelector(".slalom-rail svg");
    if (!svg) return;
    const marker = svg.querySelector(".marker");
    const path = svg.querySelector(".course-path");
    const gateLayer = svg.querySelector(".gate-layer");
    if (!marker || !path) return;
    if (typeof SlalomCourse === "undefined") return;

    try {
      const course = SlalomCourse.getCourse();
      const gates = course.gates || [];
      gateLayer.innerHTML = "";
      gates.forEach((g) => {
        if (g.kind === "turn" && Array.isArray(g.poles)) {
          g.poles.forEach((p) => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", p.x);
            line.setAttribute("y1", p.y1);
            line.setAttribute("x2", p.x);
            line.setAttribute("y2", p.y2);
            line.setAttribute("class", "gate " + (p.color || "red"));
            gateLayer.appendChild(line);
          });
        }
      });
    } catch (e) {}

    const pathLength = path.getTotalLength ? path.getTotalLength() : 0;
    function update() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      const pt = path.getPointAtLength(pathLength * p);
      marker.setAttribute("transform", "translate(" + pt.x + "," + pt.y + ") rotate(" + (Math.atan2(pt.y, pt.x) * 180 / Math.PI) + ")");
    }
    document.addEventListener("scroll", update, { passive: true });
    update();
  })();
})();
