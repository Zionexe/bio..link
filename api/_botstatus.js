// ---------------------------------------------------------------------------
// Bot status — fetches a bot's public status endpoint server-side and
// returns a small, cleaned-up JSON. Only bots listed in SOURCES can be
// checked, so this can't be used as an open proxy.
// Used by /api/bot-status (Vercel) and the local dev server (vite.config.js).
// ---------------------------------------------------------------------------

export const SOURCES = {
  valtrix: "https://www.valtrixbot.xyz/api/status",
};

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

const json = (body, status = 200, cache = "public, s-maxage=30, stale-while-revalidate=60") =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": cache },
  });

export async function handleBotStatus(request) {
  const bot = new URL(request.url).searchParams.get("bot") || "";
  const source = SOURCES[bot];
  if (!source) return json({ error: "unknown bot" }, 404, "no-store");

  try {
    const r = await fetch(source, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error(`status ${r.status}`);
    const d = await r.json();
    const b = d.bot || {};
    return json({
      bot,
      online: Boolean(d.online ?? b.online),
      maintenance: Boolean(b.maintenance),
      latency: num(b.latency_ms),
      servers: num(b.guilds),
      users: num(b.users),
      uptime: num(b.uptime_seconds),
      checkedAt: Date.now(),
    });
  } catch {
    // Status page unreachable — report "unknown" rather than claiming offline.
    return json({ bot, online: null, checkedAt: Date.now() }, 200, "public, s-maxage=15");
  }
}
