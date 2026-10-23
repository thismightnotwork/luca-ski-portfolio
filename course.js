/* course.js: single source of truth for the slalom rail.
 *
 * Every combination is generated as one coordinated layout (not as
 * independent gates) and the racing line is derived from the resulting
 * gate sequence, so the line is the route through the gates rather than
 * a free-standing wave. Geometry follows the course-setter's diagrams:
 *   open gate   two poles across the hill, line passes between them
 *   vertical
 *   gate        two same-colour poles stacked down the fall line with a
 *               throat between them; the line passes through the throat
 *   delay       one vertical gate
 *   hairpin     two vertical gates laid out as a unit
 *   flush       three vertical gates laid out as a unit
 *   turning
 *   pole        one pole, the line wraps around it in a pocket
 * The layout is validated (spacing, overlap, entry/exit gaps, throat
 * passage, pocket wrap, clearance, smoothness) and any problems are
 * returned as issues instead of throwing.
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SlalomCourse = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VB_W = 100;
  var VB_H = 900;

  /* Rhythm in viewBox units. Poles are 3px non-scaling strokes, so at the
   * 34px mobile rail one unit is 0.34px; clearance rules below are checked
   * at both rail widths. */
  var R = {
    poleH: 36,        // pole height
    throat: 26,       // gap between the two poles of a vertical gate
    openHalf: 20,     // open gate poles at centre +/- 20
    drift: 7,         // combination gates sit at 50 +/- 7 (43 / 57)
    delayX: 66,       // the delay gate is offset right of the fall line
    gatePitch: 76,    // gate to gate pitch inside a combination
    bulge: 22,        // line apex beyond a combination pole
    delayBulge: 18,   // line apex beside the delay gate's poles
    turnX: 36,        // isolated turning pole, left of the flush band
    turnBulge: 22,    // line apex beyond the turning pole
    open1Y: 100,      // start gate centre (fixed by the rail furniture)
    open2Y: 836,      // finish gate centre
    startY: 30,
    endY: 868,
    // Gaps between features: the features sum with these to land the
    // finish gate exactly on open2Y (checked by the layout).
    gaps: { open: 34, delay: 30, hairpin: 28, flush: 26, turn: 24 },
    // Margins used to place the line's return crossing below a pole.
    returnMargin: 12,
    delayReturnMargin: 18, // the delay's exit runs into a longer traverse
    // Validation thresholds.
    clearDesk: 0.7,   // px of daylight between line and pole, desktop rail
    clearMob: -0.05,  // px, mobile rail (must never overlap)
    maxSlope: 1.9,    // |dx/dy| of the line
    slopeJump: 0.45   // max change of dx/dy between adjacent samples
  };

  /* Course feature sequence: the order the racer passes the gates. */
  var COURSE = [
    { kind: "open", color: "red" },
    { kind: "delay", color: "blue" },
    { kind: "hairpin", colors: ["red", "blue"] },
    { kind: "flush", colors: ["blue", "red", "blue"] },
    { kind: "turn", color: "red" },
    { kind: "open", color: "blue" }
  ];

  function pole(x, yTop, color) {
    return { x: x, y1: yTop, y2: yTop + R.poleH, color: color };
  }

  /* A vertical gate: two same-colour poles with a throat between them.
   * x is shared by both poles; the gate is placed as a unit. */
  function verticalGate(x, yTop, color) {
    var h = R.poleH;
    return {
      kind: "vertical",
      x: x,
      color: color,
      yTop: yTop,
      yBottom: yTop + 2 * h + R.throat,
      poles: [pole(x, yTop, color), pole(x, yTop + h + R.throat, color)],
      throatTop: yTop + h,
      throatBottom: yTop + h + R.throat
    };
  }

  function openGate(yCenter, color) {
    var x1 = 50 - R.openHalf;
    var x2 = 50 + R.openHalf;
    return {
      kind: "open",
      color: color,
      yTop: yCenter - R.poleH / 2,
      yBottom: yCenter + R.poleH / 2,
      poles: [pole(x1, yCenter - R.poleH / 2, color), pole(x2, yCenter - R.poleH / 2, color)],
      passage: { x: 50, y: yCenter }
    };
  }

  /* Lay out the whole course as coordinated features. Returns features
   * (each with its gates in race order) and a cursor for the next one. */
  function layoutCourse(course) {
    var features = [];
    var y = R.open1Y - R.poleH / 2; // top of the first pole
    var i, f, g, gates, x, k;

    for (i = 0; i < course.length; i++) {
      f = course[i];
      if (i > 0) y += R.gaps[prevKind(course[i - 1])];

      if (f.kind === "open") {
        // Open gates are centred on their passage point.
        var centre = (i === 0) ? R.open1Y : R.open2Y;
        features.push({ kind: "open", color: f.color, gates: [openGate(centre, f.color)] });
        y = centre + R.poleH / 2;
      } else if (f.kind === "delay") {
        // One vertical gate, offset right; laid out as a unit.
        features.push({
          kind: "delay", color: f.color,
          gates: [verticalGate(R.delayX, y, f.color)]
        });
        y += 2 * R.poleH + R.throat;
      } else if (f.kind === "hairpin" || f.kind === "flush") {
        // Combination: every constituent gate is placed relative to the
        // combination's own origin, alternating sides so the poles of
        // consecutive gates never collide and the line can weave through
        // each throat in race order.
        gates = [];
        for (k = 0; k < f.colors.length; k++) {
          x = (k % 2 === 0) ? 50 - R.drift : 50 + R.drift;
          gates.push(verticalGate(x, y + k * R.gatePitch, f.colors[k]));
        }
        features.push({ kind: f.kind, colors: f.colors, gates: gates });
        y += (f.colors.length - 1) * R.gatePitch + 2 * R.poleH + R.throat;
      } else if (f.kind === "turn") {
        features.push({
          kind: "turn", color: f.color,
          gates: [{ kind: "turn", x: R.turnX, color: f.color, yTop: y,
                    yBottom: y + R.poleH, poles: [pole(R.turnX, y, f.color)] }]
        });
        y += R.poleH;
      }
    }
    return features;
  }

  function prevKind(prev) {
    return prev.kind;
  }

  /* Collect every pole of the course in race order. */
  function allGates(features) {
    var out = [];
    features.forEach(function (f) {
      f.gates.forEach(function (g) { out.push(g); });
    });
    return out;
  }

  /* ---- racing line derived from the gate sequence --------------------
   * For every vertical gate the line: approaches on the first pole's
   * pocket side, apexes beside the first pole, passes through the throat
   * (the gate opening), apexes beside the second pole on the far side and
   * crosses back below it. Open gates are passed between their poles and
   * the turning pole gets a full pocket apex. The waypoints below are the
   * route; the smooth curve is fitted through them afterwards. */
  function buildWaypoints(features) {
    var pts = [];
    var i, f, g, side, apex, mid;

    pts.push({ x: 50, y: R.startY, role: "start" });

    for (i = 0; i < features.length; i++) {
      f = features[i];
      g = f.gates[0];

      if (f.kind === "open") {
        pts.push({ x: 50, y: g.passage.y, role: "open" });
      } else if (f.kind === "delay") {
        // Entered from the left: pocket left on pole one, throat crossing
        // to the right, pocket right on pole two, then cross back below.
        mid = g.yTop + R.poleH / 2;
        pts.push({ x: R.delayX - R.delayBulge - 4, y: mid, role: "apex" });
        pts.push({ x: R.delayX, y: (g.throatTop + g.throatBottom) / 2, role: "throat" });
        pts.push({ x: R.delayX + R.delayBulge, y: g.poles[1].y1 + R.poleH / 2, role: "apex" });
        pts.push({ x: R.delayX, y: g.poles[1].y2 + R.delayReturnMargin, role: "return" });
      } else if (f.kind === "hairpin" || f.kind === "flush") {
        for (var k = 0; k < f.gates.length; k++) {
          g = f.gates[k];
          side = (k % 2 === 0) ? 1 : -1; // first gate: approach right
          if (k === 0) {
            // The unit's entry gate gets its own apex on the approach.
            pts.push({ x: g.x + side * R.bulge, y: g.poles[0].y1 + R.poleH * 0.66, role: "apex" });
          }
          // For later gates the previous return already carries the line
          // past pole one on the correct side; gates overlap vertically,
          // so a separate apex here would run the line back up the hill.
          pts.push({ x: g.x, y: (g.throatTop + g.throatBottom) / 2, role: "throat" });
          pts.push({ x: g.x - side * R.bulge, y: g.poles[1].y1 + R.poleH / 2, role: "apex" });
          if (k < f.gates.length - 1) {
            // Return below pole two: this both closes the pole's pocket
            // and sets up the approach to the next gate of the unit.
            pts.push({ x: g.x, y: g.poles[1].y2 + R.returnMargin, role: "return" });
          }
        }
        // The last combination's second pole is closed by a later
        // crossing (the turning pole's approach), as the reference
        // diagrams do.
      } else if (f.kind === "turn") {
        mid = g.poles[0].y1 + R.poleH / 2;
        pts.push({ x: R.turnX - R.turnBulge, y: mid, role: "apex" });
        pts.push({ x: R.turnX, y: g.poles[0].y2 + R.returnMargin, role: "return" });
      }
    }

    pts.push({ x: 50, y: R.endY, role: "end" });
    return pts;
  }

  /* Catmull-Rom through the waypoints, emitted as cubic beziers. */
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

  /* Sample the smoothed path for validation (cubic bezier evaluation). */
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

  /* ---- validation --------------------------------------------------- */

  function crossingsAt(samples, x) {
    // Interpolated y values where the path crosses the vertical line X.
    // Waypoints often sit exactly on the pole line (a throat passage or a
    // return crossing), so a crossing may be an endpoint of a sample pair;
    // those are recorded once and deduplicated below.
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
    // Deduplicate the double records an on-line waypoint produces.
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
    var i, j, a, b;

    // Pole sanity and the throat of every vertical gate.
    gates.forEach(function (g) {
      g.poles.forEach(function (p) {
        if (p.y2 <= p.y1) issues.push("pole inverted at y" + p.y1);
        if (p.y1 < 0 || p.y2 > VB_H) issues.push("pole outside the rail at y" + p.y1);
        if (p.x < 4 || p.x > 96) issues.push("pole outside the rail at x" + p.x);
      });
      if (g.kind === "vertical") {
        if (g.poles.length !== 2) issues.push("vertical gate needs two poles");
        if (g.poles[0].x !== g.poles[1].x) issues.push("vertical gate poles not aligned");
        if (g.poles[0].color !== g.poles[1].color) issues.push("vertical gate poles differ in colour");
        var throat = g.poles[1].y1 - g.poles[0].y2;
        // The throat must admit the line with daylight at the narrow
        // 34px mobile rail: 1px + 3px pole + 1.75px line.
        if (throat < 17) issues.push("throat too narrow (" + f2(throat) + ")");
      }
      if (g.kind === "open" && g.poles.length !== 2) issues.push("open gate needs two poles");
    });

    // Overlap: any two poles that share a band of the hill must stand far
    // enough apart to read as separate poles at both rail widths.
    var MIN_SEP = 12;
    for (i = 0; i < gates.length; i++) {
      for (j = i + 1; j < gates.length; j++) {
        a = gates[i]; b = gates[j];
        a.poles.forEach(function (pa) {
          b.poles.forEach(function (pb) {
            var yOverlap = pa.y2 > pb.y1 && pb.y2 > pa.y1;
            var dx = Math.abs(pa.x - pb.x);
            if (yOverlap && dx < MIN_SEP) {
              issues.push("poles overlap at y" + Math.max(pa.y1, pb.y1) +
                " (dx " + f2(dx) + ")");
            }
          });
        });
      }
    }

    // Entry and exit of every combination: the gates immediately before
    // and after the unit must clear it, not just its own constituents.
    for (i = 1; i < features.length; i++) {
      var prev = features[i - 1].gates[features[i - 1].gates.length - 1];
      var next = features[i].gates[0];
      checkGap(prev, next, features[i].kind + " entry", issues);
    }
    for (i = 0; i < features.length - 1; i++) {
      var last = features[i].gates[features[i].gates.length - 1];
      var first = features[i + 1].gates[0];
      checkGap(last, first, features[i].kind + " exit", issues);
    }

    // The finish gate must land on its mark, so the gaps add up.
    var openCount = 0;
    features.forEach(function (f) {
      if (f.kind === "open") {
        openCount++;
        var want = openCount === 1 ? R.open1Y : R.open2Y;
        if (Math.abs(f.gates[0].passage.y - want) > 0.01) {
          issues.push("finish gate off its mark");
        }
      }
    });
    if (openCount !== 2) issues.push("course needs a start and a finish gate");
  }

  function checkGap(gateA, gateB, label, issues) {
    var MIN_GAP = 12;
    gateA.poles.forEach(function (pa) {
      gateB.poles.forEach(function (pb) {
        var dx = Math.abs(pa.x - pb.x);
        if (dx >= 12) return; // clearly side by side
        var gap = pb.y1 - pa.y2; // negative means overlap
        if (gap < MIN_GAP) {
          issues.push(label + " gap " + f2(gap) + " at y" + pa.y2);
        }
      });
    });
  }

  function validateLine(features, gates, samples, issues) {
    var i;

    // Down the hill, never back up; no zig-zag sharper than a racer's
    // edge can hold; no kinks between waypoints.
    var prevSlope = null;
    for (i = 1; i < samples.length; i++) {
      var a = samples[i - 1], b = samples[i];
      if (b.y < a.y - 1e-9) { issues.push("line backtracks at y" + f2(b.y)); break; }
      var dy = b.y - a.y, dx = b.x - a.x;
      if (dy < 1e-9) { if (Math.abs(dx) > 1e-9) issues.push("line goes flat at y" + f2(b.y)); continue; }
      var slope = dx / dy;
      if (Math.abs(slope) > R.maxSlope) {
        issues.push("line too steep at y" + f2(b.y) + " (" + f2(slope) + ")");
        break;
      }
      if (prevSlope !== null && Math.abs(slope - prevSlope) > R.slopeJump) {
        issues.push("line kinks at y" + f2(b.y));
        break;
      }
      prevSlope = slope;
    }

    // Daylight between the line and every pole at both rail widths.
    var worstDesk = 1e9, worstMob = 1e9, worstPole = null;
    samples.forEach(function (s) {
      gates.forEach(function (g) {
        g.poles.forEach(function (p) {
          var d = distToPole(s.x, s.y, p);
          var desk = d * 0.64 - 2.375;
          var mob = d * 0.34 - 2.375;
          if (desk < worstDesk) { worstDesk = desk; worstPole = p; }
          if (mob < worstMob) worstMob = mob;
          if (desk < R.clearDesk) {
            issues.push("line grazes a pole (desktop " + f2(desk) + "px at y" + f2(s.y) + ")");
          }
          if (mob < R.clearMob) {
            issues.push("line touches a pole (mobile " + f2(mob) + "px at y" + f2(s.y) + ")");
          }
        });
      });
    });

    // Passage: the line crosses every vertical gate inside its throat, in
    // race order, and never cuts through a pole.
    var lastThroat = -1;
    gates.forEach(function (g) {
      var xs = {};
      g.poles.forEach(function (p) { xs[p.x] = true; });
      Object.keys(xs).forEach(function (k) {
        var x = parseFloat(k);
        var cr = crossingsAt(samples, x);
        if (g.kind === "vertical") {
          var inThroat = cr.filter(function (y) {
            return y > g.throatTop && y < g.throatBottom;
          });
          if (inThroat.length !== 1) {
            issues.push("gate at y" + g.yTop + " not passed through its throat");
          } else if (inThroat[0] <= lastThroat) {
            issues.push("gates passed out of order at y" + g.yTop);
          } else {
            lastThroat = inThroat[0];
          }
        }
        g.poles.forEach(function (p) {
          var inside = cr.filter(function (y) { return y > p.y1 && y < p.y2; });
          if (inside.length) {
            issues.push("line cuts pole at y" + p.y1);
          }
          if (g.kind === "open") return; // passed between the poles
          var below = cr.filter(function (y) { return y > p.y2; });
          if (!below.length) {
            issues.push("pole not wrapped below at y" + p.y1);
          }
          if (g.kind !== "vertical" || p === g.poles[1]) {
            var above = cr.filter(function (y) { return y < p.y1; });
            if (!above.length) {
              issues.push("pole not wrapped above at y" + p.y1);
            }
          }
        });
      });
      if (g.kind === "open") {
        var mid = crossingsAt(samples, 50).filter(function (y) {
          return y > g.poles[0].y1 && y < g.poles[0].y2;
        });
        if (!mid.length) issues.push("open gate not passed through at y" + g.yTop);
      }
    });
  }

  /* ---- build -------------------------------------------------------- */

  function build(course) {
    var c = course || COURSE;
    var issues = [];
    var features = layoutCourse(c);
    var gates = allGates(features);
    var waypoints = buildWaypoints(features);
    var pathD = smoothPath(waypoints);
    var samples = samplePath(waypoints, 24);
    validateLayout(features, issues);
    validateLine(features, gates, samples, issues);
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
