import { useCallback, useEffect, useRef, useState } from "react";
import Glass from "./Glass";
import { Kicker } from "./Motion";
import { Themes } from "./themes";

// ---------------------------------------------------------------------------
// Admin panel — opened by typing the AdminWord (links.js) anywhere.
// Opening it shows nothing private: you sign in with the ADMIN_TOKEN, which
// the server checks. Once in, you can read and delete guestbook messages.
// The password is kept for this browser tab only (sessionStorage).
// ---------------------------------------------------------------------------

const KEY = "zion-admin-token";

const readToken = () => {
  try { return sessionStorage.getItem(KEY) || ""; } catch { return ""; }
};
const writeToken = (t) => {
  try {
    if (t) sessionStorage.setItem(KEY, t);
    else sessionStorage.removeItem(KEY);
  } catch { /* storage blocked */ }
};

function when(ms) {
  return new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const dayLabel = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);

export default function AdminPanel({ open, onClose, endpoint, viewsEndpoint, views, settingsEndpoint, theme, onThemeChange }) {
  const [token, setToken] = useState(readToken);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState(null);
  const [viewStats, setViewStats] = useState(null); // { total, days: [{ date, count }] }
  const inputRef = useRef(null);

  const auth = useCallback((t) => ({ Authorization: `Bearer ${t}` }), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open, onClose]);

  const loadStats = useCallback(async (t) => {
    if (!viewsEndpoint || !t) return;
    try {
      const r = await fetch(`${viewsEndpoint}?stats=admin`, { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) setViewStats(await r.json());
    } catch { /* counter offline — tiles show "—" */ }
  }, [viewsEndpoint]);

  const load = useCallback(async () => {
    loadStats(readToken());
    if (!endpoint) return;
    try {
      const r = await fetch(endpoint);
      const d = await r.json();
      setEntries(d.entries || []);
    } catch {
      setStatus("Couldn't load messages.");
    }
  }, [endpoint, loadStats]);

  // Re-check a saved password when the panel opens.
  useEffect(() => {
    if (!open || !token || !endpoint) return;
    let cancelled = false;
    fetch(`${endpoint}?check=admin`, { headers: auth(token) })
      .then((r) => {
        if (cancelled) return;
        if (r.ok) load();
        else { writeToken(""); setToken(""); }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, token, endpoint, auth, load]);

  if (!open) return null;

  const signIn = async (e) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const r = await fetch(`${endpoint}?check=admin`, { headers: auth(password) });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(
          r.status === 401 ? "Wrong password." : r.status === 429 ? (d.error || "Too many tries — wait 15 minutes.") : "Server unavailable."
        );
      }
      writeToken(password);
      setToken(password);
      setPassword("");
    } catch (err) {
      setStatus(err.message || "Server unavailable.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      const r = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: auth(token) });
      if (r.status === 401) { writeToken(""); setToken(""); throw new Error("Signed out — password changed?"); }
      if (!r.ok) throw new Error("Couldn't delete.");
      setEntries((list) => (list || []).filter((e) => e.id !== id));
      setStatus("Deleted.");
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Seasonal theme — saved on the server, so every visitor gets it.
  const saveTheme = async (id) => {
    if (!settingsEndpoint || busy || id === theme) return;
    setBusy(true);
    setStatus("Saving theme…");
    try {
      const r = await fetch(settingsEndpoint, {
        method: "POST",
        headers: { ...auth(token), "Content-Type": "application/json" },
        body: JSON.stringify({ theme: id }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) { writeToken(""); setToken(""); throw new Error("Signed out — password changed?"); }
      if (!r.ok) throw new Error(d.error || "Couldn't save theme.");
      onThemeChange?.(d.theme);
      setStatus(`Theme saved — everyone sees ${Themes.find((t) => t.id === d.theme)?.label || d.theme} now.`);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    writeToken("");
    setToken("");
    setEntries(null);
    setViewStats(null);
    setStatus("");
  };

  const today = viewStats?.days?.[viewStats.days.length - 1]?.count;
  const peak = Math.max(1, ...(viewStats?.days || []).map((d) => d.count));

  return (
    <div className="contact-overlay admin-overlay" onClick={onClose}>
      <Glass
        className="contact-sheet admin-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-title"
        onClick={(e) => e.stopPropagation()}
        glass={{ bezel: 22, refraction: 36 }}
      >
        <button type="button" className="contact-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        <Kicker text={token ? "Signed in" : "Restricted"} />
        <h2 id="admin-title" className="contact-title">Admin panel</h2>

        {!endpoint ? (
          <p className="contact-sub">The guestbook API isn't set up, so there's nothing to manage yet.</p>
        ) : !token ? (
          <form className="admin-login" onSubmit={signIn}>
            <p className="contact-sub">Enter your admin password to continue.</p>
            <input
              ref={inputRef}
              className="gb-input"
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-label="Admin password"
            />
            <button type="submit" className="gb-send admin-go" disabled={!password || busy}>
              {busy ? "Checking…" : "Sign in"}
            </button>
            {status && <p className="admin-status" role="alert">{status}</p>}
          </form>
        ) : (
          <>
            <div className="admin-stats admin-stats-3">
              <div className="admin-stat">
                <span className="admin-stat-num">
                  {(viewStats?.total ?? views)?.toLocaleString?.() ?? "—"}
                </span>
                <span className="admin-stat-label">Total views</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-num">{typeof today === "number" ? today.toLocaleString() : "—"}</span>
                <span className="admin-stat-label">Today</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-num">{entries ? entries.length : "—"}</span>
                <span className="admin-stat-label">Messages</span>
              </div>
            </div>

            {viewStats?.days && (
              <div className="admin-chart" aria-label="Unique visitors, last 7 days">
                <span className="admin-stat-label">Visitors — last 7 days</span>
                <div className="admin-chart-bars">
                  {viewStats.days.map((d, i) => (
                    <div
                      key={d.date}
                      className={`admin-chart-bar${i === viewStats.days.length - 1 ? " is-today" : ""}`}
                      title={`${d.date}: ${d.count}`}
                    >
                      <span style={{ height: `${(d.count / peak) * 100}%` }} />
                    </div>
                  ))}
                </div>
                <div className="admin-chart-days" aria-hidden="true">
                  {viewStats.days.map((d) => <span key={d.date}>{dayLabel(d.date)}</span>)}
                </div>
              </div>
            )}

            {settingsEndpoint && (
              <div className="admin-chart">
                <span className="admin-stat-label">Site theme — saved for every visitor</span>
                <div className="admin-themes" role="radiogroup" aria-label="Site theme">
                  {Themes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={theme === t.id}
                      className={`admin-theme${theme === t.id ? " is-on" : ""}`}
                      onClick={() => saveTheme(t.id)}
                      disabled={busy}
                    >
                      <span className="admin-theme-emoji" aria-hidden="true">{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-list-head">
              <span>Guestbook</span>
              <button type="button" className="admin-link" onClick={load} disabled={busy}>Refresh</button>
            </div>
            <ul className="admin-list">
              {entries === null ? (
                <li className="admin-empty">Loading…</li>
              ) : entries.length === 0 ? (
                <li className="admin-empty">No messages yet.</li>
              ) : (
                entries.map((en) => (
                  <li key={en.id} className="admin-entry">
                    <div className="admin-entry-text">
                      <span className="admin-entry-name">{en.name} <em>{when(en.at)}</em></span>
                      <span className="admin-entry-msg">{en.message}</span>
                    </div>
                    <button
                      type="button"
                      className="admin-del"
                      onClick={() => remove(en.id)}
                      disabled={busy}
                      aria-label={`Delete message from ${en.name}`}
                    >
                      Delete
                    </button>
                  </li>
                ))
              )}
            </ul>

            <div className="admin-foot">
              <span className="admin-status" role="status">{status}</span>
              <button type="button" className="admin-link" onClick={signOut}>Sign out</button>
            </div>
          </>
        )}
      </Glass>
    </div>
  );
}
