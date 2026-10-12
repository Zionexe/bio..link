// Vercel Function — /api/bot-status?bot=valtrix. Logic lives in ./_botstatus.js.
// No environment variables needed.
import { handleBotStatus } from "./_botstatus.js";

export const GET = handleBotStatus;
