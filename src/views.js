import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// useViews — talks to /api/views (api/_views.js). Counts this visitor once
// (the server ignores repeat visits within 24h) and returns the total.
//   count   — number, or null while loading / if the counter is unreachable
//   counted — true when this visit was a new one (used for the "+1" popup
//             and view-milestone confetti)
// ---------------------------------------------------------------------------
export function useViews(endpoint) {
  const [count, setCount] = useState(null);
  const [counted, setCounted] = useState(false);
  const [popups, setPopups] = useState([]);
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (!endpoint || hasRegistered.current) return;
    // Ref guard: StrictMode runs effects twice in dev; count only once.
    // (No cancel flag — the second run returns early, so the first must
    // still be allowed to set state.)
    hasRegistered.current = true;

    const read = async (init) => {
      const r = await fetch(endpoint, init);
      if (!r.ok) throw new Error(`views ${r.status}`);
      return r.json();
    };

    (async () => {
      try {
        const d = await read({ method: "POST" }).catch(() => read());
        if (typeof d.count !== "number") return;
        setCount(d.count);
        if (d.counted) {
          setCounted(true);
          const id = Date.now();
          setPopups((prev) => [...prev, { id }]);
          setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== id)), 900);
        }
      } catch {
        // Counter unreachable — the page shows "—" instead of a number.
      }
    })();
  }, [endpoint]);

  return { count, counted, popups };
}
