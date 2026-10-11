import { useEffect, useRef, useState } from "react";

export function useViews(endpoint) {
  const [count, setCount] = useState(0);
  const [popups, setPopups] = useState([]);
  const hasRegistered = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function registerAndFetch() {
      try {
        if (!hasRegistered.current) {
          hasRegistered.current = true;
          const hitRes = await fetch(`${endpoint.replace(/\/$/, "")}/hit`, { method: "POST" });
          if (hitRes.ok) {
            const hitJson = await hitRes.json();
            if (!cancelled && typeof hitJson.count === "number") {
              setCount(hitJson.count);
              triggerPopup();
              return;
            }
          }
        }

        const res = await fetch(endpoint);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && typeof json.count === "number") {
          setCount(json.count);
        }
      } catch {}
    }

    function triggerPopup() {
      const id = Date.now();
      setPopups((prev) => [...prev, { id }]);
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
      }, 900);
    }

    registerAndFetch();

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return { count, popups };
}