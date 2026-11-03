import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile, writeFile } from 'node:fs/promises'
import { handleGuestbook, MAX_ENTRIES } from './api/_guestbook.js'
import { handleBotStatus } from './api/_botstatus.js'
import { handleViews } from './api/_views.js'
import { handleSettings } from './api/_settings.js'

// ---------------------------------------------------------------------------
// Local guestbook — makes /api/guestbook work under `npm run dev` and
// `npm run preview` without Vercel or a database. Messages are saved to
// .guestbook-local.json in the project folder (git-ignored). On Vercel the
// real function in api/guestbook.js takes over.
// ---------------------------------------------------------------------------
const LOCAL_FILE = new URL('./.guestbook-local.json', import.meta.url)
const SETTINGS_FILE = new URL('./.settings-local.json', import.meta.url) // saved theme

function localStore() {
  const limits = new Map()
  const counters = new Map()
  const readTexts = async () => {
    try { return JSON.parse(await readFile(SETTINGS_FILE, 'utf8')) } catch { return {} }
  }
  const load = async () => {
    try { return JSON.parse(await readFile(LOCAL_FILE, 'utf8')) } catch { return [] }
  }
  const save = (entries) => writeFile(LOCAL_FILE, JSON.stringify(entries, null, 2))
  return {
    list: load,
    async add(entry) { await save([entry, ...(await load())].slice(0, MAX_ENTRIES)) },
    async remove(id) {
      const entries = await load()
      const next = entries.filter((e) => e.id !== id)
      await save(next)
      return entries.length - next.length
    },
    async claim(key, seconds) {
      const now = Date.now()
      if ((limits.get(key) || 0) > now) return false
      limits.set(key, now + seconds * 1000)
      return true
    },
    // In-memory counters (view counter, failed admin logins). Reset when the
    // dev server restarts.
    async get(key) {
      const c = counters.get(key)
      if (!c || (c.until && c.until < Date.now())) return 0
      return c.n
    },
    async incr(key, expireSeconds) {
      const n = (await this.get(key)) + 1
      const prev = counters.get(key)
      const until = n === 1 ? (expireSeconds ? Date.now() + expireSeconds * 1000 : 0) : prev.until
      counters.set(key, { n, until })
      return n
    },
    // Site settings (theme) — saved to .settings-local.json.
    async getText(key) { return (await readTexts())[key] ?? null },
    async setText(key, value) {
      await writeFile(SETTINGS_FILE, JSON.stringify({ ...(await readTexts()), [key]: value }, null, 2))
    },
  }
}

// Turns a Node request into a fetch Request, runs `handler`, writes the reply.
async function bridge(req, res, handler) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
  })
  const response = await handler(request)
  res.statusCode = response.status
  response.headers.forEach((v, k) => res.setHeader(k, v))
  res.end(await response.text())
}

function localGuestbook() {
  const store = localStore()
  const middleware = async (req, res, next) => {
    if (req.url?.startsWith('/api/bot-status')) {
      const response = await handleBotStatus(new Request(`http://localhost${req.url}`))
      res.statusCode = response.status
      response.headers.forEach((v, k) => res.setHeader(k, v))
      return res.end(await response.text())
    }
    // Admin password locally is "local".
    if (req.url?.startsWith('/api/settings')) {
      return bridge(req, res, (r) => handleSettings(r, store, { adminToken: 'local' }))
    }
    if (req.url?.startsWith('/api/views')) {
      return bridge(req, res, (r) => handleViews(r, store, { adminToken: 'local' }))
    }
    if (!req.url?.startsWith('/api/guestbook')) return next()
    // Short rate limit locally so testing isn't painful.
    return bridge(req, res, (r) => handleGuestbook(r, store, { adminToken: 'local', rateLimitSeconds: 5 }))
  }
  return {
    name: 'local-guestbook',
    configureServer(server) { server.middlewares.use(middleware) },
    configurePreviewServer(server) { server.middlewares.use(middleware) },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localGuestbook()],
})
