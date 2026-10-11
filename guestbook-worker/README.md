# Guestbook backend

A tiny Cloudflare Worker that stores guestbook messages. Free tier is plenty.

## Put it online (one time)

Run these from this `guestbook-worker` folder:

1. `npm install -g wrangler`
2. `wrangler login` (opens your browser to sign in to Cloudflare)
3. `wrangler kv namespace create GUESTBOOK`
   → copy the `id` it prints into `wrangler.toml` where it says `PASTE_YOUR_KV_ID_HERE`
4. `wrangler secret put ADMIN_TOKEN`
   → type any long random password. You use it to delete messages.
5. `wrangler deploy`
   → it prints a URL like `https://zion-guestbook.yourname.workers.dev`

Then open `src/links.js` in the site and set:

```js
export const GuestbookEndpoint = "https://zion-guestbook.yourname.workers.dev";
```

The guestbook tab appears on the site as soon as that's set. Rebuild (`npm run build`) and push.

If your site isn't on `https://ltut.lol`, put your real domain in `ALLOWED_ORIGINS` in `wrangler.toml` and run `wrangler deploy` again.

## Delete a message

Every message has an `id` (visible at `https://<your-worker-url>/entries`). To delete one:

```
curl -X DELETE https://<your-worker-url>/entries/<id> -H "Authorization: Bearer <your ADMIN_TOKEN>"
```

## Built-in spam protection

- one message per visitor per minute
- names up to 24 characters, messages up to 280
- links are rejected
- a hidden form field that only bots fill in
- only the newest 200 messages are kept
