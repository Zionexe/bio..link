import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { CountUp } from "./Motion";
import { useLanyard, getDiscordAvatarUrl, getActivePlatforms, getGuildBadgeUrl, getAvatarDecorationUrl, getNameplateUrl } from "./lanyard";
import { useViews } from "./views";
import { PlatformIndicators } from "./PlatformIcons";
import LyricsCard from "./LyricsCard";
import DynamicIsland from "./DynamicIsland";
import Intro from "./Intro";
import Glass from "./Glass";
import Portfolio from "./Portfolio";
import Music from "./Music";
import Venture from "./Venture";
import Projects, { ProjectTile } from "./Projects";
import Guestbook from "./Guestbook";
import NotFound from "./NotFound";
import AdminPanel from "./AdminPanel";
import { ContactButton, ContactSheet } from "./Contact";
import Cursor from "./Cursor";
import { PageTitle } from "./Text";
import { DisplayName, Links, LocationText, Tracks, Ventures, GuestbookEndpoint, ContactEmail, SecretWord, AdminWord } from "./links";
import "./App.css";
import "./mono.css";
import "./extras.css";
import "./polish.css";
import "./motion.css";
//hello
const DiscordId = "855589141064318977";
// Line typed out under your name on the home page ("" hides it).
const BioText = "Developer — Velocity · Valtrix · Getghosted · Astrix";
const ViewsEndpoint = "https://views.ltut.lol/";
// Profile picture + background photo (in /public). Set UsePhotoBackground
// to false to go back to the video background.
const PfpUrl = "/pfp.jpg";
const BackgroundPhotoUrl = "/bg.jpg";
const UsePhotoBackground = true;
const BannerVideoUrl = "https://res.cloudinary.com/dwrd1ukva/video/upload/v1782910854/a6ec44d6-a293-45f0-a642-c3c895df8c99_whh21w.mp4";

// Easter-egg feature flags — flip to false to fully disable, no code removal needed.
const DeviceEasterEggEnabled = false;
const HeartEasterEggEnabled = false;

const BadgeMap = {
  crown: "/Badges/Crown.svg",
  developer: "/Badges/Developer.svg",
  cash: "/Badges/Cash.png",
  verified: "/Badges/Verified.png",
};

const BadgeLabels = {
  crown: "Owner",
  developer: "Developer",
  cash: "Money",
  verified: "Verified",
};


// Black & white theme: status reads as brightness instead of colour.
const StatusColors = {
  online: "#ffffff",
  idle: "#a6a6a6",
  dnd: "#5e5e5e",
  offline: "#2e2e2e",
};

// ---------------------------------------------------------------------------
// Discord presence helpers
// ---------------------------------------------------------------------------
function getCustomStatus(presence) {
  const act = presence?.activities?.find((a) => a.type === 4);
  if (!act) return null;
  const emoji = act.emoji?.name ? `${act.emoji.name} ` : "";
  const text = act.state ? `${emoji}${act.state}` : "";
  return text.trim() || null;
}

// The site's pages, in tab order. `id` is also the URL hash (#music etc.).
// Project detail pages (#velocity, #valtrix, …) live under the projects tab.
// The guestbook tab only shows once its backend URL is set in links.js.
const Pages = [
  { id: "profile", label: "home" },
  { id: "projects", label: "projects" },
  { id: "music", label: "music" },
  ...(GuestbookEndpoint ? [{ id: "guestbook", label: "guestbook" }] : []),
  { id: "links", label: "links" },
];

const BasePath = import.meta.env.BASE_URL || "/";

// Unknown pages — a bad #hash, or a path the host served index.html for —
// show the 404 page.
// Order used to pick the slide direction between pages.
function pageRank(id) {
  const i = Pages.findIndex((p) => p.id === id);
  if (i >= 0) return i;
  if (Ventures.some((v) => v.id === id)) return Pages.findIndex((p) => p.id === "projects") + 0.5;
  return Pages.length;
}

function pageFromHash() {
  if (typeof window === "undefined") return "profile";
  const path = window.location.pathname;
  if (path !== BasePath && path !== `${BasePath}index.html`) return "notfound";
  const id = window.location.hash.replace(/^#\/?/, "");
  if (!id) return "profile";
  if (id === "portfolio") return "links"; // old link
  if (Pages.some((p) => p.id === id) || Ventures.some((v) => v.id === id)) return id;
  return "notfound";
}

const ActivityVerbs = { 0: "playing", 1: "streaming", 3: "watching", 5: "competing in" };

function getPrimaryActivity(presence) {
  if (!presence) return null;
  if (presence.listening_to_spotify && presence.spotify) {
    return `listening to ${presence.spotify.song} — ${presence.spotify.artist}`;
  }
  const act = presence.activities?.find((a) => a.type !== 4 && a.type !== 2);
  if (!act) return null;
  const verb = ActivityVerbs[act.type] || "doing";
  let line = `${verb} ${act.name}`;
  if (act.details) line += ` — ${act.details}`;
  if (act.state) line += ` (${act.state})`;
  return line;
}

function getGuildTag(presence) {
  return presence?.discord_user?.primary_guild?.tag || null;
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
function Badges({ ids }) {
  if (!ids || ids.length === 0) return null;
  return (
    <span className="badge-row">
      {ids.map((id) => (
        <span key={id} className="badge-tooltip-wrap" data-tooltip={BadgeLabels[id] || id}>
          <img className="badge-icon" src={BadgeMap[id]} alt={id} />
        </span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Typewriter — types `text` out once, prefixed with a "<" prompt marker
// that re-renders on every character (e.g. "<", "< i", "< i l", ...), then
// leaves a blinking cursor when done.
// ---------------------------------------------------------------------------
function Typewriter({ text, speed = 55, startDelay = 400, prefix = "< ", cursorChar = "_", onComplete }) {
  const [out, setOut] = useState("");

  useEffect(() => {
    let cancelled = false;
    let typeInterval;

    const initialDelay = setTimeout(() => {
      let i = 0;
      typeInterval = setInterval(() => {
        if (cancelled) return;
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(typeInterval);
          if (onComplete) onComplete();
        }
      }, speed);
    }, startDelay);

    return () => {
      cancelled = true;
      clearTimeout(initialDelay);
      clearInterval(typeInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, startDelay]);

  return (
    <span className="typewriter">
      {prefix && <span className="typewriter-prefix">{prefix}</span>}
      {out}
      <span className="typewriter-cursor">{cursorChar}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// useGlassLight — liquid glass catches light from the pointer: each
// .liquid-glass surface gets --gx/--gy (pointer position relative to it),
// which its specular highlight follows. Fine pointers only.
// ---------------------------------------------------------------------------
function useGlassLight(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    let raf = 0;
    let x = 0;
    let y = 0;
    const update = () => {
      raf = 0;
      // Background parallax: -1..1 from the viewport centre.
      const root = document.documentElement.style;
      root.setProperty("--px", ((x / window.innerWidth) * 2 - 1).toFixed(3));
      root.setProperty("--py", ((y / window.innerHeight) * 2 - 1).toFixed(3));
      document.querySelectorAll(".liquid-glass").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        el.style.setProperty("--gx", `${(((x - r.left) / r.width) * 100).toFixed(1)}%`);
        el.style.setProperty("--gy", `${(((y - r.top) / r.height) * 100).toFixed(1)}%`);
      });
    };
    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);
}

// ---------------------------------------------------------------------------
// ProfileUser — one Discord-linked row (avatar, status, tag, badges, status line)
// ---------------------------------------------------------------------------
function ProfileUser({ presence, name, avatar, fallbackName, badgeIds }) {
  const avatarUrl = avatar || getDiscordAvatarUrl(presence?.discord_user) || "https://cdn.discordapp.com/embed/avatars/0.png";
  const username = name || presence?.discord_user?.global_name || presence?.discord_user?.username || fallbackName;
  const guildTag = getGuildTag(presence);
  const guildBadgeUrl = getGuildBadgeUrl(presence);
  const decorationUrl = getAvatarDecorationUrl(presence);
  const nameplateUrl = getNameplateUrl(presence);
  const customStatus = getCustomStatus(presence);
  const spotify = presence?.listening_to_spotify ? presence?.spotify : null;
  const activity = getPrimaryActivity(presence);
  const platforms = getActivePlatforms(presence);
  const albumArt = spotify?.album_art_url;

  let mainLine, secondaryLine;
  if (spotify) {
    mainLine = `${spotify.song}`;
    secondaryLine = spotify.artist;
  } else {
    mainLine = customStatus || activity || "";
    secondaryLine = customStatus && activity ? activity : null;
  }

  return (
    <Glass className={`duo-row${nameplateUrl ? " has-nameplate" : ""}`} glass={{ bezel: 20, refraction: 36 }}>
      {nameplateUrl && <img className="nameplate-bg" src={nameplateUrl} alt="" />}
      <div className="avatar-wrap avatar-wrap-sm">
        <img className="avatar avatar-sm" src={avatarUrl} alt={username} />
        {decorationUrl && <img className="avatar-decoration" src={decorationUrl} alt="" />}
        <StatusDot status={presence?.discord_status} />
      </div>
      <div className="duo-info">
        <div className="duo-name-line">
          <span className="duo-name hover-glow">{username}</span>
          {guildTag && (
            <span className="guild-tag">
              {guildBadgeUrl && <img className="guild-tag-icon" src={guildBadgeUrl} alt="" />}
              {guildTag}
            </span>
          )}
          <Badges ids={badgeIds} />
          <PlatformIndicators platforms={platforms} />
        </div>
        <div className="duo-status-line">{mainLine}</div>
        {secondaryLine && <div className="duo-activity-line">{secondaryLine}</div>}
      </div>
      {albumArt && <img className="duo-album-art" src={albumArt} alt="" />}
    </Glass>
  );
}

// ---------------------------------------------------------------------------
// VideoBackground — fixed full-viewport video, immune to zoom/scroll
// ---------------------------------------------------------------------------
// Giant outlined name scrolling behind everything.
function BackgroundMarquee() {
  const run = Array.from({ length: 6 }, () => DisplayName.toUpperCase()).join(" \u2014 ");
  return (
    <div className="bg-marquee" aria-hidden="true">
      <div className="bg-marquee-track">
        <span>{`${run} \u2014 `}</span>
        <span>{`${run} \u2014 `}</span>
      </div>
    </div>
  );
}

function VideoBackground() {
  if (UsePhotoBackground) {
    return (
      <>
        <div className="photo-bg" style={{ backgroundImage: `url(${BackgroundPhotoUrl})` }} />
        <div className="video-bg-overlay" />
        <BackgroundMarquee />
      </>
    );
  }
  return (
    <>
      <video className="video-bg" src={BannerVideoUrl} autoPlay muted loop playsInline />
      <div className="video-bg-overlay" />
    </>
  );
}

function StatusDot({ status }) {
  const color = StatusColors[status] || StatusColors.offline;
  return (
    <span
      className="status-dot"
      style={{ backgroundColor: color, "--status-glow": color }}
    />
  );
}

// ---------------------------------------------------------------------------
// DeviceOverlay — full-bleed image overlay triggered by typing "device"
// anywhere on the page. No dismiss button, no timeout — only a refresh
// clears it.
// ---------------------------------------------------------------------------
function DeviceOverlay() {
  return (
    <div className="device-overlay">
      <img className="device-overlay-img" src="/device.png" alt="" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// HeartOverlay — cottagecore-styled note triggered by typing "heart"
// anywhere on the page. Shows the message first (with floating hearts),
// then fades into the video once typing finishes. Click the backdrop or
// press Escape to close.
// ---------------------------------------------------------------------------
const HeartMessage =
  "i love you, ayianna. and i always will — i don't know what i'd do without you. " +
  "i hope you find someone else here. here's a video you made for us, for our 9 month anniversary.";
const HeartSequence = [
  "https://res.cloudinary.com/dwrd1ukva/video/upload/v1787868763/0828_1_vxzlm5.mp4",
  "https://res.cloudinary.com/dwrd1ukva/video/upload/v1787867758/Desktop_2026.05.25_-_02.11.03.20_-_Trim_jpp1rk.mp4",
  "https://res.cloudinary.com/dwrd1ukva/video/upload/v1787867741/19ce4f5b8b872-master_playlist_q5map5.mov",
  "https://res.cloudinary.com/dwrd1ukva/video/upload/v1787867741/19b525556fa69-master_playlist_hhpazs.mov",
];
const HeartSongUrl =
  "https://res.cloudinary.com/dwrd1ukva/video/upload/v1787868073/0828_naxyw5.mp3";
const HeartEmojis = ["❤️", "💗", "💕", "🤍", "💖"];
const BubbleClips = HeartSequence.slice(1); // the "other" videos, used as bubble previews

const BubbleLayout = [
  { size: 62, top: "6%", left: "4%", delay: "0s", dur: "9s" },
  { size: 42, top: "12%", left: "86%", delay: "1.4s", dur: "11s" },
  { size: 52, top: "72%", left: "8%", delay: "2.6s", dur: "10s" },
  { size: 38, top: "80%", left: "82%", delay: "0.8s", dur: "8.5s" },
  { size: 32, top: "42%", left: "-2%", delay: "3.4s", dur: "12s" },
  { size: 36, top: "38%", left: "94%", delay: "2s", dur: "9.5s" },
];

function FloatingHearts() {
  return (
    <div className="heart-floaties" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className="heart-floaty"
          style={{
            left: `${6 + ((i * 9) % 88)}%`,
            fontSize: `${13 + (i % 3) * 6}px`,
            animationDelay: `${(i * 0.35).toFixed(2)}s`,
            animationDuration: `${3 + (i % 3) * 0.6}s`,
          }}
        >
          {HeartEmojis[i % HeartEmojis.length]}
        </span>
      ))}
    </div>
  );
}

function HeartBubbleDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <clipPath id="heart-bubble-clip" clipPathUnits="objectBoundingBox">
          <path d="M0.5,0.3 C0.35,0.05 0,0.15 0,0.4 C0,0.65 0.25,0.8 0.5,1 C0.75,0.8 1,0.65 1,0.4 C1,0.15 0.65,0.05 0.5,0.3 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

function HeartBubbles() {
  return (
    <div className="heart-bubbles" aria-hidden="true">
      {BubbleLayout.map((b, i) => (
        <div
          key={i}
          className="heart-bubble"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            animationDelay: b.delay,
            animationDuration: b.dur,
          }}
        >
          <video
            src={BubbleClips[i % BubbleClips.length]}
            muted
            autoPlay
            loop
            playsInline
          />
        </div>
      ))}
    </div>
  );
}

function HeartOverlay({ onClose }) {
  const [phase, setPhase] = useState("message"); // "message" | "video"
  const [videoIndex, setVideoIndex] = useState(0);
  const transitionTimeout = useRef(null);
  const audioRef = useRef(null);
  const songStartedRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => () => clearTimeout(transitionTimeout.current), []);

  // Reset the "song already started" flag whenever the queue loops back
  // to the first video, so the song re-cues 1s before it ends again.
  useEffect(() => {
    if (videoIndex === 0) songStartedRef.current = false;
  }, [videoIndex]);

  const handleMessageDone = useCallback(() => {
    transitionTimeout.current = setTimeout(() => setPhase("video"), 1200);
  }, []);

  const handleVideoTimeUpdate = useCallback((e) => {
    if (videoIndex !== 0 || songStartedRef.current) return;
    const v = e.currentTarget;
    if (v.duration && v.duration - v.currentTime <= 1) {
      songStartedRef.current = true;
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    }
  }, [videoIndex]);

  const handleVideoEnded = useCallback(() => {
    setVideoIndex((i) => (i + 1) % HeartSequence.length);
  }, []);

  return (
    <div className="heart-overlay" onClick={onClose}>
      <HeartBubbleDefs />
      {phase === "video" && <HeartBubbles />}
      <div className={`heart-panel heart-panel-${phase}`} onClick={(e) => e.stopPropagation()}>
        <span className="heart-petal heart-petal-1">🌸</span>
        <span className="heart-petal heart-petal-2">🤍</span>
        <span className="heart-petal heart-petal-3">🌸</span>
        <button className="heart-close" onClick={onClose} aria-label="Close">×</button>

        {phase === "message" ? (
          <div className="heart-message-stage">
            <FloatingHearts />
            <p className="heart-text">
              <Typewriter
                text={HeartMessage}
                speed={32}
                startDelay={250}
                prefix=""
                cursorChar="|"
                onComplete={handleMessageDone}
              />
            </p>
          </div>
        ) : (
          <div className="heart-video-wrap">
            <video
              key={videoIndex}
              className="heart-video"
              src={HeartSequence[videoIndex]}
              autoPlay
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
            <audio ref={audioRef} src={HeartSongUrl} preload="auto" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { data: presence } = useLanyard(DiscordId);
  const { count: viewsCount, popups } = useViews(ViewsEndpoint);

  const [entered, setEntered] = useState(false);
  const [enterScreenMounted, setEnterScreenMounted] = useState(true);
  const [cardVisible, setCardVisible] = useState(false);

  const [spotifyVisible, setSpotifyVisible] = useState(false);
  const [spotifyLeaving, setSpotifyLeaving] = useState(false);
  const spotifyUnmountTimeout = useRef(null);
  const [lastSpotify, setLastSpotify] = useState(null);

  const [deviceOverlay, setDeviceOverlay] = useState(false);
  const [heartOverlay, setHeartOverlay] = useState(false);
  const typedBuffer = useRef("");

  const spotify = presence?.listening_to_spotify ? presence.spotify : null;
  const username = DisplayName;

  // Which page is showing. Mirrored in the URL hash so /#portfolio links
  // straight to the portfolio page.
  const [view, setView] = useState(pageFromHash);
  useEffect(() => {
    const onHash = () => setView(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  // Page transitions: the current page slides out toward where you came
  // from, then the next one slides in from the direction you're heading
  // (tabs to the right come in from the right; project details go deeper).
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);
  const [swap, setSwap] = useState({ phase: "in", dir: 1 });
  const swapTimer = useRef(0);
  useEffect(() => () => clearTimeout(swapTimer.current), []);

  const goTo = useCallback((next) => {
    const hash = next === "profile" ? "" : `#${next}`;
    window.history.replaceState(null, "", `${BasePath}${window.location.search}${hash}`);
    const current = viewRef.current;
    if (next === current) return;
    const dir = pageRank(next) >= pageRank(current) ? 1 : -1;
    clearTimeout(swapTimer.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView(next);
      return;
    }
    setSwap({ phase: "out", dir });
    swapTimer.current = setTimeout(() => {
      setView(next);
      setSwap({ phase: "in", dir });
    }, 190);
  }, []);

  const activeTab = Ventures.some((v) => v.id === view) ? "projects" : view;

  // Tab bar: one white pill that glides to the active tab.
  const [indicatorReady, setIndicatorReady] = useState(false);
  useLayoutEffect(() => {
    if (!entered) return;
    const nav = document.querySelector(".page-tabs");
    const pill = nav?.querySelector(".tab-indicator");
    if (!nav || !pill) return;
    const place = () => {
      const btn = nav.querySelector(".page-tab.is-active");
      if (!btn) {
        pill.style.opacity = "0";
        return;
      }
      pill.style.opacity = "1";
      pill.style.width = `${btn.offsetWidth}px`;
      pill.style.transform = `translateX(${btn.offsetLeft}px)`;
    };
    place();
    const ro = new ResizeObserver(place);
    nav.querySelectorAll(".page-tab").forEach((b) => ro.observe(b));
    const t = setTimeout(() => setIndicatorReady(true), 60);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [activeTab, entered]);

  // Business inquiries sheet.
  const [contactOpen, setContactOpen] = useState(false);
  const openContact = useCallback(() => setContactOpen(true), []);
  const closeContact = useCallback(() => setContactOpen(false), []);

  // Easter egg: type the secret word anywhere (outside text boxes) and the
  // whole site flashes, inverts and the background name races for a few
  // seconds.
  const [egg, setEgg] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const closeAdmin = useCallback(() => setAdminOpen(false), []);
  const lastTypedAt = useRef(0);
  useEffect(() => {
    if (!entered) return;
    let buffer = "";
    let timer = 0;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (e.target instanceof Element && e.target.closest("input, textarea")) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-24);
      if (/[a-z]/i.test(e.key)) lastTypedAt.current = Date.now();
      // Admin word opens the admin panel (which then asks for the password).
      if (AdminWord && buffer.endsWith(AdminWord.toLowerCase())) {
        buffer = "";
        setAdminOpen(true);
        return;
      }
      if (!buffer.endsWith(SecretWord.toLowerCase())) return;
      buffer = "";
      setEgg(false);
      requestAnimationFrame(() => setEgg(true));
      clearTimeout(timer);
      timer = setTimeout(() => setEgg(false), 7000);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [entered]);

  // Number keys jump between pages (ignored while typing).
  useEffect(() => {
    if (!entered) return;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest("input, textarea")) return;
      if (adminOpen || contactOpen) return;
      // A digit typed straight after letters is part of a word (e.g. the
      // admin word), not a page shortcut.
      if (/^[0-9]$/.test(e.key) && Date.now() - lastTypedAt.current < 1500) {
        lastTypedAt.current = Date.now();
        return;
      }
      const page = Pages[parseInt(e.key, 10) - 1];
      if (page) goTo(page.id);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [entered, goTo, adminOpen, contactOpen]);

  // Keep the active tab visible when the tab bar scrolls (phones).
  useEffect(() => {
    if (!entered) return;
    const tab = document.querySelector(".page-tab.is-active");
    tab?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [view, entered]);

  // The Dynamic Island owns the audio; the music page drives it
  // through playerApi and follow it through playerState.
  const playerApi = useRef(null);
  const [playerState, setPlayerState] = useState({ index: 0, playing: false });

  const handleEnter = useCallback(() => {
    setEntered(true);
    setTimeout(() => setCardVisible(true), 50);
  }, []);
  const handleEnterExited = useCallback(() => setEnterScreenMounted(false), []);
  useGlassLight(entered);

  useEffect(() => {
    const block = (e) => { e.preventDefault(); return false; };
    document.addEventListener("contextmenu", block, true);
    return () => document.removeEventListener("contextmenu", block, true);
  }, []);

  useEffect(() => {
    const blockZoom = (e) => {
      if (e.ctrlKey && (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")) {
        e.preventDefault();
      }
    };
    const blockWheelZoom = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };
    document.addEventListener("keydown", blockZoom);
    document.addEventListener("wheel", blockWheelZoom, { passive: false });
    return () => {
      document.removeEventListener("keydown", blockZoom);
      document.removeEventListener("wheel", blockWheelZoom);
    };
  }, []);

  // "device" / "heart" easter eggs — typed anywhere on the page.
  // Each is independently toggleable via DeviceEasterEggEnabled /
  // HeartEasterEggEnabled at the top of the file — set to false to
  // disable one without touching the rest of the code.
  // "device" stays up permanently once triggered (until refresh).
  // "heart" can be dismissed (click backdrop / Escape) and can retrigger.
  useEffect(() => {
    if (!DeviceEasterEggEnabled && !HeartEasterEggEnabled) return;

    const onKeyDown = (e) => {
      if (e.key.length !== 1) return;
      typedBuffer.current = (typedBuffer.current + e.key.toLowerCase()).slice(-20);
      if (DeviceEasterEggEnabled && !deviceOverlay && typedBuffer.current.endsWith("device")) {
        setDeviceOverlay(true);
      }
      if (HeartEasterEggEnabled && !heartOverlay && typedBuffer.current.endsWith("heart")) {
        setHeartOverlay(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deviceOverlay, heartOverlay]);

  useEffect(() => {
    if (spotify) {
      clearTimeout(spotifyUnmountTimeout.current);
      setLastSpotify(spotify);
      setSpotifyLeaving(false);
      setSpotifyVisible(true);
      return;
    }
    if (spotifyVisible) {
      setSpotifyLeaving(true);
      spotifyUnmountTimeout.current = setTimeout(() => {
        setSpotifyVisible(false);
        setSpotifyLeaving(false);
      }, 420);
    }
    return () => clearTimeout(spotifyUnmountTimeout.current);
  }, [spotify, spotifyVisible]);

  const enterScreen = enterScreenMounted && (
    <Intro
      onEnter={handleEnter}
      onExited={handleEnterExited}
      leaving={entered}
    />
  );

  // Page and enter screen are siblings in a stable order, so the enter screen
  // keeps its DOM node (and can transition out) when the page mounts.
  return (
    <>
    {entered && (
    <div className={`page${egg ? " is-egg" : ""}`}>
      <VideoBackground />
      <div
        className={`page-row swap-${swap.phase}`}
        style={{ "--swap-dir": swap.dir }}
      >
        {Ventures.some((v) => v.id === view) ? (
          <Venture key={view} venture={Ventures.find((v) => v.id === view)} onBack={() => goTo("projects")} />
        ) : view === "projects" ? (
          <Projects ventures={Ventures} onOpen={goTo} />
        ) : view === "links" ? (
          <Portfolio onContact={openContact} />
        ) : view === "guestbook" && GuestbookEndpoint ? (
          <Guestbook endpoint={GuestbookEndpoint} />
        ) : view === "notfound" ? (
          <NotFound onHome={() => goTo("profile")} />
        ) : view === "music" ? (
          <Music tracks={Tracks} player={playerState} playerApi={playerApi} spotify={spotify} />
        ) : (
        <div key="profile" className={`card pf-card home-card${cardVisible ? " card-entered" : ""}`}>
        <div className="hero-block">
          <PageTitle text={username} />
          {BioText && (
            <div className="hero-bio">
              <Typewriter text={BioText} />
            </div>
          )}
        </div>

        <ProfileUser
          presence={presence}
          name={DisplayName}
          avatar={PfpUrl}
          fallbackName={DisplayName}
          badgeIds={["crown", "developer", "verified"]}
        />

        <div className="meta-row">
          <span className="meta-item" aria-label="page views">
            <svg className="meta-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
            <span><CountUp value={viewsCount} delay={600} /></span>
            {popups.map((popup) => (
              <span key={popup.id} className="view-popup">+1</span>
            ))}
          </span>
          <span className="meta-item">
            <svg className="meta-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <circle cx="12" cy="9" r="2.3" fill="currentColor" />
            </svg>
            <span>{LocationText}</span>
          </span>
        </div>

        <div className="icon-row">
        {Links.map((icon) => (
          <a
            key={icon.id}
            href={icon.href}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-link"
            aria-label={icon.id}
          >
            <img
              src={icon.src}
              alt={icon.id}
              className="icon-img"
            />
          </a>
        ))}
        <ContactButton onOpen={openContact} />
      </div>

        <div className="home-projects">
          {Ventures.map((v) => (
            <ProjectTile key={v.id} venture={v} onOpen={goTo} compact />
          ))}
        </div>

        <div
          className={`lyric-slot${spotifyVisible ? " is-active" : ""}`}
          aria-hidden={!spotifyVisible}
        >
          <div className={`lyric-block${spotifyLeaving ? " lyric-block-leaving" : ""}`}>
            <LyricsCard spotify={lastSpotify} />
          </div>
        </div>
      </div>
        )}
      </div>

      <Glass
        as="nav"
        className={`page-tabs${indicatorReady ? " has-indicator" : ""}`}
        aria-label="Pages"
        glass={{ bezel: 14, refraction: 24 }}
      >
        <span className="tab-indicator" aria-hidden="true" />
        {Pages.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`page-tab${activeTab === id ? " is-active" : ""}`}
            aria-current={activeTab === id ? "page" : undefined}
            onClick={() => goTo(id)}
          >
            {label}
          </button>
        ))}
      </Glass>

      {egg && (
        <div className="egg-toast" role="status">
          <span className="egg-toast-dot" />
          you found the secret
        </div>
      )}
      {egg && <div className="egg-flash" aria-hidden="true" />}

      <DynamicIsland tracks={Tracks} apiRef={playerApi} onStateChange={setPlayerState} />
      {DeviceEasterEggEnabled && deviceOverlay && <DeviceOverlay />}
      {HeartEasterEggEnabled && heartOverlay && <HeartOverlay onClose={() => setHeartOverlay(false)} />}
    </div>
    )}
    {enterScreen}
    <ContactSheet
      open={contactOpen}
      onClose={closeContact}
      discordHref={Links.find((l) => l.id === "discord")?.href}
      discordUsername={presence?.discord_user?.username}
      email={ContactEmail}
    />
    <AdminPanel open={adminOpen} onClose={closeAdmin} endpoint={GuestbookEndpoint} views={viewsCount} />
    <Cursor />
    </>
  );
}
