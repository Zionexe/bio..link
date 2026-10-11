import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Cursor — a white dot that sits on the pointer and a ring that trails it.
// Both use mix-blend-mode: difference, so they invert whatever is under
// them (black over white, white over black). The ring swells over anything
// clickable and tightens on press. Mouse/trackpad only.
// ---------------------------------------------------------------------------
const INTERACTIVE = "a, button, input, textarea, [role='button'], .pf-clickable";
// Buttons that lean toward the cursor.
const MAGNETIC = ".vn-btn, .contact-btn, .contact-opt, .gb-send, .vn-back, .icon-link, .page-tab";

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dot = dotRef.current;
    const ring = ringRef.current;
    document.documentElement.classList.add("has-cursor");

    let x = -100, y = -100, rx = -100, ry = -100;
    let raf = 0;
    let shown = false;
    let magnet = null;

    const releaseMagnet = () => {
      if (magnet) magnet.style.translate = "";
      magnet = null;
    };

    const loop = () => {
      const k = reduce ? 1 : 0.2;
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(loop) : 0;
    };

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        rx = x;
        ry = y;
        dot.classList.add("is-visible");
        ring.classList.add("is-visible");
      }
      const hot = e.target instanceof Element && e.target.closest(INTERACTIVE);
      ring.classList.toggle("is-hover", !!hot);

      const m = !reduce && e.target instanceof Element ? e.target.closest(MAGNETIC) : null;
      if (m !== magnet) releaseMagnet();
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        const tab = m.classList.contains("page-tab");
        const pull = tab ? 0.12 : 0.22;
        const max = tab ? 4 : 9; // px — wide buttons shouldn't wander far
        const clamp = (v) => Math.max(-max, Math.min(max, v));
        const dx = clamp((x - (r.left + r.width / 2)) * pull);
        const dy = clamp((y - (r.top + r.height / 2)) * pull);
        m.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onDown = () => ring.classList.add("is-down");
    const onUp = () => ring.classList.remove("is-down");
    const onLeave = () => {
      shown = false;
      releaseMagnet();
      dot.classList.remove("is-visible");
      ring.classList.remove("is-visible");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      releaseMagnet();
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true"><span /></div>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true"><span /></div>
    </>
  );
}
