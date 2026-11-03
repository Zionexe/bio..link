# Zion — bio site

React + Vite site with a guestbook and view counter API, deployed on Vercel.

## Run it locally

```
npm install
npm run dev        # live-reloading dev server
npm run build      # production build into dist/
npm run preview    # serve the production build
```

The guestbook and view counter work locally under `dev` and `preview`
(messages are saved to `.guestbook-local.json`; local view counts reset when
the server restarts). The local admin password is `local`.

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
| `VIEWS_START` | Optional, you add it | Number added to the view count (carry over your old count) |

(`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` also work if you
connect Upstash by hand instead.) See `.env.example`.

## View counter

`/api/views` counts each visitor once per 24 hours and stores the total in the
same Upstash database as the guestbook — no extra setup. Only a hash of the
visitor's IP + browser is stored, never the IP itself. The admin panel shows the
total, today's count and a 7-day chart.

The old counter (`views.ltut.lol`) no longer exists. To keep your old number,
set `VIEWS_START` to it.

## Admin password protection

After 8 wrong admin passwords from the same visitor, the admin login is locked
for that visitor for 15 minutes.

## Look

- `src/fresh.css` (loaded last) holds the current look: frosted-glass cards
  over a black page. Remove its import in `src/App.jsx` to go back.
- The intro screen's name and the small site line under it are `Word` and
  `Site` at the top of `src/Intro.jsx`.

## Seasonal themes

Open the admin panel (type the admin word, sign in) → **Site theme**, and pick
Default, Christmas, Halloween, Thanksgiving, Easter, Valentine's, New Year,
4th of July or St. Patrick's. The choice is saved on the server
(`/api/settings`, same Upstash database) so every visitor sees it, and it stays
until you change it. Each theme tints the cards and stars, adds falling
particles (snow, bats, leaves, hearts, confetti…) that the mouse pushes away,
an emoji next to your name and a greeting toast.

- Each theme also has a card decoration (Christmas lights, cobweb + spider,
  leaf/heart/clover garlands, 4th of July bunting), coloured light in the
  corners, a tinted star web, an emoji trail behind the mouse, and fireworks
  (New Year, 4th of July — click anywhere for more) or lightning (Halloween).
- **Holiday songs:** each theme has its own playlist (`tracks` in
  `src/themes.js`). Drop the mp3s into `public/music/<theme>/` with the exact
  file names listed in that folder's `PUT-SONGS-HERE.txt` (e.g.
  `public/music/christmas/last-christmas.mp3`). While the theme is on, the
  player plays the holiday songs whose files are there; with none there yet,
  your normal songs keep playing.
- Edit or add themes in `src/themes.js`.
- Preview one without saving: add `?theme=halloween` (any theme id) to the URL.
- Locally the choice is saved to `.settings-local.json`.

## Background

The background is an interactive web of points and lines
(`src/NetworkBackground.jsx`): moving the mouse bends the web around the
cursor with a soft light, some points twinkle like stars, and clicking sends
out a shockwave. It also shows behind the intro screen. Its colour, density,
line length, star share, cursor light and strength of the mouse effect are in `SETTINGS` at the top of that file.
To switch back to the photo or video, set `BackgroundMode` at the top of
`src/App.jsx` to `"photo"` or `"video"`.

## Profile picture

The profile picture and music-player cover are your live Discord avatar,
fetched through Lanyard — change your Discord avatar and the site follows.
`public/pfp.jpg` is only shown if Discord can't be reached.

## Editing content

Almost everything lives in `src/links.js`: name, socials, projects, songs,
contact email, easter egg word and admin word. The bio line and badges are at
the top of `src/App.jsx`.

## Secret words

- Type **zion** anywhere → easter egg.
- Type **Kellen829** anywhere → admin panel (asks for `ADMIN_TOKEN`).
