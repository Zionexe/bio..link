// ---------------------------------------------------------------------------
// zion guestbook — Cloudflare Worker + KV.
//
//   GET    /entries          → { entries: [...] }   newest first, max 200
//   POST   /entries          → { entry }            body: { name, message, website }
//   DELETE /entries/:id      → { ok: true }         header: Authorization: Bearer <ADMIN_TOKEN>
//
// Spam protection: one message per IP per minute, length limits, no links,
// and a hidden "website" honeypot field that real visitors never fill.
// ---------------------------------------------------------------------------

const MAX_ENTRIES = 200;
const NAME_MAX = 24;
const MESSAGE_MAX = 280;
const RATE_LIMIT_SECONDS = 60;
const LINK_PATTERN = /(https?:\/\/|www\.|discord\.gg|\.(com|net|org|gg|xyz|io|lol)\b)/i;

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim()).filter(Boolean);
  const allowOrigin = allowed.includes("*") ? "*" : allowed.includes(origin) ? origin : allowed[0] || "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function clean(text, max) {
  return String(text ?? "")
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, " ") // control + invisible chars
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function readEntries(env) {
  try {
    return JSON.parse((await env.GUESTBOOK.get("entries")) || "[]");
  } catch {
    return [];
  }
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");

    if (path === "/entries" && request.method === "GET") {
      return json({ entries: await readEntries(env) });
    }

    if (path === "/entries" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "bad request" }, 400);
      }

      // Honeypot: bots fill every field.
      if (body?.website) return json({ error: "nope" }, 400);

      const name = clean(body?.name, NAME_MAX);
      const message = clean(body?.message, MESSAGE_MAX);
      if (!name) return json({ error: "add a name" }, 400);
      if (message.length < 2) return json({ error: "write a message" }, 400);
      if (LINK_PATTERN.test(name) || LINK_PATTERN.test(message)) return json({ error: "no links allowed" }, 400);

      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateKey = `rl:${ip}`;
      if (await env.GUESTBOOK.get(rateKey)) return json({ error: "slow down — one message a minute" }, 429);
      await env.GUESTBOOK.put(rateKey, "1", { expirationTtl: RATE_LIMIT_SECONDS });

      const entry = { id: crypto.randomUUID(), name, message, at: Date.now() };
      const entries = [entry, ...(await readEntries(env))].slice(0, MAX_ENTRIES);
      await env.GUESTBOOK.put("entries", JSON.stringify(entries));
      return json({ entry }, 201);
    }

    const del = path.match(/^\/entries\/([\w-]+)$/);
    if (del && request.method === "DELETE") {
      const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) return json({ error: "unauthorized" }, 401);
      const entries = await readEntries(env);
      const next = entries.filter((e) => e.id !== del[1]);
      await env.GUESTBOOK.put("entries", JSON.stringify(next));
      return json({ ok: true, removed: entries.length - next.length });
    }

    return json({ error: "not found" }, 404);
  },
};
