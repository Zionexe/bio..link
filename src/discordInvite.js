import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// useInvite — server name, icon and live online/member counts for a Discord
// invite code, from Discord's public invite API. Cached per code so every
// page that shows the same server makes one request.
// ---------------------------------------------------------------------------
const cache = new Map(); // code -> data | Promise

function load(code) {
  if (cache.has(code)) return cache.get(code);
  const p = fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      const g = json?.guild;
      const data = g
        ? {
            name: g.name,
            icon: g.icon
              ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith("a_") ? "gif" : "png"}?size=128`
              : null,
            online: json.approximate_presence_count,
            members: json.approximate_member_count,
          }
        : null;
      cache.set(code, data);
      return data;
    })
    .catch(() => {
      cache.set(code, null);
      return null;
    });
  cache.set(code, p);
  return p;
}

export function useInvite(code) {
  const cached = cache.get(code);
  const [info, setInfo] = useState(cached && !(cached instanceof Promise) ? cached : null);
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    Promise.resolve(load(code)).then((d) => {
      if (!cancelled) setInfo(d);
    });
    return () => { cancelled = true; };
  }, [code]);
  return info;
}

export const formatCount = (n) =>
  typeof n !== "number" ? null : n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : n.toLocaleString();
