import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// SplitText — one span per glyph so text can resolve in letter by letter on
// entry (see .split-char in App.css). Keys are by position, so changing the
// text (e.g. while scrambling) doesn't replay the entrance.
// ---------------------------------------------------------------------------
export function SplitText({ text, baseDelay = 0.16 }) {
  const chars = Array.from(text);
  const step = Math.min(0.035, 0.45 / Math.max(chars.length, 1));
  return (
    <span className="split-text">
      {chars.map((ch, i) => (
        <span
          key={i}
          className="split-char"
          aria-hidden="true"
          style={{ animationDelay: `${(baseDelay + i * step).toFixed(3)}s` }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// useScramble — on trigger, every letter flickers through random glyphs and
// locks back into place left to right, like a decoder.
// ---------------------------------------------------------------------------
const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@01";

export function useScramble(text, { duration = 520, fps = 30 } = {}) {
  const [display, setDisplay] = useState(text);
  const timer = useRef(0);

  useEffect(() => {
    setDisplay(text);
  }, [text]);

  useEffect(() => () => clearInterval(timer.current), []);

  const run = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clearInterval(timer.current);
    const chars = Array.from(text);
    const start = performance.now();
    timer.current = setInterval(() => {
      const t = (performance.now() - start) / duration;
      if (t >= 1) {
        clearInterval(timer.current);
        setDisplay(text);
        return;
      }
      const locked = Math.floor(t * chars.length);
      setDisplay(
        chars
          .map((c, i) => (i < locked || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("")
      );
    }, 1000 / fps);
  }, [text, duration, fps]);

  return [display, run];
}

// ---------------------------------------------------------------------------
// PageTitle — the big italic heading every page opens with. Resolves in on
// entry, scrambles when hovered.
// ---------------------------------------------------------------------------
export function PageTitle({ text }) {
  const [display, scramble] = useScramble(text);
  return (
    <h1 className="hero-name hover-glow" aria-label={text} onMouseEnter={scramble}>
      <SplitText text={display} />
    </h1>
  );
}
