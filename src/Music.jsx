import { useEffect, useState } from "react";
import { Kicker } from "./Motion";
import Glass from "./Glass";
import LyricsCard from "./LyricsCard";
import { PageTitle } from "./Text";

// ---------------------------------------------------------------------------
// Music — the site's own playlist (plays through the Dynamic Island) and,
// when zion is on Spotify, what's playing right now with synced lyrics.
// ---------------------------------------------------------------------------

function formatTime(s) {
  if (!s || !isFinite(s)) return "—";
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

// Reads each track's length from its metadata (a few KB per file).
function useDurations(tracks) {
  const [durations, setDurations] = useState({});
  useEffect(() => {
    const audios = tracks.map((t, i) => {
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => setDurations((d) => ({ ...d, [i]: a.duration }));
      a.src = t.src;
      return a;
    });
    return () => audios.forEach((a) => { a.onloadedmetadata = null; a.removeAttribute("src"); });
  }, [tracks]);
  return durations;
}

function Bars() {
  return (
    <span className="mu-bars" aria-hidden="true">
      <i /><i /><i />
    </span>
  );
}

export default function Music({ tracks, player, playerApi, spotify }) {
  const durations = useDurations(tracks);

  const onTrack = (i) => {
    const api = playerApi.current;
    if (!api) return;
    if (player.index === i) api.toggle();
    else api.play(i);
  };

  return (
    <div className="card card-entered pf-card">
      <div className="hero-block">
        <Kicker text="on repeat" />
        <PageTitle text="Music" />
      </div>

      <section className="pf-section">
        <h2 className="pf-heading">on this site</h2>
        <Glass className="mu-list" glass={{ bezel: 18, refraction: 30 }}>
          {tracks.map((t, i) => {
            const current = player.index === i;
            const playing = current && player.playing;
            return (
              <button
                key={t.src}
                type="button"
                className={`mu-row${current ? " is-current" : ""}${playing ? " is-playing" : ""}`}
                onClick={() => onTrack(i)}
                aria-label={`${playing ? "Pause" : "Play"} ${t.name}`}
              >
                <span className="mu-index">
                  {playing ? <Bars /> : String(i + 1).padStart(2, "0")}
                </span>
                <span className="mu-title">
                  <span className="mu-name">{t.name}</span>
                  {t.artist && <span className="mu-artist">{t.artist}</span>}
                </span>
                <span className="mu-time">{formatTime(durations[i])}</span>
                <span className="mu-action" aria-hidden="true">
                  {playing ? (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 4.5v15c0 .8.9 1.3 1.6.8l11-7.5a1 1 0 0 0 0-1.6l-11-7.5C7.9 3.2 7 3.7 7 4.5Z" /></svg>
                  )}
                </span>
              </button>
            );
          })}
        </Glass>
      </section>

      <section className="pf-section">
        <h2 className="pf-heading">on spotify right now</h2>
        {spotify ? (
          <LyricsCard spotify={spotify} />
        ) : (
          <Glass className="mu-empty" glass={{ bezel: 16, refraction: 26 }}>
            <span className="mu-empty-dot" />
            <span>Nothing playing — check back later</span>
          </Glass>
        )}
      </section>
    </div>
  );
}
