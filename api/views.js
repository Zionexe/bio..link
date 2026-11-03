// Vercel Function — /api/views. Logic lives in ./_views.js.
// Uses the same Upstash Redis database as the guestbook. Optional env var:
// VIEWS_START — a number added to the total (e.g. your old counter's count).
import { handleViews } from "./_views.js";
import { upstashStore } from "./_guestbook.js";

const run = (request) =>
  handleViews(request, upstashStore(process.env), {
    adminToken: process.env.ADMIN_TOKEN,
    startAt: Number(process.env.VIEWS_START) || 0,
  });

export const GET = run;
export const POST = run;
