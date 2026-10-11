const LrclibApi = "https://lrclib.net/api";

function parseLrc(lrcText) {
  if (!lrcText) return [];
  const lines = [];
  const timeTag = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const rawLine of lrcText.split("\n")) {
    const matches = [...rawLine.matchAll(timeTag)];
    if (matches.length === 0) continue;

    const text = rawLine.replace(timeTag, "").trim();

    for (const m of matches) {
      const minutes = parseInt(m[1], 10);
      const seconds = parseInt(m[2], 10);
      const ms = m[3] ? parseInt(m[3].padEnd(3, "0"), 10) : 0;
      const time = minutes * 60 + seconds + ms / 1000;
      lines.push({ time, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

export async function fetchSyncedLyrics({ track, artist, album, durationSec }) {
  if (!track || !artist) return null;

  const params = new URLSearchParams({ track_name: track, artist_name: artist });
  if (album) params.set("album_name", album);
  if (durationSec) params.set("duration", Math.round(durationSec));

  try {
    const res = await fetch(`${LrclibApi}/get?${params.toString()}`);
    if (!res.ok) return await searchSyncedLyrics({ track, artist });
    const json = await res.json();
    if (!json.syncedLyrics) return null;
    return parseLrc(json.syncedLyrics);
  } catch {
    return null;
  }
}

async function searchSyncedLyrics({ track, artist }) {
  try {
    const params = new URLSearchParams({ track_name: track, artist_name: artist });
    const res = await fetch(`${LrclibApi}/search?${params.toString()}`);
    if (!res.ok) return null;
    const results = await res.json();
    const withSync = results.find((r) => r.syncedLyrics);
    if (!withSync) return null;
    return parseLrc(withSync.syncedLyrics);
  } catch {
    return null;
  }
}

export function getCurrentLyricLine(lines, positionSec) {
  if (!lines || lines.length === 0) return null;
  let current = null;
  for (const line of lines) {
    if (line.time <= positionSec) {
      current = line;
    } else {
      break;
    }
  }
  return current;
}