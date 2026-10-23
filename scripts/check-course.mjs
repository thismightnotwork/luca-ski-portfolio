// Regression test for the slalom rail course layout (course.js).
//
// Run: node scripts/check-course.mjs
//
// Guards the geometry of every combination, with a specific focus on the
// blue-red-blue flush cluster: three nearly collinear, overlapping poles
// generated as if each were an independent gate. The generator intends a
// FLUSH, i.e. three coordinated vertical gates (two same-colour poles and
// a throat each), laid out as one unit with entry and exit gates, and the
// racing line routed through each throat in race order. The test fails if
// that structure ever regresses to independent overlapping poles, if the
// line stops matching the gate sequence, or if the static no-JS path in
// index.html drifts from the generated one.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SlalomCourse = require(join(root, "course.js"));

let failures = 0;
function check(label, ok, detail) {
  if (ok) {
    console.log("  ok   " + label);
  } else {
    failures++;
    console.log("  FAIL " + label + (detail ? " -- " + detail : ""));
  }
}
function section(name) {
  console.log("\n" + name);
}

// ---------------------------------------------------------------- build
section("whole course validates");
const course = SlalomCourse.build();
check("no layout or line issues", course.issues.length === 0,
  course.issues.slice(0, 5).join(" | "));

const features = course.features;
const kinds = features.map((f) => f.kind);
check("all four combinations present",
  kinds.includes("open") && kinds.includes("delay") &&
  kinds.includes("hairpin") && kinds.includes("flush"),
  kinds.join(","));

// ------------------------------------------------- the flush regression
section("blue-red-blue flush cluster (regression)");
const flush = features.find((f) => f.kind === "flush");
check("flush exists", !!flush);

if (flush) {
  // What the generator intends: three vertical gates, blue-red-blue.
  check("flush is three coordinated gates", flush.gates.length === 3);
  check("flush colours run blue, red, blue",
    JSON.stringify(flush.colors) === JSON.stringify(["blue", "red", "blue"]),
    JSON.stringify(flush.colors));

  // Each constituent gate is a vertical gate: two same-colour poles with
  // a throat the line passes through, never a lone pole.
  const gatesOk = flush.gates.every((g) =>
    g.kind === "vertical" &&
    g.poles.length === 2 &&
    g.poles[0].color === g.poles[1].color &&
    g.poles[0].x === g.poles[1].x &&
    g.poles[1].y1 - g.poles[0].y2 >= 17);
  check("every flush gate is a two-pole vertical gate with a throat", gatesOk);

  // The old bug: three single poles nearly collinear (x 38, 46, 38) with
  // pairwise overlapping y spans. Assert the shape is gone: no three poles
  // in a narrow x band while overlapping, and any overlapping pair stands
  // laterally clear of each other.
  const poles = flush.gates.flatMap((g) => g.poles);
  check("flush has six poles, not three singles", poles.length === 6,
    String(poles.length));

  let collinearOverlap = false;
  let touchingPair = false;
  for (let i = 0; i < poles.length; i++) {
    for (let j = i + 1; j < poles.length; j++) {
      const a = poles[i], b = poles[j];
      const yOverlap = a.y2 > b.y1 && b.y2 > a.y1;
      const dx = Math.abs(a.x - b.x);
      if (yOverlap && dx < 12) touchingPair = true;
    }
  }
  for (let i = 0; i < poles.length; i++) {
    for (let j = i + 1; j < poles.length; j++) {
      for (let k = j + 1; k < poles.length; k++) {
        const trio = [poles[i], poles[j], poles[k]];
        const band = Math.max(...trio.map((p) => p.x)) -
                     Math.min(...trio.map((p) => p.x));
        // nearly collinear: all three within a narrow column of the rail
        if (band < 16 &&
            trio.every((p, u) => trio.every((q, v) =>
              u === v || (p.y2 > q.y1 && q.y2 > p.y1)))) {
          collinearOverlap = true;
        }
      }
    }
  }
  check("no three poles nearly collinear with overlapping spans",
    !collinearOverlap);
  check("no overlapping poles standing within 12 units of each other",
    !touchingPair);

  // Gates alternate sides so the poles of consecutive gates can overlap
  // in y without ever colliding, and the race order runs downhill.
  const xs = flush.gates.map((g) => g.x);
  check("flush gates alternate across the hill", xs[0] !== xs[1] &&
    xs[1] !== xs[2] && xs[0] === xs[2], xs.join(","));
  const order = flush.gates.every((g, i) =>
    i === 0 || g.yTop > flush.gates[i - 1].yTop);
  check("flush gates run in race order down the hill", order);

  // Entry and exit gates: the complete combination must clear the gates
  // immediately before and after it (hairpin's last gate, turning pole).
  const idx = features.indexOf(flush);
  const entryPole = features[idx - 1].gates.slice(-1)[0].poles.slice(-1)[0];
  const exitPole = features[idx + 1].gates[0].poles[0];
  const firstPole = flush.gates[0].poles[0];
  const lastPole = flush.gates.slice(-1)[0].poles.slice(-1)[0];
  const gap = (a, b) => (Math.abs(a.x - b.x) >= 12)
    ? Math.min(Math.abs(b.y1 - a.y2), Math.abs(a.y1 - b.y2))
    : b.y1 - a.y2;
  check("entry gate clears the flush", gap(entryPole, firstPole) >= 12,
    String(gap(entryPole, firstPole)));
  check("exit gate clears the flush", gap(lastPole, exitPole) >= 12,
    String(gap(lastPole, exitPole)));

  // Routing: the line is derived from this gate sequence. It must pass
  // through all three throats, in order, and never cut a pole.
  const samples = course.samples;
  const crossingsAt = SlalomCourse.crossingsAt;
  let lastY = -1;
  flush.gates.forEach((g) => {
    const cr = crossingsAt(samples, g.x)
      .filter((y) => y > g.throatTop && y < g.throatBottom);
    check("line passes gate at y" + g.yTop + " through its throat",
      cr.length === 1, "found " + cr.length);
    if (cr.length === 1) {
      check("...in race order", cr[0] > lastY);
      lastY = cr[0];
    }
    g.poles.forEach((p) => {
      const inside = crossingsAt(samples, p.x)
        .filter((y) => y > p.y1 && y < p.y2);
      check("line never cuts the pole at y" + p.y1, inside.length === 0);
    });
  });
}

// ------------------------------------------------- delay and hairpin too
section("delay and hairpin are coordinated units");
const delay = features.find((f) => f.kind === "delay");
check("delay is one vertical gate with a throat",
  delay && delay.gates.length === 1 && delay.gates[0].kind === "vertical" &&
  delay.gates[0].poles.length === 2 &&
  delay.gates[0].poles[1].y1 - delay.gates[0].poles[0].y2 >= 17);

const hairpin = features.find((f) => f.kind === "hairpin");
check("hairpin is two coordinated vertical gates",
  hairpin && hairpin.gates.length === 2 &&
  hairpin.gates.every((g) => g.kind === "vertical" && g.poles.length === 2));
if (hairpin) {
  const hpPoles = hairpin.gates.flatMap((g) => g.poles);
  let bad = false;
  for (let i = 0; i < hpPoles.length; i++) {
    for (let j = i + 1; j < hpPoles.length; j++) {
      const a = hpPoles[i], b = hpPoles[j];
      if (a.y2 > b.y1 && b.y2 > a.y1 && Math.abs(a.x - b.x) < 12) bad = true;
    }
  }
  check("hairpin poles never collide", !bad);
}

// ------------------------------------------------------- open gates
section("open gates");
features.filter((f) => f.kind === "open").forEach((f) => {
  const g = f.gates[0];
  check("two poles across the hill at y" + g.passage.y,
    g.poles.length === 2 && g.poles[0].y1 === g.poles[1].y1 &&
    Math.abs(g.poles[0].x - 50) === Math.abs(g.poles[1].x - 50));
});

// ------------------------------------------- static fallback in sync
section("index.html no-JS fallback");
const html = readFileSync(join(root, "index.html"), "utf8");
const m = html.match(/class="course-path"[^>]*\sd="([^"]+)"/s) ||
          html.match(/<path class="course-path" fill="none"\s+d="([^"]+)"/);
check("static path found", !!m);
if (m) {
  check("static path matches the generated one",
    m[1].trim() === course.pathD.trim(),
    "regenerate the d attribute from course.js build().pathD");
}
check("course.js loaded before app.js",
  html.indexOf('src="course.js"') < html.indexOf('src="app.js"') &&
  html.indexOf('src="course.js"') !== -1);

console.log(failures ? "\n" + failures + " FAILED" : "\nALL OK");
process.exit(failures ? 1 : 0);
