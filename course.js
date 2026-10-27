/* course.js: single source of truth for the slalom rail.
 * Simple straight corridor with 15 turning gates.
 * Racing line passes at the gate level (pole top y).
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SlalomCourse = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VB_W = 100;
  var VB_H = 900;

  var R = {
    poleH: 24,
    leftX: 36,
    rightX: 64,
    centreX: 50,
    gateSpacing: 50,
    open1Y: 100,
    open2Y: 836,
    startY: 30,
    endY: 868,
    clearDesk: 0.7,
    clearMob: -0.2,
  };

  /* 15 turning gates - x positions for each gate:
   *  1: left (36)   - open gate L
   *  2: right (64)  - open gate R
   *  3: left (36)   - open gate L
   *  4: right (64)  - hairpin gate 1 (right)
   *  5: right (64)  - hairpin gate 2 (right)
   *  6: left (36)   - open gate L
   *  7: right (64)  - open gate R
   *  8: left (36)   - flush gate 1 (left)
   *  9: left (36)   - flush gate 2 (left)
   * 10: left (36)   - flush gate 3 (left)
   * 11: right (64)  - delay entry (right)
   * 12: centre (50) - delay gate (centre-left)
   * 13: left (36)   - delay exit (left)
   * 14: right (64)  - gate 14
   * 15: left (36)   - gate 15 (finish)
   */
  var COURSE = [
    { kind: "turn", color: "red",   x: 36, y: 100 },
    { kind: "turn", color: "blue",  x: 64, y: 155 },
    { kind: "turn", color: "red",   x: 36, y: 210 },
    { kind: "turn", color: "blue",  x: 64, y: 265 },
    { kind: "turn", color: "red",   x: 64, y: 320 },
    { kind: "turn", color: "blue",  x: 36, y: 375 },
    { kind: "turn", color: "red",   x: 64, y: 430 },
    { kind: "turn", color: "blue",  x: 36, y: 485 },
    { kind: "turn", color: "red",   x: 36, y: 540 },
    { kind: "turn", color: "blue",  x: 36, y: 595 },
    { kind: "turn", color: "red",   x: 64, y: 650 },
    { kind: "turn", color: "blue",  x: 50, y: 705 },
    { kind: "turn", color: "red",   x: 36, y: 760 },
    { kind: "turn", color: "blue",  x: 64, y: 805 },
    { kind: "turn", color: "red",   x: 36, y: 836 },
  ];

  function pole(x, yTop, color) {
    return { x: x, y1: yTop, y2: yTop + R.poleH, color: color };
  }

  function turnGate(x, y, color) {
    return {
      kind: "turn",
      color: color,
      x: x,
      y: y,
      yTop: y,
      yBottom: y + R.poleH,
      poles: [pole(x, y, color)],
      passage: { x: x, y: y }
    };
  }

  function layoutCourse(course) {
    var features = [];
    for (var i = 0; i < course.length; i++) {
      var g = course[i];
      features.push({ kind: "turn", color: g.color, gates: [turnGate(g.x, g.y, g.color)] });
    }
    return features;
  }

  function allGates(features) {
    var out = [];
    features.forEach(function (f) {
      f.gates.forEach(function (g) { out.push(g); });
    });
    return out;
  }

  function buildWaypoints(features) {
    var pts = [];
    pts.push({ x: 50, y: R.startY, role: "start" });
    features.forEach(function (f) {
      var g = f.gates[0];
      // Racing line passes at the gate level (pole top y)
      pts.push({ x: g.x, y: g.y, role: "throat" });
    });
    pts.push({ x: 50, y: R.endY, role: "end" });
    return pts;
  }

  function smoothPath(pts) {
    var d = "M " + f2(pts[0].x) + " " + f2(pts[0].y);
    var n = pts.length;
    for (var i = 0; i < n - 1; i++) {
      var p0 = pts[i > 0 ? i - 1 : 0];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2 < n ? i + 2 : n - 1];
      var c1x = p1.x + (p2.x - p0.x) / 6;
      var c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6;
      var c2y = p2.y - (p3.y - p1.y) / 6;
      d += " C " + f2(c1x) + " " + f2(c1y) + ", " + f2(c2x) + " " + f2(c2y) +
           ", " + f2(p2.x) + " " + f2(p2.y);
    }
    return d;
  }

  function f2(v) { return Math.round(v * 100) / 100; }

  function samplePath(pts, perSeg) {
    var out = [];
    var n = pts.length;
    for (var i = 0; i < n - 1; i++) {
      var p0 = pts[i > 0 ? i - 1 : 0];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2 < n ? i + 2 : n - 1];
      var c1x = p1.x + (p2.x - p0.x) / 6;
      var c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6;
      var c2y = p2.y - (p3.y - p1.y) / 6;
      for (var s = 0; s <= perSeg; s++) {
        if (i > 0 && s === 0) continue;
        var t = s / perSeg;
        var mt = 1 - t;
        var x = mt * mt * mt * p1.x + 3 * mt * mt * t * c1x +
                3 * mt * t * t * c2x + t * t * t * p2.x;
        var y = mt * mt * mt * p1.y + 3 * mt * mt * t * c1y +
                3 * mt * t * t * c2y + t * t * t * p2.y;
        out.push({ x: x, y: y });
      }
    }
    return out;
  }

  function crossingsAt(samples, x) {
    var eps = 1e-9;
    var out = [];
    for (var i = 1; i < samples.length; i++) {
      var a = samples[i - 1], b = samples[i];
      var za = a.x - x, zb = b.x - x;
      if (za * zb < 0) {
        out.push(a.y + (zb === 0 ? 0 : (x - a.x) / (b.x - a.x)) * (b.y - a.y));
      } else if (Math.abs(za) <= eps && Math.abs(zb) > eps) {
        out.push(a.y);
      } else if (Math.abs(zb) <= eps && Math.abs(za) > eps) {
        out.push(b.y);
      }
    }
    var uniq = [];
    out.sort(function (p, q) { return p - q; });
    out.forEach(function (y) {
      if (!uniq.length || y - uniq[uniq.length - 1] > 1e-6) uniq.push(y);
    });
    return uniq;
  }

  function distToPole(sx, sy, p) {
    var dy = sy < p.y1 ? p.y1 - sy : (sy > p.y2 ? sy - p.y2 : 0);
    var dx = sx - p.x;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function validateLayout(features, issues) {
    var gates = allGates(features);
    gates.forEach(function (g) {
      g.poles.forEach(function (p) {
        if (p.y2 <= p.y1) issues.push("pole inverted at y" + p.y1);
        if (p.y1 < 0 || p.y2 > VB_H) issues.push("pole outside the rail at y" + p.y1);
        if (p.x < 4 || p.x > 96) issues.push("pole outside the rail at x" + p.x);
      });
    });
  }

  function build(course) {
    var c = course || COURSE;
    var issues = [];
    var features = layoutCourse(c);
    var gates = allGates(features);
    var waypoints = buildWaypoints(features);
    var pathD = smoothPath(waypoints);
    var samples = samplePath(waypoints, 24);
    return {
      features: features,
      gates: gates,
      waypoints: waypoints,
      pathD: pathD,
      samples: samples,
      issues: issues
    };
  }

  return {
    VB_W: VB_W,
    VB_H: VB_H,
    R: R,
    COURSE: COURSE,
    layoutCourse: layoutCourse,
    buildWaypoints: buildWaypoints,
    smoothPath: smoothPath,
    samplePath: samplePath,
    crossingsAt: crossingsAt,
    build: build
  };
});
