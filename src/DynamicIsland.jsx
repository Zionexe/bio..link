import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWaveform } from "./useWaveform";
import "./DynamicIsland.css";

// ---------------------------------------------------------------------------
// DynamicIsland — modeled on the iPhone's Now Playing island.
//
// Three shapes: "idle" (the bare capsule), "compact" (artwork on the left,
// waveform on the right) and "expanded" (full player). The capsule morphs on
// a spring. Artwork and waveform are shared elements: one node each that
// rides the capsule's edges and grows into its expanded position, the same
// way iOS does it, instead of cross-fading two copies.
//
// Expanded closes on: swipe up, tap outside, Escape.
// ---------------------------------------------------------------------------

const BAR_COUNT = 5;
const SWIPE_CLOSE_PX = 36;
const SWIPE_CLOSE_VELOCITY = 0.35; // px/ms

// Soft boundary: the further past the edge, the less the element follows.
function rubberband(offset, dimension, constant = 0.55) {
  return (offset * dimension * constant) / (dimension + constant * Math.abs(offset));
}

// Apple tints the island's waveform with the artwork's colour.
function useArtworkTint(src) {
  const [tint, setTint] = useState(null);
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 12;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0, g = 0, b = 0, total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
          // Weight vivid, bright pixels; ignore near-greys.
          const weight = ((max - min) / 255) * (max / 255) + 0.02;
          r += pr * weight; g += pg * weight; b += pb * weight; total += weight;
        }
        r /= total; g /= total; b /= total;
        // Lift into a legible-on-black range, like the system does.
        const max = Math.max(r, g, b, 1);
        const lift = Math.max(1, 210 / max);
        const c = (v) => Math.min(255, Math.round(v * lift));
        if (!cancelled) setTint(`rgb(${c(r)}, ${c(g)}, ${c(b)})`);
      } catch {
        /* tainted canvas — keep white */
      }
    };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);
  return tint;
}

// Bar heights are driven per frame by useWaveform (audio-reactive springs).
const Waveform = forwardRef(function Waveform({ playing }, barsRef) {
  return (
    <span className={`di-wave${playing ? " is-playing" : ""}`} aria-hidden="true">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <span key={i} className="di-bar" ref={(el) => { barsRef.current[i] = el; }} />
      ))}
    </span>
  );
});

// Long titles scroll like they do on iOS: hold, glide, hold, glide back.
function MarqueeText({ text, active, className }) {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = textRef.current;
    if (!box || !inner) return;
    const overflow = inner.scrollWidth - box.clientWidth;
    setShift(overflow > 2 ? overflow + 12 : 0);
  }, [text]);

  const scrolling = active && shift > 0;
  return (
    <span ref={boxRef} className={`di-marquee ${className}${scrolling ? " is-scrolling" : ""}`}>
      <span
        ref={textRef}
        className="di-marquee-text"
        style={scrolling ? { "--shift": `-${shift}px`, animationDuration: `${(shift / 28 + 3).toFixed(2)}s` } : undefined}
      >
        {text}
      </span>
    </span>
  );
}

// SF Symbols–style glyphs
const BackwardIcon = () => (
  <svg width="30" height="20" viewBox="0 0 30 20" fill="currentColor" aria-hidden="true">
    <path d="M14 3.2v13.6c0 .9-1 1.4-1.7.9L2.9 10.9a1.1 1.1 0 0 1 0-1.8l9.4-6.8c.7-.5 1.7 0 1.7.9Z" />
    <path d="M28 3.2v13.6c0 .9-1 1.4-1.7.9l-9.4-6.8a1.1 1.1 0 0 1 0-1.8l9.4-6.8c.7-.5 1.7 0 1.7.9Z" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="30" height="20" viewBox="0 0 30 20" fill="currentColor" aria-hidden="true">
    <path d="M2 3.2v13.6c0 .9 1 1.4 1.7.9l9.4-6.8a1.1 1.1 0 0 0 0-1.8L3.7 2.3C3 1.8 2 2.3 2 3.2Z" />
    <path d="M16 3.2v13.6c0 .9 1 1.4 1.7.9l9.4-6.8a1.1 1.1 0 0 0 0-1.8l-9.4-6.8c-.7-.5-1.7 0-1.7.9Z" />
  </svg>
);

const PlayIcon = () => (
  <svg width="26" height="28" viewBox="0 0 26 28" fill="currentColor" aria-hidden="true">
    <path d="M4 3.6v20.8c0 1.2 1.3 1.9 2.3 1.3l17-10.4c1-.6 1-2 0-2.6l-17-10.4C5.3 1.7 4 2.4 4 3.6Z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="26" height="28" viewBox="0 0 26 28" fill="currentColor" aria-hidden="true">
    <rect x="4" y="3" width="6.5" height="22" rx="1.6" />
    <rect x="15.5" y="3" width="6.5" height="22" rx="1.6" />
  </svg>
);

export default function DynamicIsland({ tracks, cover = "/Track.png", apiRef, onStateChange }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState("idle"); // "idle" | "compact" | "expanded"
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubRatio, setScrubRatio] = useState(null); // non-null while dragging
  const audioRef = useRef(null);
  const wrapRef = useRef(null);
  const pillRef = useRef(null);
  const drag = useRef(null);
  const suppressClick = useRef(false); // the click that ends a swipe is not a tap
  const barsRef = useRef([]);
  const tint = useArtworkTint(cover);

  const currentTrack = tracks[currentIndex];
  const expanded = phase === "expanded";

  useWaveform(audioRef, barsRef, isPlaying);

  // Let other pages (music, terminal) drive the player and follow its state.
  useEffect(() => {
    onStateChange?.({ index: currentIndex, playing: isPlaying });
  }, [currentIndex, isPlaying, onStateChange]);

  useEffect(() => {
    if (!apiRef) return;
    const audio = audioRef.current;
    apiRef.current = {
      play(i) {
        if (typeof i === "number" && i !== currentIndex) {
          setCurrentIndex(((i % tracks.length) + tracks.length) % tracks.length);
          setIsPlaying(true); // the track-change effect starts it
          return;
        }
        audio?.play().catch(() => {});
        setIsPlaying(true);
      },
      pause() {
        audio?.pause();
        setIsPlaying(false);
      },
      toggle() {
        if (isPlaying) this.pause();
        else this.play();
      },
      next() {
        setCurrentIndex((i) => (i + 1) % tracks.length);
      },
      prev() {
        setCurrentIndex((i) => (i - 1 + tracks.length) % tracks.length);
      },
    };
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.40;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (isPlaying) audio.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Try to autoplay on mount; if blocked, resume on first user gesture.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const tryPlay = () => {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          const resume = () => {
            audio.play().then(() => setIsPlaying(true)).catch(() => {});
          };
          document.addEventListener("click", resume, { once: true });
          document.addEventListener("keydown", resume, { once: true });
        });
    };
    tryPlay();
  }, []);

  // The island is born as the bare capsule, then stretches out to carry the
  // Now Playing activity — the same beat iOS plays when music starts.
  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p === "idle" ? "compact" : p)), 450);
    return () => clearTimeout(t);
  }, []);

  // Collapse on tap outside or Escape
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setPhase("compact");
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPhase("compact");
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  // --- Swipe up to collapse (expanded only) ---------------------------------
  const onPillPointerDown = (e) => {
    if (!expanded || e.button !== 0) return;
    if (e.target.closest("button, .di-scrub")) return;
    drag.current = { id: e.pointerId, y0: e.clientY, dy: 0, samples: [{ y: e.clientY, t: e.timeStamp }] };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already released */ }
  };

  const onPillPointerMove = (e) => {
    const d = drag.current;
    const pill = pillRef.current;
    if (!d || d.id !== e.pointerId || !pill) return;
    d.dy = e.clientY - d.y0;
    d.samples.push({ y: e.clientY, t: e.timeStamp });
    if (d.samples.length > 5) d.samples.shift();
    // Upward follows the finger (shrinking toward the top edge); downward
    // meets progressive resistance.
    const h = pill.offsetHeight;
    const y = d.dy < 0 ? d.dy * 0.5 : rubberband(d.dy, h);
    const s = d.dy < 0 ? Math.max(0.86, 1 + d.dy / 900) : 1 + rubberband(d.dy, h) / 1200;
    pill.classList.add("is-dragging");
    pill.style.transform = `translateY(${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
  };

  const endDrag = (e, cancelled) => {
    const d = drag.current;
    const pill = pillRef.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!pill) return;
    // Include the release point: a fast flick may deliver few (or no) moves.
    d.dy = e.clientY - d.y0;
    d.samples.push({ y: e.clientY, t: e.timeStamp });
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const velocity = (last.y - first.y) / Math.max(1, last.t - first.t); // px/ms, negative = up
    pill.classList.remove("is-dragging");
    pill.style.transform = "";
    suppressClick.current = Math.abs(d.dy) > 6;
    if (!cancelled && (d.dy < -SWIPE_CLOSE_PX || velocity < -SWIPE_CLOSE_VELOCITY)) {
      setPhase("compact");
    }
  };

  const onPillClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (phase !== "expanded") setPhase("expanded");
  };

  // --- Transport ------------------------------------------------------------
  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const skip = (dir) => (e) => {
    e.stopPropagation();
    // The glyph nudges in the direction of travel.
    const glyph = e.currentTarget.querySelector("svg");
    glyph?.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${dir * 5}px)` }, { transform: "translateX(0)" }],
      { duration: 320, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
    );
    setCurrentIndex((i) => (i + dir + tracks.length) % tracks.length);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);
  };

  const handleEnded = () => setCurrentIndex((i) => (i + 1) % tracks.length);

  // --- Scrubber: tracks the pointer 1:1, commits the seek on release --------
  const ratioFromEvent = (e) => {
    const bar = e.currentTarget.querySelector(".di-scrub-bar");
    const rect = (bar || e.currentTarget).getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  };

  const onScrubDown = (e) => {
    e.stopPropagation();
    if (!duration) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already released */ }
    setScrubRatio(ratioFromEvent(e));
  };

  const onScrubMove = (e) => {
    if (scrubRatio === null) return;
    setScrubRatio(ratioFromEvent(e));
  };

  const onScrubUp = (e) => {
    if (scrubRatio === null) return;
    const audio = audioRef.current;
    const ratio = ratioFromEvent(e);
    if (audio && duration) {
      audio.currentTime = ratio * duration;
      setProgress(ratio * duration);
    }
    setScrubRatio(null);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (!tracks || !tracks.length) return null;

  const ratio = scrubRatio ?? (duration ? progress / duration : 0);

  return (
    <div className="di-wrap" ref={wrapRef}>
      <div
        ref={pillRef}
        className={`di-pill is-${phase}`}
        style={tint ? { "--di-tint": tint } : undefined}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label="Now playing"
        onClick={onPillClick}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setPhase(expanded ? "compact" : "expanded");
          }
        }}
        onPointerDown={onPillPointerDown}
        onPointerMove={onPillPointerMove}
        onPointerUp={(e) => endDrag(e, false)}
        onPointerCancel={(e) => endDrag(e, true)}
      >
        {/* crossOrigin lets the waveform read the audio (see useWaveform).
            If a track isn't served with CORS, onError drops it and reloads. */}
        <audio
          ref={audioRef}
          src={currentTrack.src}
          crossOrigin="anonymous"
          onError={(e) => {
            const audio = e.currentTarget;
            if (!audio.hasAttribute("crossorigin")) return;
            audio.removeAttribute("crossorigin");
            audio.load();
            if (isPlaying) audio.play().catch(() => {});
          }}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onCanPlay={() => { if (isPlaying) audioRef.current?.play().catch(() => {}); }}
        />

        {/* Shared elements — same node in compact and expanded */}
        <img src={cover} alt="" className="di-art" draggable="false" />
        <span className="di-wave-anchor">
          <Waveform playing={isPlaying} ref={barsRef} />
        </span>

        {/* Expanded-only content */}
        <div className="di-meta di-reveal">
          {/* Re-keyed per track so the new title settles in */}
          <div className="di-meta-inner" key={currentIndex}>
            <MarqueeText className="di-title" text={currentTrack.name} active={expanded} />
            {currentTrack.artist && <span className="di-artist">{currentTrack.artist}</span>}
          </div>
        </div>

        <div className="di-bottom di-reveal">
          <div
            className={`di-scrub${scrubRatio !== null ? " is-scrubbing" : ""}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={onScrubDown}
            onPointerMove={onScrubMove}
            onPointerUp={onScrubUp}
            onPointerCancel={() => setScrubRatio(null)}
          >
            <span className="di-time">{formatTime(ratio * duration)}</span>
            <div className="di-scrub-bar">
              <div className="di-scrub-fill" style={{ transform: `scaleX(${ratio})` }} />
            </div>
            <span className="di-time">-{formatTime(Math.max(0, duration - ratio * duration))}</span>
          </div>

          <div className="di-controls">
            <button className="di-btn" onClick={skip(-1)} aria-label="Previous track" tabIndex={expanded ? 0 : -1}>
              <BackwardIcon />
            </button>
            <button
              className={`di-btn di-btn-play${isPlaying ? " is-playing" : ""}`}
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              tabIndex={expanded ? 0 : -1}
            >
              <span className="di-glyph di-glyph-play"><PlayIcon /></span>
              <span className="di-glyph di-glyph-pause"><PauseIcon /></span>
            </button>
            <button className="di-btn" onClick={skip(1)} aria-label="Next track" tabIndex={expanded ? 0 : -1}>
              <ForwardIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
