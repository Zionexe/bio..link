import Glass from "./Glass";
import { CountUp, Kicker } from "./Motion";
import { PageTitle } from "./Text";
import { useInvite, formatCount } from "./discordInvite";

// ---------------------------------------------------------------------------
// Projects — the grid of everything zion runs. Each tile shows the project's
// Discord server icon and live online count, and opens its detail page.
// ProjectTile is also used (compact) on the home page.
// ---------------------------------------------------------------------------

export function ServerIcon({ server, name, size = "md" }) {
  const letter = (name || "?").replace(/[^a-z0-9]/gi, "")[0]?.toUpperCase() || "?";
  return server?.icon ? (
    <img className={`srv-icon srv-icon-${size}`} src={server.icon} alt="" />
  ) : (
    <span className={`srv-icon srv-icon-${size} srv-icon-blank`} aria-hidden="true">{letter}</span>
  );
}

const Arrow = () => (
  <svg className="pt-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 3D tilt toward the pointer, with a glare spot that follows it.
const canTilt = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function onTiltMove(e) {
  if (!canTilt()) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  const max = el.classList.contains("pt-compact") ? 6 : 9;
  el.style.setProperty("--rx", `${((0.5 - y) * max).toFixed(2)}deg`);
  el.style.setProperty("--ry", `${((x - 0.5) * max).toFixed(2)}deg`);
  el.style.setProperty("--tx", `${(x * 100).toFixed(1)}%`);
  el.style.setProperty("--ty", `${(y * 100).toFixed(1)}%`);
  el.classList.add("is-tilting");
}

function onTiltLeave(e) {
  const el = e.currentTarget;
  el.classList.remove("is-tilting");
  el.style.setProperty("--rx", "0deg");
  el.style.setProperty("--ry", "0deg");
}

export function ProjectTile({ venture, onOpen, compact = false }) {
  const server = useInvite(venture.invite);
  const online = server?.online;
  return (
    <Glass
      as="button"
      type="button"
      className={`pt pf-clickable${compact ? " pt-compact" : ""}`}
      onClick={() => onOpen(venture.id)}
      onPointerMove={onTiltMove}
      onPointerLeave={onTiltLeave}
      glass={{ bezel: 16, refraction: 28 }}
    >
      <span className="pt-glare" aria-hidden="true" />
      <span className="pt-top">
        <ServerIcon server={server} name={venture.name} size={compact ? "sm" : "md"} />
        <span className="pt-head">
          <span className="pt-name">{venture.name}</span>
          <span className="pt-kicker">{venture.kicker}</span>
        </span>
        {compact && <Arrow />}
      </span>
      {!compact && (
        <>
          <span className="pt-tagline">{venture.tagline}</span>
          <span className="pt-foot">
            <span className="pt-online">
              {typeof online === "number" ? (
                <>
                  <i className="live-dot" />
                  <CountUp value={online} format={formatCount} delay={400} /> online
                </>
              ) : (
                "discord"
              )}
            </span>
            <Arrow />
          </span>
        </>
      )}
    </Glass>
  );
}

export default function Projects({ ventures, onOpen }) {
  return (
    <div className="card card-entered pf-card">
      <div className="hero-block">
        <Kicker text="what i run" />
        <PageTitle text="Projects" />
      </div>
      <div className="pt-grid">
        {ventures.map((v) => (
          <ProjectTile key={v.id} venture={v} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
