// ---------------------------------------------------------------------------
// Guestbook logic shared by the Vercel function (api/guestbook.js) and the
// local dev server (vite.config.js). Files starting with "_" in /api are not
// routes on Vercel.
//
//   GET    /api/guestbook           → { entries: [...] }  newest first, max 200
//   POST   /api/guestbook           → { entry }           body: { name, message, website }
//   DELETE /api/guestbook?id=<id>   → { ok: true }        header: Authorization: Bearer <ADMIN_TOKEN>
//   GET    /api/guestbook?check=admin → { ok: true }      same header — admin panel login
//
// Spam protection: one message per visitor per minute, length limits, no
// links, and a hidden "website" honeypot field only bots fill in.
// ---------------------------------------------------------------------------

export const MAX_ENTRIES = 200;
const NAME_MAX = 24;
const MESSAGE_MAX = 280;
const LINK_PATTERN = /(https?:\/\/|www\.|discord\.gg|\.(com|net|org|gg|xyz|io|lol)\b)/i;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function clean(text, max) {
  return String(text ?? "")
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, " ") // control + invisible chars
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function clientIp(request) {
  const h = request.headers;
  return (h.get("x-real-ip") || h.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}

/**
 * @param {Request} request
 * @param {{ list(): Promise<object[]>, add(entry: object): Promise<void>, remove(id: string): Promise<number>, claim(key: string, seconds: number): Promise<boolean> }} store
 * @param {{ adminToken?: string, rateLimitSeconds?: number }} options
 */
export async function handleGuestbook(request, store, { adminToken, rateLimitSeconds = 60 } = {}) {
  try {
    const isAdmin = () => {
      const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      return Boolean(adminToken) && token === adminToken;
    };

    if (request.method === "GET") {
      // Admin panel login check: GET ?check=admin with the admin token.
      if (new URL(request.url).searchParams.get("check") === "admin") {
        return isAdmin() ? json({ ok: true }) : json({ error: "wrong password" }, 401);
      }
      return json({ entries: await store.list() });
    }

    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "bad request" }, 400);
      }
      if (body?.website) return json({ error: "nope" }, 400); // honeypot

      const name = clean(body?.name, NAME_MAX);
      const message = clean(body?.message, MESSAGE_MAX);
      if (!name) return json({ error: "add a name" }, 400);
      if (message.length < 2) return json({ error: "write a message" }, 400);
      if (LINK_PATTERN.test(name) || LINK_PATTERN.test(message)) return json({ error: "no links allowed" }, 400);

      if (!(await store.claim(`gb:rl:${clientIp(request)}`, rateLimitSeconds))) {
        return json({ error: "slow down — one message a minute" }, 429);
      }

      const entry = { id: crypto.randomUUID(), name, message, at: Date.now() };
      await store.add(entry);
      return json({ entry }, 201);
    }

    if (request.method === "DELETE") {
      if (!isAdmin()) return json({ error: "unauthorized" }, 401);
      const id = new URL(request.url).searchParams.get("id");
      if (!id) return json({ error: "add ?id=" }, 400);
      return json({ ok: true, removed: await store.remove(id) });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (err) {
    return json({ error: err?.message === "no-storage" ? "guestbook storage isn't set up yet" : "server error" }, 503);
  }
}

// ---------------------------------------------------------------------------
// Upstash Redis store (Vercel → Storage → Upstash for Redis). Talks to its
// REST API with fetch, so no extra npm package is needed.
// ---------------------------------------------------------------------------
export function upstashStore(env = process.env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  const KEY = "gb:entries";

  const cmd = async (...args) => {
    if (!url || !token) throw new Error("no-storage");
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    return d.result;
  };

  return {
    async list() {
      const raw = (await cmd("LRANGE", KEY, 0, MAX_ENTRIES - 1)) || [];
      return raw.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
    },
    async add(entry) {
      await cmd("LPUSH", KEY, JSON.stringify(entry));
      await cmd("LTRIM", KEY, 0, MAX_ENTRIES - 1);
    },
    async remove(id) {
      const raw = (await cmd("LRANGE", KEY, 0, -1)) || [];
      const match = raw.find((s) => { try { return JSON.parse(s).id === id; } catch { return false; } });
      return match ? await cmd("LREM", KEY, 1, match) : 0;
    },
    async claim(key, seconds) {
      return (await cmd("SET", key, "1", "NX", "EX", seconds)) === "OK";
    },
  };
}
