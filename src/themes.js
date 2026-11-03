// ---------------------------------------------------------------------------
// Seasonal themes — picked in the admin panel (saved on the server, so every
// visitor sees the same one). Preview any theme without saving by adding
// ?theme=<id> to the URL, e.g. /?theme=halloween.
//
//   accent / accent2 — "r, g, b" colours: glows, borders, the web and stars
//   badge            — emoji next to your name ("" for none)
//   greeting         — toast shown when a visitor enters
//   decor            — decoration on the profile card:
//       { type: "lights",  colors: [...] }   string of twinkling bulbs
//       { type: "web" }                      cobweb + dangling spider
//       { type: "garland", glyphs: [...] }   row of hanging emoji
//       { type: "bunting", colors: [...] }   pennant flags
//   fx               — big background effect: "fireworks" | "lightning" | null
//                      (fireworks also go off wherever visitors click)
//   trail            — emoji that sprinkle behind the mouse ([] for none)
//   particles        — what falls (or rises) over the background:
//       glyphs : emoji, or "dot" (soft round flake) / "confetti" (spinning strip)
//       count  : how many on a 1920×1080 screen (scaled to the screen size)
//       speed  : [min, max] px per frame; negative rises instead of falls
//       size   : [min, max] px
//       sway   : side-to-side drift
//       spin   : rotate as they move
//       colors : for "dot" / "confetti"
//   tracks           — this holiday's playlist. While the theme is on, the
//                      music player plays these instead of your normal songs.
//                      Each `src` points at public/music/<theme>/<file>.mp3 —
//                      drop the mp3 in with that exact name (each folder has a
//                      PUT-SONGS-HERE.txt listing them). Songs whose file isn't
//                      there yet are skipped; with none there, your normal
//                      songs play. A full https link (e.g. Cloudinary) works too.
// ---------------------------------------------------------------------------

export const Themes = [
  {
    id: "default",
    label: "Default",
    emoji: "⚫",
    accent: null,
    badge: "",
    greeting: "",
    decor: null,
    fx: null,
    trail: [],
    particles: [],
    tracks: [],
  },
  {
    id: "christmas",
    label: "Christmas",
    emoji: "🎄",
    accent: "239, 68, 68",
    accent2: "34, 197, 94",
    badge: "🎄",
    greeting: "merry christmas 🎄",
    decor: { type: "lights", colors: ["239, 68, 68", "34, 197, 94", "250, 204, 21", "59, 130, 246"] },
    fx: null,
    trail: ["✨", "❄️"],
    particles: [
      { glyphs: ["dot"], count: 140, speed: [0.4, 1.4], size: [2.5, 6], sway: 0.6, colors: ["255, 255, 255"] },
      { glyphs: ["❄️"], count: 16, speed: [0.5, 1.1], size: [12, 22], sway: 0.8, spin: true },
    ],
    tracks: [
      { name: "All I Want for Christmas Is You", artist: "Mariah Carey", src: "/music/christmas/all-i-want-for-christmas-is-you.mp3", cover: "" },
      { name: "Last Christmas", artist: "Wham!", src: "/music/christmas/last-christmas.mp3", cover: "" },
      { name: "Rockin' Around the Christmas Tree", artist: "Brenda Lee", src: "/music/christmas/rockin-around-the-christmas-tree.mp3", cover: "" },
    ],
  },
  {
    id: "halloween",
    label: "Halloween",
    emoji: "🎃",
    accent: "249, 115, 22",
    accent2: "168, 85, 247",
    badge: "🎃",
    greeting: "happy halloween 🎃",
    decor: { type: "web" },
    fx: "lightning",
    trail: [],
    particles: [
      { glyphs: ["🦇"], count: 14, speed: [0.3, 0.8], size: [16, 28], sway: 2.4 },
      { glyphs: ["🎃", "👻"], count: 8, speed: [0.3, 0.6], size: [18, 28], sway: 0.6, spin: true },
      { glyphs: ["dot"], count: 50, speed: [-0.4, -0.15], size: [1, 2.5], sway: 0.5, colors: ["249, 115, 22", "168, 85, 247"] },
    ],
    tracks: [
      { name: "Thriller", artist: "Michael Jackson", src: "/music/halloween/thriller.mp3", cover: "" },
      { name: "Ghostbusters", artist: "Ray Parker Jr.", src: "/music/halloween/ghostbusters.mp3", cover: "" },
      { name: "Somebody's Watching Me", artist: "Rockwell", src: "/music/halloween/somebodys-watching-me.mp3", cover: "" },
    ],
  },
  {
    id: "thanksgiving",
    label: "Thanksgiving",
    emoji: "🦃",
    accent: "245, 158, 11",
    accent2: "220, 38, 38",
    badge: "🦃",
    greeting: "happy thanksgiving 🦃",
    decor: { type: "garland", glyphs: ["🍂", "🍁", "🌾", "🍁"] },
    fx: null,
    trail: ["🍂"],
    particles: [
      { glyphs: ["🍂", "🍁"], count: 32, speed: [0.5, 1.2], size: [16, 28], sway: 1.8, spin: true },
      { glyphs: ["dot"], count: 30, speed: [0.2, 0.5], size: [1.5, 3], sway: 0.5, colors: ["245, 158, 11"] },
    ],
    tracks: [
      { name: "Family Affair", artist: "Mary J. Blige", src: "/music/thanksgiving/family-affair.mp3", cover: "" },
      { name: "Thank You", artist: "Dido", src: "/music/thanksgiving/thank-you.mp3", cover: "" },
    ],
  },
  {
    id: "easter",
    label: "Easter",
    emoji: "🐣",
    accent: "244, 114, 182",
    accent2: "125, 211, 252",
    badge: "🐣",
    greeting: "happy easter 🐣",
    decor: { type: "garland", glyphs: ["🌷", "🥚", "🌼", "🐣", "🌸"] },
    fx: null,
    trail: ["🌸", "✨"],
    particles: [
      { glyphs: ["🌸"], count: 24, speed: [0.4, 0.9], size: [14, 24], sway: 1.4, spin: true },
      { glyphs: ["🥚", "🐣", "🐰"], count: 8, speed: [0.4, 0.8], size: [18, 28], sway: 0.6 },
    ],
    tracks: [
      { name: "Here Comes Peter Cottontail", artist: "Gene Autry", src: "/music/easter/here-comes-peter-cottontail.mp3", cover: "" },
      { name: "Walking on Sunshine", artist: "Katrina and the Waves", src: "/music/easter/walking-on-sunshine.mp3", cover: "" },
    ],
  },
  {
    id: "valentines",
    label: "Valentine's",
    emoji: "💘",
    accent: "244, 63, 94",
    accent2: "236, 72, 153",
    badge: "💘",
    greeting: "happy valentine's day 💘",
    decor: { type: "garland", glyphs: ["💕", "💗", "💖", "💗"] },
    fx: null,
    trail: ["💗", "💕"],
    particles: [
      { glyphs: ["❤️", "💗", "💕"], count: 26, speed: [-1, -0.4], size: [14, 26], sway: 1 },
      { glyphs: ["dot"], count: 40, speed: [-0.5, -0.2], size: [1.5, 3], sway: 0.6, colors: ["244, 63, 94", "255, 255, 255"] },
    ],
    tracks: [
      { name: "Best Part", artist: "Daniel Caesar ft. H.E.R.", src: "/music/valentines/best-part.mp3", cover: "" },
      { name: "Adore You", artist: "Harry Styles", src: "/music/valentines/adore-you.mp3", cover: "" },
    ],
  },
  {
    id: "newyear",
    label: "New Year",
    emoji: "🎆",
    accent: "250, 204, 21",
    accent2: "255, 255, 255",
    badge: "🥂",
    greeting: "happy new year 🎆",
    decor: { type: "lights", colors: ["250, 204, 21", "255, 255, 255", "253, 230, 138"] },
    fx: "fireworks",
    trail: ["✨"],
    particles: [
      { glyphs: ["confetti"], count: 70, speed: [0.8, 1.8], size: [6, 10], sway: 1.2, spin: true, colors: ["250, 204, 21", "255, 255, 255", "203, 213, 225"] },
    ],
    tracks: [
      { name: "Celebration", artist: "Kool & The Gang", src: "/music/newyear/celebration.mp3", cover: "" },
      { name: "Auld Lang Syne", artist: "Traditional", src: "/music/newyear/auld-lang-syne.mp3", cover: "" },
    ],
  },
  {
    id: "fourth",
    label: "4th of July",
    emoji: "🎆", // (flag emoji don't render on Windows)
    accent: "59, 130, 246",
    accent2: "239, 68, 68",
    badge: "🎆",
    greeting: "happy 4th of july 🎆",
    decor: { type: "bunting", colors: ["239, 68, 68", "255, 255, 255", "59, 130, 246"] },
    fx: "fireworks",
    trail: ["⭐"],
    particles: [
      { glyphs: ["confetti"], count: 50, speed: [0.8, 1.7], size: [6, 10], sway: 1.2, spin: true, colors: ["239, 68, 68", "255, 255, 255", "59, 130, 246"] },
    ],
    tracks: [
      { name: "Party in the U.S.A.", artist: "Miley Cyrus", src: "/music/fourth/party-in-the-usa.mp3", cover: "" },
      { name: "Firework", artist: "Katy Perry", src: "/music/fourth/firework.mp3", cover: "" },
    ],
  },
  {
    id: "stpatricks",
    label: "St. Patrick's",
    emoji: "🍀",
    accent: "34, 197, 94",
    accent2: "250, 204, 21",
    badge: "🍀",
    greeting: "happy st. patrick's day 🍀",
    decor: { type: "garland", glyphs: ["☘️", "🍀", "🪙", "🍀"] },
    fx: null,
    trail: ["🍀", "✨"],
    particles: [
      { glyphs: ["🍀", "☘️"], count: 24, speed: [0.5, 1.1], size: [14, 24], sway: 1.2, spin: true },
      { glyphs: ["dot"], count: 40, speed: [0.3, 0.7], size: [1.5, 3], sway: 0.5, colors: ["250, 204, 21"] },
    ],
    tracks: [
      { name: "I'm Shipping Up to Boston", artist: "Dropkick Murphys", src: "/music/stpatricks/im-shipping-up-to-boston.mp3", cover: "" },
      { name: "Jump Around", artist: "House of Pain", src: "/music/stpatricks/jump-around.mp3", cover: "" },
    ],
  },
];

export const getTheme = (id) => Themes.find((t) => t.id === id) || Themes[0];

// The songs a theme can actually play: ones whose file is really there.
// Files in public/music are checked (a missing one would come back as the
// site's page, not audio); full https links are trusted as-is.
export async function availableTracks(theme) {
  const list = (theme?.tracks || []).filter((t) => t.src);
  const checked = await Promise.all(
    list.map(async (t) => {
      if (/^https?:\/\//i.test(t.src)) return t;
      try {
        const r = await fetch(t.src, { method: "HEAD", cache: "no-store" });
        const type = r.headers.get("content-type") || "";
        return r.ok && (type.startsWith("audio/") || type === "application/octet-stream") ? t : null;
      } catch {
        return null;
      }
    })
  );
  return checked.filter(Boolean);
}
