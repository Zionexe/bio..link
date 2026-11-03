// ---------------------------------------------------------------------------
// Admin checks shared by /api/guestbook and /api/views.
//
// Wrong passwords are counted per visitor: after MAX_FAILS wrong tries the
// visitor is locked out for LOCK_SECONDS, so the password can't be guessed
// by brute force. The compare runs in constant time.
// ---------------------------------------------------------------------------

const MAX_FAILS = 8;
const LOCK_SECONDS = 15 * 60;

export function clientIp(request) {
  const h = request.headers;
  return (h.get("x-real-ip") || h.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}

function safeEqual(a, b) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * @returns {Promise<"ok" | "denied" | "locked">}
 */
export async function checkAdmin(request, store, adminToken) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!adminToken || !token) return "denied";

  const failKey = `auth:fail:${clientIp(request)}`;
  if ((await store.get(failKey)) >= MAX_FAILS) return "locked";
  if (safeEqual(token, adminToken)) return "ok";

  await store.incr(failKey, LOCK_SECONDS);
  return "denied";
}

export const adminError = (result) =>
  result === "locked"
    ? { error: "too many wrong passwords — try again in 15 minutes", status: 429 }
    : { error: "wrong password", status: 401 };
