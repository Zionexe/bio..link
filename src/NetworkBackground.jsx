import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// NetworkBackground — full-screen "plexus" of drifting points joined by thin
// lines when they're close. Interactive:
//   • move the mouse (or drag a finger): nearby points get pushed aside so
//     the web bends around the cursor, and the cursor links to them
//   • click / tap: a shockwave throws points outward with a ripple ring
// Points have depth (near ones are bigger, brighter and faster), and the
// whole field drifts slightly against the pointer for parallax.
// Pauses when the tab is hidden. With "reduce motion" turned on (e.g. Windows
// animation effects off) it drifts slower and skips the click shockwave.
// ---------------------------------------------------------------------------

const SETTINGS = {
  color: "255, 255, 255", // r, g, b of points and lines
  density: 9000,          // one point per this many px² of screen
  minPoints: 40,
  maxPoints: 170,
  linkDistance: 150,      // px — points closer than this get a line
  lineAlpha: 0.8,
  starShare: 0.22,        // share of points drawn as glowing, twinkling stars
  flare: 1,               // brightness of the light that follows the cursor (0 = off)
  mouseRadius: 190,       // px — reach of the cursor
  mousePush: 0.9,         // how hard the cursor shoves points
  clickPush: 9,           // shockwave strength
  speed: 0.22,            // drift speed
};

// `accent` ("r, g, b" or null) tints the stars, the cursor light and the
// cursor's lines — set by the seasonal theme (themes.js).
export default function NetworkBackground({ accent = null, accent2 = null }) {
  const canvasRef = useRef(null);
  const accentRef = useRef(accent);
  const accent2Ref = useRef(accent2);
  useEffect(() => { accentRef.current = accent; accent2Ref.current = accent2; }, [accent, accent2]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const S = SETTINGS;

    let w = 0, h = 0, dpr = 1;
    let points = [];
    let raf = 0;
    const mouse = { x: 0, y: 0, active: false, px: 0, py: 0 }; // px/py: smoothed parallax
    let ripples = [];

    const makePoint = () => {
      const z = 0.35 + Math.random() * 0.65; // depth: 1 = near
      const a = Math.random() * Math.PI * 2;
      const v = S.speed * (reduce ? 0.35 : 1) * (0.4 + Math.random()) * z;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        z,
        bvx: Math.cos(a) * v, // base drift
        bvy: Math.sin(a) * v,
        vx: 0,
        vy: 0,
        star: Math.random() < S.starShare,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.6 + Math.random() * 1.6,
      };
    };

    // Soft glow, drawn once per colour and stamped for stars and the cursor
    // flare. The core stays white-hot; the halo takes the theme colour.
    const sprites = new Map();
    const spriteFor = (color) => {
      if (sprites.has(color)) return sprites.get(color);
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = 128;
      const sc = sprite.getContext("2d");
      const g = sc.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, `rgba(${S.color}, 1)`);
      g.addColorStop(0.18, `rgba(${color}, 0.6)`);
      g.addColorStop(0.45, `rgba(${color}, 0.14)`);
      g.addColorStop(1, `rgba(${color}, 0)`);
      sc.fillStyle = g;
      sc.fillRect(0, 0, 128, 128);
      sprites.set(color, sprite);
      return sprite;
    };
    // Line colours for a theme: its two accents, each mixed 45% with white.
    const lineColorCache = new Map();
    const lineColors = () => {
      const a = accentRef.current;
      if (!a) return null;
      const key = `${a}|${accent2Ref.current}`;
      if (!lineColorCache.has(key)) {
        const mix = (rgb) => rgb.split(",").map((v) => Math.round(Number(v) * 0.55 + 255 * 0.45)).join(", ");
        lineColorCache.set(key, [mix(a), mix(accent2Ref.current || a)]);
      }
      return lineColorCache.get(key);
    };
    const glowAt = (x, y, r, alpha, color) => {
      ctx.globalAlpha = alpha;
      ctx.drawImage(spriteFor(color || accentRef.current || S.color), x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.max(S.minPoints, Math.min(S.maxPoints, Math.round((w * h) / S.density)));
      while (points.length < target) points.push(makePoint());
      points.length = target;
      for (const p of points) {
        if (p.x > w) p.x = Math.random() * w;
        if (p.y > h) p.y = Math.random() * h;
      }
    };

    const step = () => {
      const R = S.mouseRadius;
      for (const p of points) {
        // Cursor pushes points out of a soft bubble.
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / R) * S.mousePush * p.z;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        // Shockwaves.
        for (const r of ripples) {
          const dx = p.x - r.x;
          const dy = p.y - r.y;
          const d = Math.hypot(dx, dy) || 1;
          const band = Math.abs(d - r.radius);
          if (band < 40) {
            const f = (1 - band / 40) * S.clickPush * r.strength * p.z * 0.12;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        // Extra velocity eases off; base drift keeps going.
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.bvx + p.vx;
        p.y += p.bvy + p.vy;
        // Wrap around the edges (with margin so lines don't pop).
        const m = 40;
        if (p.x < -m) p.x = w + m;
        else if (p.x > w + m) p.x = -m;
        if (p.y < -m) p.y = h + m;
        else if (p.y > h + m) p.y = -m;
      }
      for (const r of ripples) {
        r.radius += 7;
        r.strength *= 0.96;
      }
      ripples = ripples.filter((r) => r.strength > 0.05 && r.radius < Math.max(w, h));
      // Parallax eases toward the pointer.
      const tx = mouse.active ? (mouse.x / w - 0.5) : 0;
      const ty = mouse.active ? (mouse.y / h - 0.5) : 0;
      mouse.px += (tx - mouse.px) * 0.04;
      mouse.py += (ty - mouse.py) * 0.04;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const D = S.linkDistance;
      const D2 = D * D;
      const R = S.mouseRadius;
      // Parallax offset per point: near points move more.
      const ox = (p) => -mouse.px * 30 * p.z;
      const oy = (p) => -mouse.py * 22 * p.z;

      // Lines between nearby points (theme colours alternate, if any).
      ctx.lineCap = "round";
      const themed = lineColors();
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const ax = a.x + ox(a), ay = a.y + oy(a);
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const bx = b.x + ox(b), by = b.y + oy(b);
          const dx = ax - bx, dy = ay - by;
          const d2 = dx * dx + dy * dy;
          if (d2 > D2) continue;
          const t = 1 - Math.sqrt(d2) / D;
          const depth = (a.z + b.z) / 2;
          ctx.strokeStyle = `rgba(${themed ? themed[(i + j) & 1] : S.color}, ${(Math.pow(t, 1.6) * S.lineAlpha * (0.45 + depth * 0.55)).toFixed(3)})`;
          ctx.lineWidth = 0.4 + depth * 0.9 * t;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }

      // Cursor links + glow.
      if (mouse.active) {
        for (const p of points) {
          const x = p.x + ox(p), y = p.y + oy(p);
          const d = Math.hypot(x - mouse.x, y - mouse.y);
          if (d > R * 1.15) continue;
          const t = 1 - d / (R * 1.15);
          ctx.strokeStyle = `rgba(${accentRef.current || S.color}, ${(t * 0.9).toFixed(3)})`;
          ctx.lineWidth = 0.5 + t;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        // The flare: wide soft bloom + bright core.
        if (S.flare > 0) {
          glowAt(mouse.x, mouse.y, R * 0.9, 0.22 * S.flare);
          glowAt(mouse.x, mouse.y, 34, 0.55 * S.flare);
        }
      }

      // Points — stars twinkle and carry a soft halo.
      const time = performance.now() / 1000;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const x = p.x + ox(p), y = p.y + oy(p);
        let glow = 0;
        if (mouse.active) {
          const d = Math.hypot(x - mouse.x, y - mouse.y);
          if (d < R) glow = 1 - d / R;
        }
        const starColor = i % 2 ? accent2Ref.current || accentRef.current : accentRef.current;
        const tw = p.star ? 0.65 + 0.35 * Math.sin(time * p.twinkle + p.phase) : 1;
        if (p.star || glow > 0.25) {
          glowAt(x, y, (p.star ? 7 + p.z * 7 : 6) + glow * 8, (p.star ? 0.55 * tw : 0) + glow * 0.5, p.star ? starColor : null);
        }
        ctx.fillStyle = `rgba(${p.star && starColor ? starColor : S.color}, ${Math.min(1, (0.45 + p.z * 0.5) * tw + glow * 0.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.6 + p.z * (p.star ? 1.8 : 1.2) + glow * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ripple rings.
      for (const r of ripples) {
        ctx.strokeStyle = `rgba(${S.color}, ${(r.strength * 0.35).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const loop = () => {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onDown = (e) => {
      onMove(e);
      if (reduce) return;
      ripples.push({ x: e.clientX, y: e.clientY, radius: 0, strength: 1 });
      if (ripples.length > 4) ripples.shift();
    };
    const onLeave = () => { mouse.active = false; };
    const onUp = (e) => { if (e.pointerType !== "mouse") mouse.active = false; };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onResize = () => resize();

    resize();
    // Settle the field a little so the first frame already looks woven.
    for (let i = 0; i < 30; i++) step();
    start();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="network-bg" aria-hidden="true" />;
}
