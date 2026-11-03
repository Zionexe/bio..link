// ---------------------------------------------------------------------------
// View counter — replaces the old views.ltut.lol counter. Uses the same
// Upstash Redis database as the guestbook, so there is nothing new to set up.
//
//   GET  /api/views               → { count }
//   POST /api/views               → { count, counted }  counts this visitor
//   GET  /api/views?stats=admin   → { total, days: [{ date, count }] }  (last 7 days)
//                                   header: Authorization: Bearer <ADMIN_TOKEN>
//
// Each visitor is counted at most once every 24 hours. Visitors are told apart
// by a hash of their IP + browser, and only the hash is stored (never the IP).
// VIEWS_START (optional env var) is added to the total, so you can carry over
// the number from your old counter.
// ---------------------------------------------------------------------------
import { checkAdmin, adminError, clientIp } from "./_auth.js";

const DAY = 24 * 60 * 60;
const KEEP_DAYS = 45;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const dayKey = (d) => `v:day:${d.toISOString().slice(0, 10)}`;

async function visitorId(request) {
  const raw = `${clientIp(request)}|${request.headers.get("user-agent") || ""}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * @param {Request} request
 * @param {{ get(k: string): Promise<number>, incr(k: string, expireSeconds?: number): Promise<number>, claim(k: string, seconds: number): Promise<boolean> }} store
 * @param {{ adminToken?: string, startAt?: number }} options
 */
export async function handleViews(request, store, { adminToken, startAt = 0 } = {}) {
  try {
    if (request.method === "GET") {
      if (new URL(request.url).searchParams.get("stats") === "admin") {
        const result = await checkAdmin(request, store, adminToken);
        if (result !== "ok") {
          const { error, status } = adminError(result);
          return json({ error }, status);
        }
        const now = Date.now();
        const dates = Array.from({ length: 7 }, (_, i) => new Date(now - (6 - i) * DAY * 1000));
        const counts = await Promise.all(dates.map((d) => store.get(dayKey(d))));
        return json({
          total: (await store.get("v:total")) + startAt,
          days: dates.map((d, i) => ({ date: d.toISOString().slice(0, 10), count: counts[i] })),
        });
      }
      return json({ count: (await store.get("v:total")) + startAt });
    }

    if (request.method === "POST") {
      const counted = await store.claim(`v:seen:${await visitorId(request)}`, DAY);
      let total;
      if (counted) {
        total = await store.incr("v:total");
        await store.incr(dayKey(new Date()), KEEP_DAYS * DAY);
      } else {
        total = await store.get("v:total");
      }
      return json({ count: total + startAt, counted });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (err) {
    return json({ error: err?.message === "no-storage" ? "storage isn't set up yet" : "server error" }, 503);
  }
}
