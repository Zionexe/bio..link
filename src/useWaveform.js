import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// useWaveform — drives the Dynamic Island's level bars, like the iPhone's
// Now Playing waveform.
//
// Where it can, it listens to the real audio: `captureStream()` taps the
// <audio> element without rerouting its output (so volume and playback are
// untouched) and an AnalyserNode splits it into one band per bar. That needs
// the track served with CORS (Cloudinary does) and captureStream support
// (Chromium, Firefox). Anywhere else — Safari, a silent stream — the bars
// fall back to a generated rhythm.
//
// Every bar is its own spring, so levels flow instead of jumping, and pausing
// lets them settle down smoothly instead of snapping flat. Transforms are
// written straight to the bar elements; React never re-renders per frame.
// ---------------------------------------------------------------------------

const REST = 0.18; // bar height when paused
const RESPONSE = 0.16; // spring response (s) — quick, like a VU meter
const DAMPING = 0.7; // a little overshoot keeps it lively
const BANDS = [[1, 3], [3, 7], [7, 16], [16, 40], [40, 100]]; // FFT bins (~47Hz each)
const REDUCED_PATTERN = [0.45, 0.75, 0.55, 0.85, 0.5];

function tapAudio(audio) {
  if (audio.__waveTap !== undefined) return audio.__waveTap; // StrictMode / HMR re-runs
  audio.__waveTap = null;
  const capture = audio.captureStream || audio.mozCaptureStream;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!capture || !Ctx || audio.crossOrigin == null) return null;
  try {
    const ctx = new Ctx();
    const stream = capture.call(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.55;
    const tap = { ctx, analyser, data: new Uint8Array(analyser.frequencyBinCount), source: null };
    // Changing tracks swaps the stream's audio track, so rebind each time.
    const bind = () => {
      if (!stream.getAudioTracks().length) return;
      try {
        tap.source?.disconnect();
        tap.source = ctx.createMediaStreamSource(stream);
        tap.source.connect(analyser); // analyser only — never to the speakers
      } catch {
        /* stream not ready yet; the next addtrack retries */
      }
    };
    bind();
    stream.addEventListener("addtrack", bind);
    audio.__waveTap = tap;
    return tap;
  } catch {
    return null;
  }
}

export function useWaveform(audioRef, barsRef, playing) {
  const tapRef = useRef(null);

  // Build the audio tap once the music is actually playing (a user gesture
  // has happened by then, so the AudioContext is allowed to run).
  useEffect(() => {
    if (!playing || tapRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    tapRef.current = tapAudio(audio);
    tapRef.current?.ctx.resume().catch(() => {});
  }, [playing, audioRef]);

  useEffect(() => {
    const bars = barsRef.current.filter(Boolean);
    if (!bars.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const stiffness = (2 * Math.PI / RESPONSE) ** 2;
    const friction = (4 * Math.PI * DAMPING) / RESPONSE;
    const state = bars.map((bar) => {
      // Resume from wherever the bar currently is.
      const m = /scaleY\(([\d.]+)\)/.exec(bar.style.transform);
      return { p: m ? parseFloat(m[1]) : REST, v: 0, t: REST, nextAt: 0 };
    });

    // The island wrapper reads the average level as --lvl for its glow.
    const wrap = bars[0].closest(".di-wrap");
    let raf = 0;
    let last = performance.now();
    let peak = 0.2;
    let silentFor = 0;

    const levelsFromAudio = (dt) => {
      const tap = tapRef.current;
      if (!tap || tap.ctx.state !== "running" || silentFor > 1.2) return null;
      tap.analyser.getByteFrequencyData(tap.data);
      const levels = BANDS.map(([a, b]) => {
        let sum = 0;
        for (let i = a; i < b; i++) sum += tap.data[i];
        return sum / ((b - a) * 255);
      });
      const loudest = Math.max(...levels);
      // All-zero data for a while means the stream is silent (no CORS,
      // unsupported codec…) — hand over to the generated rhythm.
      silentFor = loudest < 0.005 ? silentFor + dt : 0;
      // Auto-gain: normalise against a slowly decaying peak so quiet and
      // loud tracks both fill the bars.
      peak = Math.max(loudest, peak * Math.pow(0.6, dt));
      return levels.map((l) => REST + (1 - REST) * Math.min(1, Math.pow(l / Math.max(peak, 0.08), 1.4)));
    };

    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      if (playing) {
        if (reduce) {
          state.forEach((s, i) => { s.t = REDUCED_PATTERN[i % REDUCED_PATTERN.length]; });
        } else {
          const levels = levelsFromAudio(dt);
          state.forEach((s, i) => {
            if (levels) s.t = levels[i];
            else if (now >= s.nextAt) {
              s.t = 0.3 + Math.random() * 0.7;
              s.nextAt = now + 90 + Math.random() * 110;
            }
          });
        }
      } else {
        state.forEach((s) => { s.t = REST; });
      }

      let moving = playing && !reduce;
      state.forEach((s, i) => {
        s.v += (-stiffness * (s.p - s.t) - friction * s.v) * dt;
        s.p += s.v * dt;
        if (Math.abs(s.v) > 0.002 || Math.abs(s.p - s.t) > 0.002) moving = true;
        else { s.p = s.t; s.v = 0; }
        bars[i].style.transform = `scaleY(${Math.min(1.12, Math.max(0.08, s.p)).toFixed(3)})`;
      });

      if (wrap) {
        const avg = state.reduce((sum, st) => sum + st.p, 0) / state.length;
        // Squared so quiet passages barely glow and only the hits really flare.
        const raw = Math.max(0, Math.min(1, (avg - REST) / (1 - REST)));
        const lvl = playing && !reduce ? raw * raw : 0;
        wrap.style.setProperty("--lvl", lvl.toFixed(3));
      }

      raf = moving ? requestAnimationFrame(step) : 0;
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, barsRef]);
}
