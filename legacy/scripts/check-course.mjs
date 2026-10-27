// Regression test for the simple slalom rail course (turning gates only).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SlalomCourse = require(join(root, "course.js"));

let failures = 0;
function check(label, ok, detail) {
  if (ok) console.log("  ok   " + label);
  else { failures++; console.log("  FAIL " + label + (detail ? " -- " + detail : "")); }
}
function section(name) { console.log("\n" + name); }

section("whole course validates");
const course = SlalomCourse.build();
check("no layout or line issues", course.issues.length === 0, course.issues.slice(0, 5).join(" | "));

const features = course.features;
const kinds = features.map((f) => f.kind);
check("all gates are turning gates", kinds.every((k) => k === "turn"), kinds.join(","));
check("exactly 15 gates", features.length === 15);

section("gate sequence verification");
const expectedX = [36, 64, 36, 64, 64, 36, 64, 36, 36, 36, 64, 50, 36, 64, 36];
features.forEach((f, i) => {
  check("gate " + (i+1) + " at x=" + expectedX[i], f.gates[0].x === expectedX[i]);
});

section("gate colors verification");
const expectedColors = ["red", "blue", "red", "blue", "red", "blue", "red", "blue", "red", "blue", "red", "blue", "red", "blue", "red"];
features.forEach((f, i) => {
  check("gate " + (i+1) + " color=" + expectedColors[i], f.gates[0].color === expectedColors[i]);
});

section("index.html no-JS fallback");
const html = readFileSync(join(root, "index.html"), "utf8");
const m = html.match(/class="course-path"[^>]*\sd="([^"]+)"/s) ||
          html.match(/<path class="course-path" fill="none"\s+d="([^"]+)"/);
check("static path found", !!m);
if (m) {
  const course = SlalomCourse.build();
  check("static path matches the generated one", m[1].trim() === course.pathD.trim(),
    "regenerate the d attribute from course.js build().pathD");
}
check("course.js loaded before app.js",
  html.indexOf('src="course.js"') < html.indexOf('src="app.js"') &&
  html.indexOf('src="course.js"') !== -1);

console.log(failures ? "\n" + failures + " FAILED" : "\nALL OK");
process.exit(failures ? 1 : 0);
