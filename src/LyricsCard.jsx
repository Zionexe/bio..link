import { useEffect, useRef, useState } from "react";
import { fetchSyncedLyrics } from "./lrclib";
import Glass from "./Glass";
import "./LyricsCard.css";

// Number of lyric lines rendered above/below the current one. The viewport
// only shows a window of these (see LyricsCard.css) with the rest fading
// out under a mask — keeping this a bit larger than what's visible means
// the fade never runs out of lines to fade.
const LINE_HEIGHT = 30; // px — keep in sync with --lyc-line-h in the CSS
// Apple Music cascade: when the lyric advances, each line below the current
// one starts moving a beat after the one above it.
const CASCADE_MS = 45;
const CASCADE_MAX = 5;

function formatTime(s) {
  if (!s || isNaN(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function LyricsCard({ spotify }) {
  const [lines, setLines] = useState(null); // null = loading, [] = no lyrics
  const [activeIndex, setActiveIndex] = useState(-1);
  const [elapsed, setElapsed] = useState(0); // whole seconds, for the time labels
  const lastTrackId = useRef(null);
  const progressRef = useRef(null);

  // Fetch synced lyrics whenever the track changes
  useEffect(() => {
    if (!spotify?.track_id) {
      lastTrackId.current = null;
      setLines(null);
      setActiveIndex(-1);
      return;
    }
    if (spotify.track_id === lastTrackId.current) return;
    lastTrackId.current = spotify.track_id;

    let cancelled = false;
    setLines(null);
    setActiveIndex(-1);

    const durationSec = spotify.timestamps
      ? (spotify.timestamps.end - spotify.timestamps.start) / 1000
      : null;

    fetchSyncedLyrics({
      track: spotify.song,
      artist: spotify.artist?.split(";")[0]?.trim(),
      album: spotify.album,
      durationSec,
    }).then((res) => {
      if (!cancelled) setLines(res || []);
    });

    return () => {
      cancelled = true;
      // Forget the id so a re-run (StrictMode, remount) fetches again instead
      // of bailing out while the cancelled request's result is dropped.
      lastTrackId.current = null;
    };
  }, [spotify?.track_id]);

  // Advance the active line as playback position moves forward
  useEffect(() => {
    if (!lines || !lines.length || !spotify?.timestamps) return;

    const tick = () => {
      const positionSec = (Date.now() - spotify.timestamps.start) / 1000;
      let idx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].time <= positionSec) idx = i;
        else break;
      }
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    };

    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [lines, spotify?.timestamps?.start]);

  // Track progress. The bar's transform is written directly (no re-render);
  // a linear transition matching the tick keeps it gliding continuously.
  const tsStart = spotify?.timestamps?.start;
  const tsEnd = spotify?.timestamps?.end;
  useEffect(() => {
    if (!tsStart || !tsEnd) return;
    const total = (tsEnd - tsStart) / 1000;

    const tick = () => {
      const pos = Math.min(total, Math.max(0, (Date.now() - tsStart) / 1000));
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${(pos / total).toFixed(4)})`;
      const whole = Math.floor(pos);
      setElapsed((prev) => (prev === whole ? prev : whole));
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [tsStart, tsEnd]);

  if (!spotify) return null;

  const hasLyrics = Array.isArray(lines) && lines.length > 0;
  const total = tsStart && tsEnd ? (tsEnd - tsStart) / 1000 : 0;
  const bgStyle = spotify.album_art_url ? { backgroundImage: `url(${spotify.album_art_url})` } : null;

  return (
    <Glass className="lyc-card" glass={{ bezel: 26, refraction: 48 }}>
      {/* Living artwork backdrop, like Apple Music: two blurred copies of the
          cover drifting against each other under a dark wash. */}
      {bgStyle && (
        <div className="lyc-bg" aria-hidden="true" key={spotify.album_art_url}>
          <div className="lyc-bg-layer lyc-bg-a" style={bgStyle} />
          <div className="lyc-bg-layer lyc-bg-b" style={bgStyle} />
        </div>
      )}

      <div className="lyc-header">
        {spotify.album_art_url ? (
          <img className="lyc-art" src={spotify.album_art_url} alt="" key={spotify.album_art_url} />
        ) : (
          <div className="lyc-art lyc-art-placeholder" />
        )}
        <div className="lyc-meta" key={spotify.track_id}>
          <span className="lyc-song">{spotify.song}</span>
          <span className="lyc-artist">{spotify.artist}</span>
        </div>
        <span className="lyc-eq" aria-hidden="true">
          <i /><i /><i />
        </span>
      </div>

      {lines === null && (
        <div className="lyc-skeleton" aria-label="finding lyrics">
          <span /><span /><span />
        </div>
      )}

      {lines !== null && !hasLyrics && (
        <div className="lyc-status">no synced lyrics found</div>
      )}

      {hasLyrics && (
        <div className="lyc-viewport" key={spotify.track_id}>
          {lines.map((line, i) => {
            const offset = i - Math.max(activeIndex, 0);
            const dist = Math.abs(offset);
            const isCurrent = offset === 0 && activeIndex >= 0;
            const cls =
              isCurrent ? "is-current"
              : dist === 1 ? "is-near"
              : dist === 2 ? "is-far"
              : "is-hidden";
            // Current line sits in the middle row of the 3-line viewport.
            const y = (offset + 1) * LINE_HEIGHT;
            const delay = offset > 0 ? Math.min(offset, CASCADE_MAX) * CASCADE_MS : 0;
            return (
              <div
                key={i}
                className={`lyc-line ${cls}`}
                style={{ translate: `0 ${y}px`, transitionDelay: `${delay}ms` }}
              >
                {line.text || "♪"}
              </div>
            );
          })}
        </div>
      )}

      {total > 0 && (
        <div className="lyc-progress">
          <span className="lyc-time">{formatTime(elapsed)}</span>
          <div className="lyc-progress-bar">
            <div className="lyc-progress-fill" ref={progressRef} />
          </div>
          <span className="lyc-time">-{formatTime(total - elapsed)}</span>
        </div>
      )}
    </Glass>
  );
}
