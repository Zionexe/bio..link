import Glass from "./Glass";
import { CountUp, Kicker } from "./Motion";
import { PageTitle } from "./Text";
import { ServerIcon } from "./Projects";
import { useInvite, formatCount } from "./discordInvite";

// ---------------------------------------------------------------------------
// Venture — detail page for one project: back link, server icon + name,
// live Discord stats, the pitch, and call-to-action buttons.
// Data lives in links.js (Ventures).
// ---------------------------------------------------------------------------

const DiscordGlyph = () => (
  <img className="vn-btn-icon" src="https://cdn.simpleicons.org/discord/ffffff" alt="" />
);

const WebGlyph = () => (
  <svg className="vn-btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export default function Venture({ venture, onBack }) {
  const server = useInvite(venture.invite);
  const online = server?.online;
  const members = server?.members;
  const has = (n) => typeof n === "number";

  return (
    <div className="card card-entered pf-card vn-card">
      <div className="vn-header">
        <button type="button" className="vn-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          projects
        </button>
        <div className="vn-title-row">
          <ServerIcon server={server} name={venture.name} size="lg" />
          <div className="vn-title-text">
            <Kicker text={venture.kicker} delay={200} />
            <PageTitle text={venture.name} />
          </div>
        </div>
      </div>

      {(has(online) || has(members)) && (
        <div className="vn-stats">
          {has(online) && (
            <Glass className="vn-stat" glass={{ bezel: 14, refraction: 24 }}>
              <span className="vn-stat-num"><i className="live-dot" /><CountUp value={online} format={formatCount} delay={350} /></span>
              <span className="vn-stat-label">online now</span>
            </Glass>
          )}
          {has(members) && (
            <Glass className="vn-stat" glass={{ bezel: 14, refraction: 24 }}>
              <span className="vn-stat-num"><CountUp value={members} format={formatCount} delay={450} /></span>
              <span className="vn-stat-label">members</span>
            </Glass>
          )}
        </div>
      )}

      <Glass className="vn-pitch" glass={{ bezel: 20, refraction: 34 }}>
        <p className="vn-tagline">{venture.tagline}</p>
        {venture.description && <p className="vn-desc">{venture.description}</p>}
        {venture.features?.length > 0 && (
          <div className="vn-features">
            {venture.features.map((f) => (
              <span key={f} className="vn-feature">{f}</span>
            ))}
          </div>
        )}
      </Glass>

      <div className="vn-actions">
        {venture.links.map((l, i) => (
          <a
            key={l.href}
            className={`vn-btn${i === 0 ? " vn-btn-primary" : ""}`}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {l.kind === "discord" ? <DiscordGlyph /> : <WebGlyph />}
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
