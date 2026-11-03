// ---------------------------------------------------------------------------
// ThemeDecor — the seasonal decoration on the profile card (themes.js `decor`):
//   lights  — a sagging wire of twinkling bulbs along the top edge
//   garland — the same wire hung with emoji
//   bunting — pennant flags
//   web     — a cobweb in the top-right corner with a spider on a thread
// ---------------------------------------------------------------------------

// Wire with a sag between each hanging point (viewBox 0 0 120 16; the low
// point of each sag is at y = 8, i.e. half the height).
function wirePath(n) {
  const w = 120 / n;
  let d = "M0,2";
  for (let i = 0; i < n; i++) d += ` Q${(i + 0.5) * w},14 ${(i + 1) * w},2`;
  return d;
}

function Wire({ n }) {
  return (
    <svg className="decor-wire" viewBox="0 0 120 16" preserveAspectRatio="none">
      <path d={wirePath(n)} />
    </svg>
  );
}

const pos = (i, n) => `${((i + 0.5) / n) * 100}%`;

function Web() {
  // Threads fan out from the top-right corner; rings join them with a sag.
  const angles = [92, 108, 124, 140, 156, 172].map((a) => (a * Math.PI) / 180);
  const pt = (r, a) => [100 + Math.cos(a) * r, -Math.sin(a) * r * -1];
  const rings = [18, 34, 50, 66, 82];
  return (
    <svg className="decor-web-svg" viewBox="0 0 100 100" aria-hidden="true">
      {angles.map((a, i) => {
        const [x, y] = pt(104, a);
        return <line key={`t${i}`} x1="100" y1="0" x2={x} y2={y} />;
      })}
      {rings.map((r) => (
        <path
          key={`r${r}`}
          d={angles.slice(0, -1).map((a, i) => {
            const [x1, y1] = pt(r, a);
            const [x2, y2] = pt(r, angles[i + 1]);
            const mid = (a + angles[i + 1]) / 2;
            const [cx, cy] = pt(r * 0.82, mid);
            return `${i === 0 ? `M${x1},${y1}` : ""} Q${cx},${cy} ${x2},${y2}`;
          }).join(" ")}
        />
      ))}
    </svg>
  );
}

export default function ThemeDecor({ decor }) {
  if (!decor) return null;

  if (decor.type === "web") {
    return (
      <div className="decor decor-web" aria-hidden="true">
        <Web />
        <span className="decor-spider">
          <span className="decor-thread" />
          🕷️
        </span>
      </div>
    );
  }

  if (decor.type === "lights") {
    const n = 14;
    return (
      <div className="decor decor-hang" aria-hidden="true">
        <Wire n={n} />
        {Array.from({ length: n }, (_, i) => (
          <span
            key={i}
            className="decor-bulb"
            style={{
              left: pos(i, n),
              "--c": decor.colors[i % decor.colors.length],
              "--d": `${((i * 0.53) % 2.2).toFixed(2)}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (decor.type === "garland") {
    const n = 9;
    return (
      <div className="decor decor-hang" aria-hidden="true">
        <Wire n={n} />
        {Array.from({ length: n }, (_, i) => (
          <span
            key={i}
            className="decor-charm"
            style={{ left: pos(i, n), "--r": `${i % 2 ? 12 : -12}deg`, "--d": `${(i * 0.31).toFixed(2)}s` }}
          >
            {decor.glyphs[i % decor.glyphs.length]}
          </span>
        ))}
      </div>
    );
  }

  if (decor.type === "bunting") {
    const n = 13;
    return (
      <div className="decor decor-hang" aria-hidden="true">
        <Wire n={n} />
        {Array.from({ length: n }, (_, i) => (
          <span
            key={i}
            className="decor-flag"
            style={{ left: pos(i, n), "--c": decor.colors[i % decor.colors.length], "--d": `${(i * 0.27).toFixed(2)}s` }}
          />
        ))}
      </div>
    );
  }

  return null;
}
