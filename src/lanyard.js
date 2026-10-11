import { useEffect, useRef, useState } from "react";

const LanyardRestApi = "https://api.lanyard.rest/v1/users";
const LanyardSocketUrl = "wss://api.lanyard.rest/socket";

export function useLanyard(discordId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reconnectRef = useRef(null);
  const reconnectAttempt = useRef(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${LanyardRestApi}/${discordId}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setData(json.data);
          setLoading(false);
        }
      } catch {}
    })();

    function connect() {
      if (cancelled) return;

      const ws = new WebSocket(LanyardSocketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempt.current = 0;
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        const { op, t, d } = payload;

        switch (op) {
          case 1: {
            const interval = d?.heartbeat_interval ?? 30000;
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ op: 3 }));
              }
            }, interval);

            ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: discordId } }));
            break;
          }
          case 0: {
            if (t === "INIT_STATE" || t === "PRESENCE_UPDATE") {
              setData(d);
              setError(null);
              setLoading(false);
            }
            break;
          }
          default:
            break;
        }
      };

      ws.onerror = () => {
        setError("lanyard_socket_error");
      };

      ws.onclose = () => {
        clearInterval(heartbeatRef.current);
        if (cancelled) return;
        const attempt = Math.min(reconnectAttempt.current + 1, 6);
        reconnectAttempt.current = attempt;
        const delay = Math.min(1000 * 2 ** attempt, 30000);
        clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearInterval(heartbeatRef.current);
      clearTimeout(reconnectRef.current);
      const ws = wsRef.current;
      if (!ws) return;
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(), { once: true });
      } else {
        ws.close();
      }
    };
  }, [discordId]);

  return { data, loading, error };
}

// ---------------------------------------------------------------------------
// useLanyardMulti — subscribes to several Discord IDs over a single shared
// websocket connection (one socket, one heartbeat) instead of opening a
// separate connection per user. Returns a map keyed by discord user id.
// ---------------------------------------------------------------------------
export function useLanyardMulti(discordIds) {
  const [dataById, setDataById] = useState({});
  const [loading, setLoading] = useState(true);

  const wsRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reconnectRef = useRef(null);
  const reconnectAttempt = useRef(0);

  const idsKey = discordIds.filter(Boolean).join(",");

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    const ids = idsKey.split(",");

    // Initial REST fetch so presence (incl. spotify) shows immediately
    // instead of waiting for the next websocket push for each user.
    (async () => {
      try {
        const results = await Promise.all(
          ids.map((id) =>
            fetch(`${LanyardRestApi}/${id}`)
              .then((r) => r.json())
              .catch(() => null)
          )
        );
        if (cancelled) return;
        setDataById((prev) => {
          const next = { ...prev };
          results.forEach((json, i) => {
            if (json?.success && json.data) next[ids[i]] = json.data;
          });
          return next;
        });
        setLoading(false);
      } catch {}
    })();

    function connect() {
      if (cancelled) return;

      const ws = new WebSocket(LanyardSocketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempt.current = 0;
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        const { op, t, d } = payload;

        switch (op) {
          case 1: {
            const interval = d?.heartbeat_interval ?? 30000;
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ op: 3 }));
              }
            }, interval);

            // Subscribe to every id in one go — single connection, single
            // heartbeat, Discord pushes updates for all of them down the
            // same pipe instead of us juggling multiple sockets.
            ws.send(JSON.stringify({ op: 2, d: { subscribe_to_ids: ids } }));
            break;
          }
          case 0: {
            if (t === "INIT_STATE" && d) {
              setDataById((prev) => ({ ...prev, ...d }));
              setLoading(false);
            } else if (t === "PRESENCE_UPDATE" && d?.discord_user?.id) {
              setDataById((prev) => ({ ...prev, [d.discord_user.id]: d }));
              setLoading(false);
            }
            break;
          }
          default:
            break;
        }
      };

      ws.onclose = () => {
        clearInterval(heartbeatRef.current);
        if (cancelled) return;
        const attempt = Math.min(reconnectAttempt.current + 1, 6);
        reconnectAttempt.current = attempt;
        const delay = Math.min(1000 * 2 ** attempt, 30000);
        clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearInterval(heartbeatRef.current);
      clearTimeout(reconnectRef.current);
      const ws = wsRef.current;
      if (!ws) return;
      if (ws.readyState === WebSocket.CONNECTING) {
        // Closing a socket that hasn't finished its handshake yet logs a
        // benign-but-noisy console warning. Wait for it to open, then close.
        ws.addEventListener("open", () => ws.close(), { once: true });
      } else {
        ws.close();
      }
    };
  }, [idsKey]);

  return { dataById, loading };
}

export function getDiscordAvatarUrl(discordUser, size = 256) {
  if (!discordUser) return null;
  if (!discordUser.avatar) {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
  const ext = discordUser.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${ext}?size=${size}`;
}

// Avatar Decoration — the animated/static frame some users have wrapped
// around their avatar (Nitro shop item or quest reward).
export function getAvatarDecorationUrl(presence, size = 160) {
  const asset = presence?.discord_user?.avatar_decoration_data?.asset;
  if (!asset) return null;
  return `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png?size=${size}&passthrough=true`;
}

// Nameplate — the cosmetic background plate Discord renders behind a
// user's display name (newer profile collectible). `asset` comes back as
// a path like "nameplates/spell/white_mana/" and the static frame lives
// at that path + "static.png" on the CDN's /assets/ route.
export function getNameplateUrl(presence) {
  const asset = presence?.discord_user?.collectibles?.nameplate?.asset;
  if (!asset) return null;
  return `https://cdn.discordapp.com/assets/collectibles/${asset}static.png`;
}

// Real Discord "clan tag" badge — the little icon that sits to the left of
// the tag text in Discord's own UI (Settings → Profiles → Clan/Guild Tag).
export function getGuildBadgeUrl(presence, size = 16) {
  const guild = presence?.discord_user?.primary_guild;
  if (!guild?.badge || !guild?.identity_guild_id) return null;
  return `https://cdn.discordapp.com/clan-badges/${guild.identity_guild_id}/${guild.badge}.png?size=${size}`;
}

export function getActivePlatforms(presence) {
  if (!presence) return [];
  const platforms = [];
  if (presence.active_on_discord_mobile) platforms.push("mobile");
  if (presence.active_on_discord_desktop) platforms.push("desktop");
  if (presence.active_on_discord_web) platforms.push("web");
  return platforms;
}