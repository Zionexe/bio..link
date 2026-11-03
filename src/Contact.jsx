import { useEffect, useRef, useState } from "react";
import { Kicker } from "./Motion";
import Glass from "./Glass";

// ---------------------------------------------------------------------------
// Business inquiries — a pill button that opens a sheet with every way to
// reach zion: Discord message, copy Discord username, and email (when
// ContactEmail is set in links.js). Esc or clicking outside closes it.
// ---------------------------------------------------------------------------

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="2" />
    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export function ContactButton({ onOpen, wide = false }) {
  return (
    <button type="button" className={`contact-btn${wide ? " contact-btn-wide" : ""}`} onClick={onOpen}>
      <MailIcon />
      business inquiries
    </button>
  );
}

// Share — on phones opens the native share sheet; on desktop copies the
// site link and calls onCopied (the page shows a "link copied" toast).
export function ShareButton({ title, onCopied }) {
  const share = async () => {
    const url = `${window.location.origin}/`;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return; // closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      onCopied?.();
    } catch { /* clipboard blocked */ }
  };
  return (
    <button type="button" className="icon-link share-btn" onClick={share} aria-label="Share this page">
      <svg className="icon-img" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v12M7 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function ContactSheet({ open, onClose, discordHref, discordUsername, email }) {
  const [copied, setCopied] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 50);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open, onClose]);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(discordUsername);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="contact-overlay" onClick={onClose}>
      <Glass
        className="contact-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        onClick={(e) => e.stopPropagation()}
        glass={{ bezel: 22, refraction: 36 }}
      >
        <button ref={closeRef} type="button" className="contact-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        <Kicker text="get in touch" />
        <h2 id="contact-title" className="contact-title">Business inquiries</h2>
        <p className="contact-sub">Collabs, orders, bot setups, sites — reach out here.</p>

        <div className="contact-options">
          <a className="contact-opt contact-opt-primary" href={discordHref} target="_blank" rel="noopener noreferrer">
            <img src="https://cdn.simpleicons.org/discord/ffffff" alt="" />
            message on discord
          </a>
          {discordUsername && (
            <button type="button" className="contact-opt" onClick={copy}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <rect x="8" y="8" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="2" />
              </svg>
              {copied ? "copied!" : `copy @${discordUsername}`}
            </button>
          )}
          {email && (
            <a className="contact-opt" href={`mailto:${email}?subject=${encodeURIComponent("Business inquiry")}`}>
              <MailIcon />
              {email}
            </a>
          )}
        </div>
      </Glass>
    </div>
  );
}
