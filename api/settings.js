// Vercel Function — /api/settings (seasonal theme). Logic lives in ./_settings.js.
// Uses the same Upstash Redis database and ADMIN_TOKEN as the guestbook.
import { handleSettings } from "./_settings.js";
import { upstashStore } from "./_guestbook.js";

const run = (request) => handleSettings(request, upstashStore(process.env), { adminToken: process.env.ADMIN_TOKEN });

export const GET = run;
export const POST = run;
