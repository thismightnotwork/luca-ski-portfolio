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
 *   hairpin     two vertical gates on the right (alternating x=58,64)
 *   flush       three vertical gates on the left (alternating x=42,36,42)
 *   delay3      three-gate delay: entry (right), delay (centre-left), exit turn (left)
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

  var R = {
    poleH: 23,
    throat: 17,
    openHalf: 20,
    rightX1: 58,
    rightX2: 64,
    leftX1: 42,
    leftX2: 36,
    delayEntryX: 62,
    delayGateX: 44,
    delayExitX: 34,
    verticalGateH: 63,
    comboPitch: 75,
    bulge: 22,
    delayBulge: 18,
    turnBulge: 22,
    open1Y: 100,
    open2Y: 836,
    startY: 30,
    endY: 868,
    gaps: { open: 12, hairpin: 12, flush: 12, delay3: 12, turn: 12 },
    returnMargin: 12,
    flushReturnMargin: 11,  // Gate 2 return at y=568 (557+11)
    delayReturnMargin: 18,
    clearDesk: 0.7,
    clearMob: -0.2,
    maxSlope: 10.0,
    slopeJump: 10.0,
  };

  var COURSE = [
    { kind: "open", color: "red" },
    { kind: "open", color: "blue" },
    { kind: "open", color: "red" },
    { kind: "hairpin", colors: ["blue", "red"] },
    { kind: "open", color: "blue" },
    { kind: "open", color: "red" },
    { kind: "flush", colors: ["blue", "red", "blue"] },
    { kind: "delay3", colors: ["red", "blue", "red"] },
    { kind: "open", color: "blue" },
    { kind: "open", color: "red" }
  ];

  function pole(x, yTop, color) {
    return { x: x, y1: yTop, y2: yTop + R.poleH, color: color };
  }

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

  function sameSideCombo(side, yTop, colors) {
    var gates = [];
    var isRight = (side === "right");
    var x1 = isRight ? R.rightX1 : R.leftX1;
    var x2 = isRight ? R.rightX2 : R.leftX2;

    for (var k = 0; k < colors.length; k++) {
      var x = (k % 2 === 0) ? x1 : x2;
      var gateTop = yTop + k * R.comboPitch;
      gates.push(verticalGate(x, gateTop, colors[k]));
    }

    return {
      kind: "combo",
      side: side,
      colors: colors,
      x: x1,
      yTop: yTop,
      yBottom: yTop + (colors.length - 1) * R.comboPitch + R.verticalGateH,
      gates: gates
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

  function delay3Combo(yTop) {
    var h = R.poleH;
    var t = R.throat;
    var gates = [];

    var g1Top = yTop;
    gates.push({
      kind: "vertical",
      x: R.delayEntryX,
      color: "red",
      yTop: g1Top,
      yBottom: g1Top + 2 * h + t,
      poles: [pole(R.delayEntryX, g1Top, "red"), pole(R.delayEntryX, g1Top + h + t, "red")],
      throatTop: g1Top + h,
      throatBottom: g1Top + h + t
    });

    var g2Top = yTop;
    gates.push({
      kind: "vertical",
      x: R.delayGateX,
      color: "blue",
      yTop: g2Top,
      yBottom: g2Top + 2 * h + t,
      poles: [pole(R.delayGateX, g2Top, "blue"), pole(R.delayGateX, g2Top + h + t, "blue")],
      throatTop: g2Top + h,
      throatBottom: g2Top + h + t
    });

    var g3Top = yTop + R.verticalGateH + 12;
    gates.push({
      kind: "turn",
      x: R.delayExitX,
      color: "red",
      yTop: g3Top,
      yBottom: g3Top + h,
      poles: [pole(R.delayExitX, g3Top, "red")]
    });

    return {
      kind: "delay3",
      colors: ["red", "blue", "red"],
      gates: gates,
      yTop: yTop,
      yBottom: g3Top + h
    };
  }

  function layoutCourse(course) {
    var features = [];
    var y = R.open1Y - R.poleH / 2;
    var i, f, gates, x, k, combo;

    var openCentres = {
      1: R.open1Y,
      2: 135,
      3: 170,
      4: 360,
      5: 395,
      6: 772,
      7: R.open2Y
    };

    var hairpinTop = 196;
    var flushTop = 419;
    var delay3Top = 650;

    for (i = 0; i < course.length; i++) {
      f = course[i];
      if (i > 0) {
        var prevKind = course[i - 1].kind;
        y += R.gaps[prevKind] || 12;
      }

      if (f.kind === "open") {
        var openCount = features.filter(function (ft) { return ft.kind === "open"; }).length + 1;
        var centre = openCentres[openCount] || R.open2Y;
        features.push({ kind: "open", color: f.color, gates: [openGate(centre, f.color)] });
        y = centre + R.poleH / 2;

      } else if (f.kind === "hairpin" || f.kind === "flush") {
        var comboTop = (f.kind === "hairpin") ? hairpinTop : flushTop;
        combo = sameSideCombo(f.side || ((f.kind === "hairpin") ? "right" : "left"), comboTop, f.colors);
        features.push({ kind: f.kind, colors: f.colors, side: f.side, gates: combo.gates, x: combo.x, yTop: comboTop, yBottom: combo.yBottom });
        y = combo.yBottom;

      } else if (f.kind === "delay3") {
        combo = delay3Combo(delay3Top);
        features.push(combo);
        y = combo.yBottom;
      }
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
    var i, f, g, side, apex, mid, k;

    pts.push({ x: 50, y: R.startY, role: "start" });

    for (i = 0; i < features.length; i++) {
      f = features[i];

      if (f.kind === "open") {
        g = f.gates[0];
        pts.push({ x: 50, y: g.passage.y, role: "open" });

      } else if (f.kind === "hairpin") {
        var approachSide = -1;

        for (k = 0; k < f.gates.length; k++) {
          g = f.gates[k];
          var p1 = g.poles[0];
          var p2 = g.poles[1];
          var throatY = (g.throatTop + g.throatBottom) / 2;

          if (k === 0) {
            var apexX = g.x + approachSide * R.bulge;
            pts.push({ x: apexX, y: p1.y1 + R.poleH * 0.45, role: "apex" });
          }
          pts.push({ x: g.x, y: throatY, role: "throat" });
          pts.push({ x: g.x + R.bulge, y: p2.y1 + R.poleH / 2, role: "apex" });

          if (k < f.gates.length - 1) {
            pts.push({ x: g.x, y: p2.y2 + R.returnMargin, role: "return" });
          }
        }
        var lastGate = f.gates[f.gates.length - 1];
        var lastPole = lastGate.poles[1];
        pts.push({ x: lastGate.x, y: lastPole.y2 + 10, role: "return" });

      } else if (f.kind === "flush") {
        var approachSide = +1;

        for (k = 0; k < f.gates.length; k++) {
          g = f.gates[k];
          var p1 = g.poles[0];
          var p2 = g.poles[1];
          var throatY = (g.throatTop + g.throatBottom) / 2;

          if (k === 0) {
            var apexX = g.x + approachSide * R.bulge;
            pts.push({ x: apexX, y: p1.y1 + R.poleH * 0.45, role: "apex" });
          }
          // NO explicit wrap-above waypoint - natural geometry with flushReturnMargin=11 handles it
          pts.push({ x: g.x, y: throatY, role: "throat" });
          pts.push({ x: g.x - R.bulge, y: p2.y1 + R.poleH / 2, role: "apex" });

          if (k < f.gates.length - 1) {
            pts.push({ x: g.x, y: p2.y2 + R.flushReturnMargin, role: "return" });
          }
        }
        var lastGate = f.gates[f.gates.length - 1];
        var lastPole = lastGate.poles[1];
        pts.push({ x: lastGate.x, y: lastPole.y2 + R.flushReturnMargin, role: "return" });

      } else if (f.kind === "delay3") {
        var g11 = f.gates[0];
        pts.push({ x: R.delayEntryX - R.delayBulge, y: g11.poles[0].y1 + R.poleH * 0.45, role: "apex" });
        pts.push({ x: R.delayEntryX, y: (g11.throatTop + g11.throatBottom) / 2, role: "throat" });
        pts.push({ x: R.delayEntryX + R.delayBulge, y: g11.poles[1].y1 + R.poleH / 2, role: "apex" });
        pts.push({ x: R.delayEntryX, y: g11.poles[1].y2 + R.delayReturnMargin, role: "return" });

        var g12 = f.gates[1];
        pts.push({ x: R.delayGateX + R.bulge, y: g12.poles[0].y1 + R.poleH * 0.45, role: "apex" });
        pts.push({ x: R.delayGateX, y: (g12.throatTop + g12.throatBottom) / 2, role: "throat" });
        pts.push({ x: R.delayGateX - R.bulge, y: g12.poles[1].y1 + R.poleH / 2, role: "apex" });
        pts.push({ x: R.delayGateX, y: g12.poles[1].y2 + R.delayReturnMargin, role: "return" });

        var g13 = f.gates[2];
        var mid = g13.poles[0].y1 + R.poleH / 2;
        pts.push({ x: R.delayExitX + R.turnBulge, y: mid, role: "apex" });
        var baseY = g13.poles[0].y2;
        pts.push({ x: 40, y: baseY + 6, role: "return" });
        pts.push({ x: 46, y: baseY + 14, role: "return" });
        pts.push({ x: R.delayExitX, y: baseY + R.delayReturnMargin, role: "return" });

      } else if (f.kind === "turn") {
        g = f.gates[0];
        mid = g.poles[0].y1 + R.poleH / 2;
        pts.push({ x: R.turnX - R.turnBulge, y: mid, role: "apex" });
        pts.push({ x: R.turnX, y: g.poles[0].y2 + R.returnMargin, role: "return" });
      }
    }

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
    var i, j, a, b;

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
        if (throat < 17) issues.push("throat too narrow (" + f2(throat) + ")");
      }
      if (g.kind === "open" && g.poles.length !== 2) issues.push("open gate needs two poles");
    });

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

    var openCount = 0;
    features.forEach(function (f) {
      if (f.kind === "open") {
        openCount++;
        var want;
        if (openCount === 1) want = R.open1Y;
        else if (openCount === 7) want = R.open2Y;
        else return;
        if (Math.abs(f.gates[0].passage.y - want) > 0.01) {
          issues.push("finish gate off its mark");
        }
      }
    });
    if (openCount !== 7) issues.push("course needs 7 open gates");
  }

  function checkGap(gateA, gateB, label, issues) {
    var MIN_GAP = 12;
    gateA.poles.forEach(function (pa) {
      gateB.poles.forEach(function (pb) {
        var dx = Math.abs(pa.x - pb.x);
        if (dx >= 12) return;
        var gap = pb.y1 - pa.y2;
        if (gap < MIN_GAP) {
          issues.push(label + " gap " + f2(gap) + " at y" + pa.y2);
        }
      });
    });
  }

  function validateLine(features, gates, samples, issues) {
    var i;

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
          if (g.kind === "open") return;
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
