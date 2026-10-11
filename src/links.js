// ---------------------------------------------------------------------------
// Shared site data — the name, social links and portfolio projects.
// Edit here; the profile page and the portfolio page both read from it.
// ---------------------------------------------------------------------------

export const DisplayName = "Zion";
export const LocationText = "z_z";

// `handle` is the small text shown on the portfolio page's link list.
export const Links = [
  {
    id: "discord",
    label: "Discord",
    handle: DisplayName,
    src: "https://cdn.simpleicons.org/discord/ffffff",
    href: "https://discord.com/users/855589141064318977",
  },
  {
    id: "tiktok",
    label: "TikTok",
    handle: "@ziondevs",
    src: "https://cdn.simpleicons.org/tiktok/ffffff",
    href: "https://www.tiktok.com/@ziondevs",
  },
];

// Your projects. Each one gets its own page (tab label = `tab`) and a card
// on the portfolio page. `invite` is the Discord invite code — the page uses
// it to show the server's icon and live member counts.
export const Ventures = [
  {
    id: "velocity",
    tab: "velocity",
    name: "Velocity Shop",
    kicker: "Velocity Leaks Shop",
    tagline: "Quality. Performance. Velocity.",
    description:
      "Premium FiveM assets, vehicles, clothing, scripts, and server-ready resources — built to elevate your server.",
    features: ["FiveM assets", "vehicles", "clothing", "scripts", "server-ready"],
    invite: "velocityshop",
    links: [{ label: "Join the Discord", href: "https://discord.gg/velocityshop", kind: "discord" }],
  },
  {
    id: "valtrix",
    tab: "valtrix",
    name: "Valtrix",
    kicker: "all-in-one discord bot",
    tagline: "One bot. Total control.",
    description: "Premium moderation, security, and ticket management.",
    features: ["moderation", "security", "tickets"],
    invite: "valtrix",
    links: [
      { label: "Visit website", href: "https://valtrixbot.xyz/", kind: "web" },
      { label: "Discord", href: "https://discord.gg/valtrix", kind: "discord" },
    ],
  },
  {
    id: "getghosted",
    tab: "getghosted",
    name: "Getghosted.lol",
    kicker: "Bio link pages",
    tagline: "A remake of guns.lol.",
    invite: "getghostedlol",
    links: [
      { label: "Visit getghosted.lol", href: "https://getghosted.lol", kind: "web" },
      { label: "Discord", href: "https://discord.gg/getghostedlol", kind: "discord" },
    ],
  },
  {
    id: "astrix",
    tab: "astrix",
    name: "Astrix Studio",
    kicker: "studio",
    tagline: "Made by developers, for you.",
    invite: "Astrixstudio",
    links: [{ label: "Join the Discord", href: "https://discord.gg/Astrixstudio", kind: "discord" }],
  },
];

// Songs for the site's music player (Dynamic Island + music page).
export const Tracks = [
  { name: "Thuggish Ruggish Bone", artist: "Bone Thugs-N-Harmony", src: "https://res.cloudinary.com/pkkyvxha/video/upload/v1791757341/Thuggish_Ruggish_Bone.mp3" },
  { name: "Glock In My Lap", artist: "21 Savage", src: "https://res.cloudinary.com/pkkyvxha/video/upload/v1791757442/Glock_In_My_Lap.mp3" },
];

// Guestbook API (api/guestbook.js). Set to "" to hide the guestbook tab.
export const GuestbookEndpoint = "/api/guestbook";

// Shown in the "business inquiries" sheet. Leave "" for Discord only.
export const ContactEmail = "";

// Type this anywhere on the site to trigger the easter egg.
export const SecretWord = "zion";

// Type this anywhere on the site to open the admin panel. Note: anyone can
// read this in the site's code — the panel itself is protected by the
// ADMIN_TOKEN password, which is only checked on the server.
export const AdminWord = "Kellen829";
