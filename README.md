# Zion — bio site

React + Vite site with a guestbook API, deployed on Vercel.

## Run it locally

```
npm install
npm run dev        # live-reloading dev server
npm run build      # production build into dist/
npm run preview    # serve the production build
```

The guestbook works locally under `dev` and `preview` (messages are saved to
`.guestbook-local.json`). The local admin password is `local`.

## Deploy to Vercel

1. Push this folder to GitHub and import the repo in Vercel
   (or run `vercel` from this folder). Settings come from `vercel.json` —
   framework Vite, build `npm run build`, output `dist`.
2. **Storage → Create Database → Upstash for Redis** (free), and connect it to
   this project. That adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. **Settings → Environment Variables** → add `ADMIN_TOKEN` (your admin panel
   password — long and random).
4. Redeploy.

### Environment variables

| Name | Where it comes from | Used for |
| --- | --- | --- |
| `KV_REST_API_URL` | Added automatically by Upstash for Redis | Guestbook storage |
| `KV_REST_API_TOKEN` | Added automatically by Upstash for Redis | Guestbook storage |
| `ADMIN_TOKEN` | You add it | Admin panel password / deleting messages |

(`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` also work if you
connect Upstash by hand instead.) See `.env.example`.

## Editing content

Almost everything lives in `src/links.js`: name, socials, projects, songs,
contact email, easter egg word and admin word. The bio line and badges are at
the top of `src/App.jsx`.

## Secret words

- Type **zion** anywhere → easter egg.
- Type **Kellen829** anywhere → admin panel (asks for `ADMIN_TOKEN`).
