
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { FiMusic } from "react-icons/fi";

type LyricLine = {
  time: number;
  text: string;
};

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];

  for (const line of lrc.split("\n")) {
    const match = line.match(/^\[(\d+):(\d+)\.(\d+)\]\s*(.*)/);

    if (!match) {
      continue;
    }

    const minutes = Number.parseInt(match[1], 10);
    const seconds = Number.parseInt(match[2], 10);
    const milliseconds = Number.parseInt(
      match[3].padEnd(3, "0").slice(0, 3),
      10
    );

    const time =
      minutes * 60000 +
      seconds * 1000 +
      milliseconds;

    const text = match[4].trim();

    if (text.length > 0) {
      lines.push({
        time,
        text,
      });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

type Props = {
  trackId?: string | null;
  track?: string | null;
  artist?: string | null;
  albumArt?: string | null;
  timestamps?: {
    start: number;
    end: number;
  } | null;
  isPlaying?: boolean;
};

export default function SpotifyLyrics({
  trackId = "1K5OXYZMz90JWaPrIAb3Jx",
  track = "I'm tired of this",
  artist = "Rebzyyx; Rezlaine",
  albumArt = "https://i.scdn.co/image/ab67616d0000b273533d022da9781fbe94f2cd08",
  timestamps = null,
  isPlaying = true,
}: Props) {
  const activeTrack = track || "I'm tired of this";
  const activeArtist = artist || "Rebzyyx; Rezlaine";

  const [lines, setLines] = useState<LyricLine[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isUserInteracting, setIsUserInteracting] =
    useState(false);

  const lastTrackRef = useRef<string | null>(null);

  const intervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeLineRef =
    useRef<HTMLDivElement | null>(null);

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const fetchLyrics = useCallback(
    async (
      id: string | null | undefined,
      title: string,
      performer: string
    ) => {
      try {
        const params = new URLSearchParams();

        params.set("track", title);
        params.set("artist", performer);

        if (id) {
          params.set("trackId", id);
        }

        const response = await fetch(
          "/api/lyrics?" + params.toString(),
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data && data.syncedLyrics) {
          setLines(parseLrc(data.syncedLyrics));
          setCurrentIdx(0);
        }
      } catch {
        setLines([]);
      }
    },
    []
  );

  useEffect(() => {
    const trackKey =
      trackId || activeTrack + "::" + activeArtist;

    if (lastTrackRef.current === trackKey) {
      return;
    }

    lastTrackRef.current = trackKey;

    fetchLyrics(
      trackId,
      activeTrack,
      activeArtist
    );
  }, [
    trackId,
    activeTrack,
    activeArtist,
    fetchLyrics,
  ]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (lines.length === 0) {
      return;
    }

    if (!timestamps || !isPlaying) {
      return;
    }

    const syncLyrics = () => {
      const elapsed =
        Date.now() - timestamps.start;

      if (elapsed < 0) {
        setCurrentIdx(0);
        return;
      }

      let low = 0;
      let high = lines.length - 1;
      let index = 0;

      while (low <= high) {
        const middle = Math.floor(
          (low + high) / 2
        );

        if (lines[middle].time <= elapsed) {
          index = middle;
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }

      setCurrentIdx(index);
    };

    syncLyrics();

    intervalRef.current = setInterval(
      syncLyrics,
      60
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    lines,
    timestamps,
    isPlaying,
  ]);

  useEffect(() => {
    if (isUserInteracting) {
      return;
    }

    if (!activeLineRef.current) {
      return;
    }

    activeLineRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [
    currentIdx,
    isUserInteracting,
  ]);

  const handleScroll = () => {
    setIsUserInteracting(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(
      () => {
        setIsUserInteracting(false);
      },
      4000
    );
  };

  const handleLineClick = (index: number) => {
    setCurrentIdx(index);
    setIsUserInteracting(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(
      () => {
        setIsUserInteracting(false);
      },
      4000
    );
  };

  if (lines.length === 0) {
    return null;
  }

  return (
    <section className="fade-in-up delay-2 w-full glass-card overflow-hidden p-5 border border-white/10 hover:border-white/20 transition-all shadow-xl">
      <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {albumArt ? (
            <img
              src={albumArt}
              alt=""
              className="h-8 w-8 rounded-md object-cover border border-white/10 shadow-sm"
            />
          ) : null}

          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-100 truncate">
              {activeTrack}
            </p>

            <p className="text-[11px] text-zinc-400 truncate">
              {activeArtist}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 bg-white/5 text-white text-[11px] font-medium shadow-[0_0_12px_rgba(255,255,255,0.15)]">
          <FiMusic
            className="animate-pulse text-white"
            size={12}
          />

          <span>Full Lyrics</span>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative max-h-72 sm:max-h-80 w-full overflow-y-auto pr-1 space-y-2 select-none scroll-smooth"
      >
        {lines.map((line, index) => {
          const isCurrent =
            index === currentIdx;

          const lineClassName = isCurrent
            ? "transition-all duration-300 rounded-xl px-4 py-2 text-center text-xs sm:text-sm cursor-pointer font-extrabold text-white bg-white/10 border border-white/30 scale-[1.02] drop-shadow-[0_0_16px_rgba(255,255,255,0.5)] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            : "transition-all duration-300 rounded-xl px-4 py-2 text-center text-xs sm:text-sm cursor-pointer font-normal text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]";

          return (
            <div
              key={line.time + "-" + index}
              ref={
                isCurrent
                  ? activeLineRef
                  : null
              }
              onClick={() =>
                handleLineClick(index)
              }
              className={lineClassName}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </section>
  );
}
