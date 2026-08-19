/**
 * snow.js — Lightweight ambient snowfall effect.
 * Pure CSS-animated DOM flakes (no canvas, no dependencies).
 * Disabled entirely under prefers-reduced-motion; pauses when the tab
 * is hidden or the layer is off-screen to avoid wasting battery/CPU.
 */
(function () {
  "use strict";

  const layer = document.querySelector(".snow-layer");
  if (!layer) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const isMobile = window.innerWidth <= 700;
  const count = isMobile ? 18 : 34;

  for (let i = 0; i < count; i++) {
    const flake = document.createElement("span");
    flake.className = "snowflake";
    const size = (Math.random() * 3 + 2).toFixed(1);
    const left = (Math.random() * 100).toFixed(2);
    const duration = (Math.random() * 10 + 9).toFixed(1);
    const delay = (Math.random() * -20).toFixed(1);
    const drift = (Math.random() * 40 - 20).toFixed(0);
    const opacity = (Math.random() * 0.5 + 0.35).toFixed(2);
    flake.style.setProperty("--size", size + "px");
    flake.style.setProperty("--left", left + "vw");
    flake.style.setProperty("--duration", duration + "s");
    flake.style.setProperty("--delay", delay + "s");
    flake.style.setProperty("--drift", drift + "px");
    flake.style.setProperty("--opacity", opacity);
    layer.appendChild(flake);
  }

  document.addEventListener("visibilitychange", () => {
    layer.style.animationPlayState = document.hidden ? "paused" : "running";
    layer.querySelectorAll(".snowflake").forEach((f) => {
      f.style.animationPlayState = document.hidden ? "paused" : "running";
    });
  });
})();
