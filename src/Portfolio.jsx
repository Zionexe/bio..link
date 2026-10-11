import Glass from "./Glass";
import { Kicker } from "./Motion";
import { PageTitle } from "./Text";
import { DisplayName, Links, Ventures } from "./links";
import { ContactButton } from "./Contact";
import "./Portfolio.css";

// ---------------------------------------------------------------------------
// Links page — every place to find zion: socials first, then each project's
// Discord and website. Everything here reads from links.js.
// ---------------------------------------------------------------------------

const ArrowIcon = () => (
  <svg className="pf-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
    <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="pf-link-icon pf-link-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

function LinkRow({ href, icon, label, handle }) {
  return (
    <Glass
      as="a"
      className="pf-link pf-clickable"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      glass={{ bezel: 16, refraction: 28 }}
    >
      {icon}
      <span className="pf-link-text">
        <span className="pf-link-label">{label}</span>
        <span className="pf-link-handle">{handle}</span>
      </span>
      <ArrowIcon />
    </Glass>
  );
}

const shortUrl = (href) => href.replace(/^https?:\/\//, "").replace(/\/$/, "");

export default function LinksPage({ onContact }) {
  return (
    <div className="card card-entered pf-card">
      <div className="hero-block">
        <Kicker text={`find ${DisplayName}`} />
        <PageTitle text="Links" />
      </div>

      <section className="pf-section">
        <h2 className="pf-heading">socials</h2>
        <div className="pf-links">
          {Links.map((l) => (
            <LinkRow
              key={l.id}
              href={l.href}
              icon={<img className="pf-link-icon" src={l.src} alt="" />}
              label={l.label}
              handle={l.handle}
            />
          ))}
        </div>
      </section>

      <section className="pf-section">
        <h2 className="pf-heading">business</h2>
        <ContactButton onOpen={onContact} wide />
      </section>

      <section className="pf-section">
        <h2 className="pf-heading">projects</h2>
        <div className="pf-links">
          {Ventures.flatMap((v) =>
            v.links.map((l) => (
              <LinkRow
                key={l.href}
                href={l.href}
                icon={
                  l.kind === "discord" ? (
                    <img className="pf-link-icon" src="https://cdn.simpleicons.org/discord/ffffff" alt="" />
                  ) : (
                    <GlobeIcon />
                  )
                }
                label={v.name}
                handle={shortUrl(l.href)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
