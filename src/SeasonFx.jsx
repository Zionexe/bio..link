import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// SeasonFx — everything a seasonal theme (themes.js) adds on screen:
//   • particles  — snow, leaves, bats, hearts, confetti… falling or rising
//                  behind the cards; the mouse pushes them aside
//   • fx         — "fireworks" (launch on their own + burst wherever you
//                  click) or "lightning" (random strikes with a sky flash)
//   • trail      — emoji sprinkled behind the mouse (drawn above the cards)
// Renders nothing for the default theme.
// ---------------------------------------------------------------------------

const PUSH_RADIUS = 130;

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Emoji are drawn once onto small canvases and stamped (much faster than
// fillText every frame).
const spriteCache = new Map();
function emojiSprite(glyph) {
  if (spriteCache.has(glyph)) return spriteCache.get(glyph);
  const c = document.createElement("canvas");
  c.width = c.height = 72;
  const x = c.getContext("2d");
  x.font = '56px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(glyph, 36, 40);
  spriteCache.set(glyph, c);
  return c;
}

function sizeCanvas(canvas, w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
}

export default function SeasonFx({ theme }) {
  const backRef = useRef(null);
  const trailRef = useRef(null);
  const groups = theme?.particles || [];
  const fx = theme?.fx || null;
  const trail = theme?.trail || [];
  const active = groups.length > 0 || Boolean(fx) || trail.length > 0;

  useEffect(() => {
    if (!active) return;
    const back = backRef.current;
    const top = trailRef.current;
    const ctx = back.getContext("2d");
    const tctx = top.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const slow = reduce ? 0.5 : 1;
    const palette = [theme.accent, theme.accent2 || theme.accent, "255, 255, 255"].filter(Boolean);
    let w = 0, h = 0, raf = 0;
    let parts = [];
    const mouse = { x: -9999, y: -9999 };

    // ── Falling particles ────────────────────────────────────────────────
    const spawn = (g, anywhere) => {
      const speed = rand(g.speed[0], g.speed[1]) * slow;
      const glyph = pick(g.glyphs);
      return {
        g,
        glyph,
        color: g.colors ? pick(g.colors) : "255, 255, 255",
        size: rand(g.size[0], g.size[1]),
        x: rand(0, w),
        y: anywhere ? rand(0, h) : speed < 0 ? h + 30 : -30,
        speed,
        phase: rand(0, Math.PI * 2),
        swayRate: rand(0.006, 0.018),
        rot: rand(0, Math.PI * 2),
        spin: g.spin ? rand(-0.03, 0.03) : 0,
        alpha: glyph === "dot" ? rand(0.35, 0.9) : rand(0.75, 1),
        vx: 0,
        vy: 0,
      };
    };

    const drawParticles = () => {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < PUSH_RADIUS * PUSH_RADIUS && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / PUSH_RADIUS) * 0.9;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= 0.93;
        p.vy *= 0.93;
        p.phase += p.swayRate;
        p.x += Math.sin(p.phase) * p.g.sway * 0.5 * slow + p.vx;
        p.y += p.speed + p.vy;
        p.rot += p.spin * slow;
        if (p.y > h + 40 || p.y < -40 || p.x < -60 || p.x > w + 60) {
          parts[i] = spawn(p.g, false);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        if (p.glyph === "dot") {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          g.addColorStop(0, `rgba(${p.color}, 1)`);
          g.addColorStop(1, `rgba(${p.color}, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.glyph === "confetti") {
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.phase * 3)); // flutter
          ctx.fillStyle = `rgb(${p.color})`;
          ctx.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 2.5);
        } else {
          ctx.rotate(p.spin ? p.rot : Math.sin(p.phase) * 0.25);
          ctx.drawImage(emojiSprite(p.glyph), -p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      }
    };

    // ── Fireworks ────────────────────────────────────────────────────────
    let rockets = [];
    let sparks = [];
    let nextLaunch = performance.now() + 600;
    const burst = (x, y, color) => {
      const n = Math.round(rand(60, 95));
      const c2 = pick(palette);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand(-0.05, 0.05);
        const sp = rand(1.4, 5.2) * slow;
        sparks.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          decay: rand(0.009, 0.017),
          color: Math.random() < 0.75 ? color : c2,
          size: rand(1.2, 2.4),
        });
      }
      if (sparks.length > 900) sparks = sparks.slice(-900);
    };
    const launch = () => {
      rockets.push({
        x: rand(w * 0.12, w * 0.88),
        y: h + 10,
        vx: rand(-0.6, 0.6),
        vy: -rand(9, 12.5) * Math.sqrt(h / 900) * slow,
        color: pick(palette),
        trail: [],
      });
    };
    const drawFireworks = (now) => {
      if (now > nextLaunch) {
        launch();
        if (Math.random() < 0.3) launch();
        nextLaunch = now + rand(900, 2200) / slow;
      }
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      rockets = rockets.filter((r) => {
        r.trail.push([r.x, r.y]);
        if (r.trail.length > 8) r.trail.shift();
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.16 * slow;
        ctx.strokeStyle = `rgba(${r.color}, 0.8)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        r.trail.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty)));
        ctx.lineTo(r.x, r.y);
        ctx.stroke();
        if (r.vy >= -1.2) {
          burst(r.x, r.y, r.color);
          return false;
        }
        return true;
      });
      sparks = sparks.filter((s) => {
        s.vx *= 0.985;
        s.vy = s.vy * 0.985 + 0.045 * slow;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;
        if (s.life <= 0) return false;
        ctx.fillStyle = `rgba(${s.color}, ${s.life.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (0.6 + s.life * 0.6), 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
      ctx.restore();
    };

    // ── Lightning ────────────────────────────────────────────────────────
    let flash = 0;
    let bolt = null; // { path: [[x,y]...], branches: [...], life }
    let nextStrike = performance.now() + rand(2500, 5000);
    const makeBolt = (x0, y0, len, spread) => {
      const path = [[x0, y0]];
      let x = x0, y = y0;
      while (y < y0 + len) {
        x += rand(-spread, spread);
        y += rand(10, 26);
        path.push([x, y]);
      }
      return path;
    };
    const strike = () => {
      const x0 = rand(w * 0.1, w * 0.9);
      const main = makeBolt(x0, -10, rand(h * 0.45, h * 0.8), 22);
      const branches = [];
      for (let i = 0; i < 3; i++) {
        const [bx, by] = pick(main.slice(2, -2));
        branches.push(makeBolt(bx, by, rand(60, 160), 16));
      }
      bolt = { path: main, branches, life: 1 };
      flash = 0.55;
      setTimeout(() => { flash = Math.max(flash, 0.35); }, 140); // double flicker
    };
    const strokePath = (path, width, alpha, color) => {
      ctx.strokeStyle = `rgba(${color}, ${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    };
    const drawLightning = (now) => {
      if (now > nextStrike) {
        strike();
        nextStrike = now + rand(6000, 13000);
      }
      if (flash > 0.01) {
        ctx.fillStyle = `rgba(${theme.accent2 || "255, 255, 255"}, ${(flash * 0.35).toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
        flash *= 0.86;
      }
      if (bolt) {
        ctx.save();
        ctx.lineJoin = "round";
        ctx.shadowColor = `rgba(${theme.accent2 || "255, 255, 255"}, 0.9)`;
        ctx.shadowBlur = 18;
        strokePath(bolt.path, 3.2, bolt.life * 0.9, "255, 255, 255");
        bolt.branches.forEach((b) => strokePath(b, 1.4, bolt.life * 0.6, "255, 255, 255"));
        ctx.restore();
        bolt.life -= 0.045;
        if (bolt.life <= 0) bolt = null;
      }
    };

    // ── Mouse trail (top canvas) ─────────────────────────────────────────
    let crumbs = [];
    let lastCrumb = 0;
    const drawTrail = () => {
      tctx.clearRect(0, 0, w, h);
      crumbs = crumbs.filter((c) => {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.02;
        c.rot += c.spin;
        c.life -= 0.022;
        if (c.life <= 0) return false;
        tctx.save();
        tctx.globalAlpha = c.life;
        tctx.translate(c.x, c.y);
        tctx.rotate(c.rot);
        const s = c.size * (0.5 + c.life * 0.5);
        tctx.drawImage(emojiSprite(c.glyph), -s / 2, -s / 2, s, s);
        tctx.restore();
        return true;
      });
    };

    // ── Loop & events ────────────────────────────────────────────────────
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      sizeCanvas(back, w, h);
      sizeCanvas(top, w, h);
      const scale = Math.max(0.35, (w * h) / (1920 * 1080));
      parts = [];
      for (const g of groups) {
        const n = Math.round(g.count * scale);
        for (let i = 0; i < n; i++) parts.push(spawn(g, true));
      }
    };

    const frame = (now) => {
      ctx.clearRect(0, 0, w, h);
      if (fx === "lightning") drawLightning(now);
      drawParticles();
      if (fx === "fireworks") drawFireworks(now);
      if (trail.length) drawTrail();
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!trail.length || e.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - lastCrumb < 45) return;
      lastCrumb = now;
      crumbs.push({
        glyph: pick(trail),
        x: e.clientX + rand(-6, 6),
        y: e.clientY + rand(-6, 6),
        vx: rand(-0.5, 0.5),
        vy: rand(-1.1, -0.2),
        rot: rand(-0.4, 0.4),
        spin: rand(-0.04, 0.04),
        size: rand(12, 18),
        life: 1,
      });
      if (crumbs.length > 40) crumbs.shift();
    };
    const onDown = (e) => {
      if (fx === "fireworks") burst(e.clientX, e.clientY, pick(palette));
    };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      raf = document.hidden ? 0 : requestAnimationFrame(frame);
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // Restart when the theme changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme?.id]);

  if (!active) return null;
  return (
    <>
      <canvas ref={backRef} className="season-fx" aria-hidden="true" />
      <canvas ref={trailRef} className="season-trail" aria-hidden="true" />
    </>
  );
}
