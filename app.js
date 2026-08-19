/**
 * app.js — Behaviour for Luca Finnis-Bernard's portfolio.
 * Vanilla JS, no build step. Respects prefers-reduced-motion throughout.
 */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  (function preloader() {
    const el = document.querySelector(".preloader");
    const bar = document.querySelector(".preloader-bar");
    if (!el) return;
    let pct = 0;
    const finish = () => {
      el.classList.add("is-hidden");
      setTimeout(() => el.remove(), 500);
    };
    if (reduceMotion) { finish(); return; }
    const tick = () => {
      pct = Math.min(100, pct + Math.random() * 18 + 6);
      if (bar) bar.style.width = pct + "%";
      if (pct >= 100) { finish(); return; }
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
    }
    if (toggle) {
      toggle.addEventListener("click", () => {
        toggle.getAttribute("aria-expanded") === "true" ? closeMenu() : openMenu();
      });
    }
    if (overlay) overlay.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu && menu.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });
    links.forEach((a) => a.addEventListener("click", closeMenu));

    const sections = document.querySelectorAll("main section[id]");
    const navAnchors = document.querySelectorAll(".nav-links a, .mobile-menu a");
    if (sections.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              navAnchors.forEach((a) => {
                a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
              });
            }
          });
        },
        { rootMargin: "-45% 0px -45% 0px" }
      );
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
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
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
      const isMobile = window.innerWidth <= 900;
      const count = isMobile ? 6 : 12;
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
      // Fallback: reveal even if the load event is delayed or already fired.
      setTimeout(revealRail, 400);
    } else if (rail) {
      rail.classList.add("is-ready");
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    updateMarker();
  })();

  (function renderResults() {
    const list = document.getElementById("results-list");
    const summary = document.getElementById("results-toggle");
    if (!list || typeof RACE_RESULTS === "undefined") return;

    list.innerHTML = RACE_RESULTS.map((r) => (
      '<div class="result-row">' +
        '<span class="result-place">' + r.place + '</span>' +
        '<div><strong>' + r.event + '</strong><span>' + r.tier + ' · ' + r.venue + '</span></div>' +
        '<time datetime="' + r.date + '">' + r.display + '</time>' +
        '<span class="discipline-tag ' + r.discipline + '">' + r.discipline + '</span>' +
      '</div>'
    )).join("");

    if (summary) {
      summary.addEventListener("click", () => {
        const open = summary.getAttribute("aria-expanded") === "true";
        summary.setAttribute("aria-expanded", String(!open));
        list.classList.toggle("is-open", !open);
      });
    }
  })();

  (function renderStatsAndEquipment() {
    const statGrid = document.getElementById("season-stats");
    if (statGrid && typeof SEASON_STATS !== "undefined") {
      statGrid.innerHTML = SEASON_STATS.map((s) => (
        '<div class="stat-card"><strong>' + s.value + '</strong><span>' + s.label + '</span></div>'
      )).join("");
    }
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
    let items = [];

    function renderGrid() {
      if (!items.length) {
        grid.innerHTML = '<div class="gallery-tile"><div class="gallery-placeholder"><strong>Gallery loading…</strong></div></div>';
        return;
      }
      grid.innerHTML = items.map((item, i) => {
        if (item.type === "image") {
          return (
            '<button class="gallery-tile" data-index="' + i + '" aria-label="Open photo: ' + item.caption + '">' +
              '<img src="' + item.src + '" alt="' + item.caption + '" loading="lazy" width="640" height="800">' +
              '<figcaption>' + item.caption + '</figcaption>' +
            '</button>'
          );
        }
        return (
          '<div class="gallery-tile" aria-hidden="true">' +
            '<div class="gallery-placeholder"><strong>' + item.caption + '</strong><span>' + item.note + '</span></div>' +
          '</div>'
        );
      }).join("");

      grid.querySelectorAll("button.gallery-tile").forEach((btn) => {
        btn.addEventListener("click", () => openLightbox(Number(btn.dataset.index)));
      });
    }

    async function loadPhotos() {
      let real = [];
      try {
        const res = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/photos?ref=" + branch, {
          headers: { Accept: "application/vnd.github+json" }, cache: "no-store"
        });
        if (res.ok) {
          const files = await res.json();
          real = files
            .filter((f) => f.type === "file" && allowedExt.test(f.name))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((f) => ({
              type: "image",
              src: f.download_url,
              caption: "Luca Finnis-Bernard — " + f.name.replace(/[-_]/g, " ").replace(/\.[^.]+$/, "")
            }));
        }
      } catch (e) {
        console.warn("Gallery: could not load photos/ from GitHub, showing placeholders.", e);
      }
      const placeholders = (typeof GALLERY_PLACEHOLDERS !== "undefined" ? GALLERY_PLACEHOLDERS : [])
        .map((p) => ({ type: "placeholder", caption: p.caption, note: p.note }));
      items = real.length ? real.concat(placeholders.slice(0, Math.max(0, 6 - real.length))) : placeholders;
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
        if (e.key === "Tab") {
          const focusables = lb.querySelectorAll("button");
          const list = Array.from(focusables);
          const first = list[0], last = list[list.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
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
        setStatus(
          "Direct form submission isn't connected yet. Please reach out via Instagram, TikTok or Ski Connect below — this form will send automatically once a form endpoint is configured.",
          "info"
        );
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
    document.querySelectorAll("[data-ski-connect]").forEach((a) => (a.href = SITE_CONFIG.skiConnect));
  })();

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }
})();
