import { useEffect, useState } from "react";
import { CountUp, Kicker } from "./Motion";
import Glass from "./Glass";
import { PageTitle } from "./Text";

// ---------------------------------------------------------------------------
// Guestbook — visitors sign with a name and a short message. Talks to the
// guestbook function in /api (runs locally under npm run dev / preview,
// and on Vercel once Upstash Redis is connected).
// ---------------------------------------------------------------------------

const NAME_MAX = 24;
const MESSAGE_MAX = 280;

function timeAgo(ms) {
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Guestbook({ endpoint }) {
  const base = endpoint.replace(/\/+$/, "");
  const [entries, setEntries] = useState(null); // null = loading
  const [offline, setOffline] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState({ kind: "idle", text: "" });

  useEffect(() => {
    let cancelled = false;
    // On failure, keep the reason so it's obvious what's wrong:
    // 404 = the /api function isn't deployed, 503 = storage not connected.
    fetch(base)
      .then(async (r) => {
        const isJson = (r.headers.get("content-type") || "").includes("json");
        const d = isJson ? await r.json().catch(() => ({})) : {};
        if (!r.ok || !isJson) {
          const reason =
            d.error ||
            (r.status === 404 || !isJson ? "API not found (is /api deployed?)" : `server error ${r.status}`);
          throw new Error(reason);
        }
        return d;
      })
      .then((d) => { if (!cancelled) setEntries(d.entries || []); })
      .catch((err) => {
        if (cancelled) return;
        setOffline(err?.message && err.message !== "Failed to fetch" ? err.message : "can't reach the server");
        setEntries([]);
      });
    return () => { cancelled = true; };
  }, [base]);

  const submit = async (e) => {
    e.preventDefault();
    if (status.kind === "sending") return;
    setStatus({ kind: "sending", text: "signing…" });
    try {
      const r = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, website: honey }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "couldn't sign — try again");
      setEntries((prev) => [d.entry, ...(prev || [])]);
      setMessage("");
      setStatus({ kind: "ok", text: "signed. thank you" });
    } catch (err) {
      setStatus({ kind: "error", text: err.message || "couldn't sign — try again" });
    }
  };

  const canSend = name.trim() && message.trim().length >= 2 && status.kind !== "sending" && !offline;

  return (
    <div className="card card-entered pf-card">
      <div className="hero-block">
        <Kicker text="leave your mark" />
        <PageTitle text="Guestbook" />
      </div>

      <Glass as="form" className="gb-form" onSubmit={submit} glass={{ bezel: 18, refraction: 30 }}>
        <div className="gb-row">
          <input
            className="gb-input"
            placeholder="Your name"
            value={name}
            maxLength={NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            aria-label="Your name"
            autoComplete="nickname"
          />
          {/* Honeypot — hidden from people, irresistible to bots. */}
          <input
            className="gb-hp"
            tabIndex={-1}
            autoComplete="off"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
            aria-hidden="true"
            name="website"
          />
        </div>
        <textarea
          className="gb-input gb-text"
          placeholder="Say something…"
          value={message}
          maxLength={MESSAGE_MAX}
          rows={3}
          onChange={(e) => setMessage(e.target.value)}
          aria-label="Message"
        />
        <div className="gb-foot">
          <span className={`gb-status gb-status-${status.kind}`} aria-live="polite">
            {offline ? `offline — ${offline}` : status.text || `${message.length}/${MESSAGE_MAX}`}
          </span>
          <button type="submit" className="gb-send" disabled={!canSend}>
            sign
          </button>
        </div>
      </Glass>

      <section className="pf-section">
        <h2 className="pf-heading">
          {entries && entries.length > 0 ? (
            <>
              <CountUp value={entries.length} /> signature{entries.length === 1 ? "" : "s"}
            </>
          ) : (
            "signatures"
          )}
        </h2>
        {entries === null ? (
          <div className="lyc-skeleton gb-skeleton" aria-label="loading"><span /><span /><span /></div>
        ) : entries.length === 0 ? (
          <p className="gb-empty">{offline ? "Can't load messages right now." : "No one yet — be the first."}</p>
        ) : (
          <ul className="gb-list">
            {entries.map((en) => (
              <li key={en.id} className="gb-entry">
                <div className="gb-entry-head">
                  <span className="gb-name">{en.name}</span>
                  <span className="gb-time">{timeAgo(en.at)}</span>
                </div>
                <p className="gb-msg">{en.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
