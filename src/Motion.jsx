import { useEffect, useRef, useState } from "react";
import { useScramble } from "./Text";

// ---------------------------------------------------------------------------
// Small motion helpers used across pages.
// ---------------------------------------------------------------------------

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// CountUp — rolls a number up from where it was (0 at first) to `value`.
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString(), duration = 1100, delay = 250 }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (typeof value !== "number" || !isFinite(value)) return;
    if (reduceMotion()) {
      setShown(value);
      from.current = value;
      return;
    }
    const start0 = from.current;
    let raf = 0;
    let begin = 0;
    const tick = (now) => {
      if (!begin) begin = now;
      const t = Math.min(1, (now - begin) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setShown(start0 + (value - start0) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(tick); }, from.current === 0 ? delay : 0);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  return <span className="count-up">{format(Math.round(shown))}</span>;
}

// Kicker — the small uppercase label above titles; decodes in on mount.
export function Kicker({ text, delay = 120 }) {
  const [display, scramble] = useScramble(text, { duration: 650 });
  useEffect(() => {
    const t = setTimeout(scramble, delay);
    return () => clearTimeout(t);
  }, [scramble, delay]);
  return <span className="kicker" aria-label={text}>{display}</span>;
}
