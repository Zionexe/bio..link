import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile, writeFile } from 'node:fs/promises'
import { handleGuestbook, MAX_ENTRIES } from './api/_guestbook.js'
import { handleBotStatus } from './api/_botstatus.js'

// ---------------------------------------------------------------------------
// Local guestbook — makes /api/guestbook work under `npm run dev` and
// `npm run preview` without Vercel or a database. Messages are saved to
// .guestbook-local.json in the project folder (git-ignored). On Vercel the
// real function in api/guestbook.js takes over.
// ---------------------------------------------------------------------------
const LOCAL_FILE = new URL('./.guestbook-local.json', import.meta.url)

function localStore() {
  const limits = new Map()
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
  }
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
    if (!req.url?.startsWith('/api/guestbook')) return next()
    const chunks = []
    for await (const c of req) chunks.push(c)
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
    })
    // Short rate limit locally so testing isn't painful; admin token is "local".
    const response = await handleGuestbook(request, store, { adminToken: 'local', rateLimitSeconds: 5 })
    res.statusCode = response.status
    response.headers.forEach((v, k) => res.setHeader(k, v))
    res.end(await response.text())
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
