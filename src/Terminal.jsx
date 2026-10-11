import { useEffect, useRef, useState } from "react";
import Glass from "./Glass";
import { PageTitle } from "./Text";

// ---------------------------------------------------------------------------
// Terminal — a tiny shell visitors can poke at. Every command reads real
// site data (Discord presence, links, playlist, projects), and `cd` moves
// between pages. Up/down walks history, Tab completes commands.
// ---------------------------------------------------------------------------

const PROMPT = "guest@zion:~$";

const STATUS_WORDS = {
  online: "online",
  idle: "idle",
  dnd: "do not disturb",
  offline: "offline",
};

function activityLine(presence) {
  if (!presence) return null;
  if (presence.listening_to_spotify && presence.spotify) {
    return `listening to ${presence.spotify.song} — ${presence.spotify.artist}`;
  }
  const custom = presence.activities?.find((a) => a.type === 4)?.state;
  const act = presence.activities?.find((a) => a.type !== 4 && a.type !== 2);
  const parts = [];
  if (act) parts.push(`playing ${act.name}${act.details ? ` — ${act.details}` : ""}`);
  if (custom) parts.push(`"${custom}"`);
  return parts.join(" · ") || null;
}

export default function Terminal({ name, location, presence, views, links, tracks, projects, pages, goTo, playerApi, player }) {
  const [lines, setLines] = useState(() => [
    { kind: "sys", text: `${name}'s bio — shell v1.0` },
    { kind: "sys", text: "type 'help' to see what you can do." },
  ]);
  const [input, setInput] = useState("");
  const history = useRef([]);
  const histPos = useRef(-1);
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const commands = {
    help: () => [
      "commands:",
      "  whoami          who runs this place",
      "  status          live discord status",
      "  links           where to find me",
      "  open <name>     open a link (e.g. open tiktok)",
      "  projects        things i made",
      "  music           the site playlist",
      "  play [n]        play a track · pause · next · prev",
      "  ls / cd <page>  list pages / go to one",
      "  views           page views",
      "  date · echo · clear",
    ],
    whoami: () => [name, `location: ${location}`],
    status: () => {
      if (!presence) return ["connecting to discord…"];
      const word = STATUS_WORDS[presence.discord_status] || presence.discord_status;
      const act = activityLine(presence);
      const devices = ["desktop", "mobile", "web"].filter((d) => presence[`active_on_discord_${d}`]);
      return [
        `discord: ${word}${devices.length ? ` (${devices.join(", ")})` : ""}`,
        ...(act ? [act] : []),
      ];
    },
    links: () => links.map((l) => `  ${l.id.padEnd(10)} ${l.handle}`),
    socials: () => commands.links(),
    open: (arg) => {
      const link = links.find((l) => l.id === arg?.toLowerCase());
      if (!link) return [`open: try one of ${links.map((l) => l.id).join(", ")}`];
      window.open(link.href, "_blank", "noopener,noreferrer");
      return [`opening ${link.label}…`];
    },
    projects: () => projects.flatMap((p) => [`  ${p.title}`, `    ${p.description}`]),
    music: () => tracks.map((t, i) => `  ${String(i + 1).padStart(2, "0")}  ${t.name}${player.index === i && player.playing ? "  ◂ playing" : ""}`),
    play: (arg) => {
      const n = parseInt(arg, 10);
      if (arg && (isNaN(n) || n < 1 || n > tracks.length)) return [`play: pick 1–${tracks.length}`];
      const i = arg ? n - 1 : player.index;
      playerApi.current?.play(i);
      return [`▶ ${tracks[i].name}`];
    },
    pause: () => {
      playerApi.current?.pause();
      return ["paused"];
    },
    next: () => {
      playerApi.current?.next();
      return [`▶ ${tracks[(player.index + 1) % tracks.length].name}`];
    },
    prev: () => {
      playerApi.current?.prev();
      return [`▶ ${tracks[(player.index - 1 + tracks.length) % tracks.length].name}`];
    },
    ls: () => [pages.map((p) => p.id).join("   ")],
    cd: (arg) => {
      const target = !arg || arg === "~" || arg === ".." ? "profile" : arg.toLowerCase();
      if (!pages.some((p) => p.id === target)) return [`cd: no such page: ${arg}`];
      setTimeout(() => goTo(target), 250);
      return [`→ ${target}`];
    },
    views: () => [`${views.toLocaleString()} views`],
    date: () => [new Date().toString()],
    echo: (_, rest) => [rest],
    sudo: () => ["nice try."],
    rm: () => ["permission denied."],
    exit: () => {
      setTimeout(() => goTo("profile"), 250);
      return ["bye."];
    },
  };

  const run = (raw) => {
    const text = raw.trim();
    if (text) {
      history.current.push(text);
    }
    histPos.current = -1;
    if (text === "clear") {
      setLines([]);
      return;
    }
    const [cmd, ...args] = text.split(/\s+/);
    const fn = commands[cmd?.toLowerCase()];
    const out = !text ? [] : fn ? fn(args[0], args.join(" ")) : [`${cmd}: command not found — try 'help'`];
    setLines((prev) => [
      ...prev,
      { kind: "cmd", text },
      ...out.map((t) => ({ kind: "out", text: t })),
    ]);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const h = history.current;
      if (!h.length) return;
      e.preventDefault();
      let pos = histPos.current === -1 ? h.length : histPos.current;
      pos = e.key === "ArrowUp" ? Math.max(0, pos - 1) : pos + 1;
      if (pos >= h.length) {
        histPos.current = -1;
        setInput("");
      } else {
        histPos.current = pos;
        setInput(h[pos]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = Object.keys(commands).concat("clear").find((c) => c.startsWith(input.trim()) && input.trim());
      if (match) setInput(`${match} `);
    }
  };

  return (
    <div className="card card-entered pf-card">
      <div className="hero-block">
        <PageTitle text="terminal" />
        <div className="hero-bio">poke around</div>
      </div>

      <Glass className="term" glass={{ bezel: 18, refraction: 30 }} onClick={() => inputRef.current?.focus()}>
        <div className="term-bar" aria-hidden="true">
          <i /><i /><i />
          <span>zion — bash</span>
        </div>
        <div className="term-body" ref={bodyRef} aria-live="polite">
          {lines.map((l, i) => (
            <div key={i} className={`term-line term-${l.kind}`}>
              {l.kind === "cmd" && <span className="term-prompt">{PROMPT}</span>}
              {l.text}
            </div>
          ))}
          <label className="term-input-row">
            <span className="term-prompt">{PROMPT}</span>
            <input
              ref={inputRef}
              className="term-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Terminal input"
            />
          </label>
        </div>
      </Glass>
    </div>
  );
}
