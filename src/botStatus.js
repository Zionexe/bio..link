import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// useBotStatus — polls /api/bot-status?bot=<name> every minute (paused while
// the tab is hidden). Returns null while loading, then
// { online: true | false | null, maintenance, latency, servers, users, uptime }.
// online === null means the status page couldn't be reached.
// ---------------------------------------------------------------------------

const POLL_MS = 60_000;

export function useBotStatus(bot) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!bot) return undefined;
    let cancelled = false;
    let timer = 0;

    const load = async () => {
      try {
        const r = await fetch(`/api/bot-status?bot=${encodeURIComponent(bot)}`);
        const d = r.ok ? await r.json() : { online: null };
        if (!cancelled) setStatus(d);
      } catch {
        if (!cancelled) setStatus({ online: null });
      }
    };
    const tick = () => {
      if (document.visibilityState === "visible") load();
      timer = setTimeout(tick, POLL_MS);
    };
    const onVisible = () => { if (document.visibilityState === "visible") load(); };

    load();
    timer = setTimeout(tick, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [bot]);

  return status;
}

export function formatUptime(seconds) {
  if (typeof seconds !== "number") return "";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}
