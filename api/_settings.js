// ---------------------------------------------------------------------------
// Site settings — currently just the seasonal theme, picked in the admin
// panel and shown to every visitor. Stored in the same Upstash database.
//
//   GET  /api/settings            → { theme }
//   POST /api/settings            → { theme }   body: { theme }
//                                   header: Authorization: Bearer <ADMIN_TOKEN>
// ---------------------------------------------------------------------------
import { checkAdmin, adminError } from "./_auth.js";

const THEME_KEY = "site:theme";
const THEME_ID = /^[a-z0-9-]{1,24}$/;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function handleSettings(request, store, { adminToken } = {}) {
  try {
    if (request.method === "GET") {
      return json({ theme: (await store.getText(THEME_KEY)) || "default" });
    }

    if (request.method === "POST") {
      const result = await checkAdmin(request, store, adminToken);
      if (result !== "ok") {
        const { error, status } = adminError(result);
        return json({ error }, status);
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "bad request" }, 400);
      }
      const theme = String(body?.theme || "");
      if (!THEME_ID.test(theme)) return json({ error: "unknown theme" }, 400);
      await store.setText(THEME_KEY, theme);
      return json({ theme });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (err) {
    return json({ error: err?.message === "no-storage" ? "storage isn't set up yet" : "server error" }, 503);
  }
}
