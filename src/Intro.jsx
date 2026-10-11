import { useEffect, useRef, useState } from "react";
import "./Intro.css";

// ---------------------------------------------------------------------------
// Intro — black screen, a counter runs 000 → 100 along a hairline while
// "zion" rises letter by letter out of a mask, then "click to enter".
//
// Clicking anywhere enters (and counts as the user gesture that lets the
// music start). The page mounts underneath immediately; this layer then
// lifts away like a curtain.
// ---------------------------------------------------------------------------

const Word = "Zion";
const LOAD_MS = 1600;

export default function Intro({ onEnter, onExited, leaving }) {
  const [progress, setProgress] = useState(0);
  const done = progress >= 100;
  const raf = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(100);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / LOAD_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onExited, 1300); // fallback if transitionend never fires
    return () => clearTimeout(t);
  }, [leaving, onExited]);

  const enter = () => {
    if (!leaving) onEnter();
  };

  return (
    <div
      className={`intro${done ? " is-done" : ""}${leaving ? " is-leaving" : ""}`}
      role="button"
      tabIndex={0}
      aria-label="Enter"
      onClick={enter}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          enter();
        }
      }}
      onTransitionEnd={(e) => {
        if (leaving && e.target === e.currentTarget && e.propertyName === "transform") onExited();
      }}
    >
      <div className="intro-stage">
        <h1 className="intro-word" aria-label={Word}>
          {Array.from(Word).map((ch, i) => (
            <span key={i} className="intro-mask" aria-hidden="true">
              <span className="intro-letter" style={{ animationDelay: `${(0.15 + i * 0.08).toFixed(2)}s` }}>
                {ch}
              </span>
            </span>
          ))}
        </h1>

        <div className="intro-load" aria-hidden="true">
          <span className="intro-bar">
            <span className="intro-bar-fill" style={{ transform: `scaleX(${progress / 100})` }} />
          </span>
          <span className="intro-count">{String(progress).padStart(3, "0")}</span>
        </div>
      </div>

      <span className="intro-cta-label">click anywhere to enter</span>
    </div>
  );
}
