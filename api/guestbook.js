// Vercel Function — /api/guestbook. Logic lives in ./_guestbook.js.
// Needs Upstash Redis connected to the project (Vercel → Storage) and an
// ADMIN_TOKEN environment variable for deleting messages.
import { handleGuestbook, upstashStore } from "./_guestbook.js";

const run = (request) =>
  handleGuestbook(request, upstashStore(process.env), { adminToken: process.env.ADMIN_TOKEN });

export const GET = run;
export const POST = run;
export const DELETE = run;
