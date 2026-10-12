import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Confetti — a black & white burst fired from both bottom corners and the
// top centre. Paper strips, squares and dots tumble, flutter and fall, then
// it removes itself. Mount it (with a new `key`) to fire again.
// Skipped entirely for visitors who prefer reduced motion.
// ---------------------------------------------------------------------------

const SHADES = ["#ffffff", "#ffffff", "#e6e6e6", "#bdbdbd", "#8c8c8c", "#5a5a5a"];
const DURATION = 4200;

function makeParticles(w, h) {
  const parts = [];
  const cannon = (x, y, angle, spread, count, speed) => {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const v = speed * (0.55 + Math.random() * 0.6);
      parts.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.35,
        flip: Math.random() * Math.PI * 2,
        vflip: 0.08 + Math.random() * 0.18,
        size: 5 + Math.random() * 7,
        shape: Math.random() < 0.55 ? "strip" : Math.random() < 0.6 ? "square" : "dot",
        color: SHADES[(Math.random() * SHADES.length) | 0],
        drag: 0.985 + Math.random() * 0.01,
      });
    }
  };
  const s = Math.max(w, h) / 900;
  cannon(0, h, -Math.PI / 3, 0.6, 70, 22 * s);
  cannon(w, h, (-2 * Math.PI) / 3, 0.6, 70, 22 * s);
  cannon(w / 2, -20, Math.PI / 2, 2.2, 60, 6 * s);
  return parts;
}

export default function Confetti({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone?.();
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const parts = makeParticles(w, h);
    const gravity = 0.32 * (h / 800);
    const start = performance.now();
    let raf = 0;

    const frame = (now) => {
      const t = now - start;
      const fade = t > DURATION - 900 ? Math.max(0, (DURATION - t) / 900) : 1;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + gravity;
        p.x += p.vx + Math.sin(p.flip) * 0.6; // flutter
        p.y += p.vy;
        p.rot += p.vr;
        p.flip += p.vflip;
        if (p.y > h + 30) continue;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.flip)); // paper turning over
        ctx.fillStyle = p.color;
        if (p.shape === "strip") ctx.fillRect(-p.size / 2, -p.size * 0.2, p.size, p.size * 0.4);
        else if (p.shape === "square") ctx.fillRect(-p.size / 3, -p.size / 3, (p.size * 2) / 3, (p.size * 2) / 3);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (t < DURATION) raf = requestAnimationFrame(frame);
      else onDone?.();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="confetti" aria-hidden="true" />;
}
