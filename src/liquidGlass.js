import { useEffect } from "react";

// ---------------------------------------------------------------------------
// Liquid Glass — Apple's material, rebuilt for the web.
//
// What makes it read as *glass* rather than frosted plastic is refraction:
// the surface is a thick convex lens, so near its rim the content behind it
// bends inward, while the middle stays nearly clear. We reproduce that with
// an SVG filter used as a `backdrop-filter`:
//
//   blur (slight)  →  feDisplacementMap (lens bend at the bezel)  →  saturate
//
// The displacement map is generated per element size from the signed
// distance to its rounded rectangle: inside the bezel every pixel samples
// from further inward along the surface normal, strongest right at the
// edge. Specular rims, tint and the pointer-following highlight are CSS
// (see .liquid-glass in App.css).
//
// SVG filters as backdrop-filter only work in Chromium. Everywhere else the
// element keeps its CSS fallback (a blur + saturate backdrop), which is
// also what `prefers-reduced-transparency` gets.
// ---------------------------------------------------------------------------

const SVG_NS = "http://www.w3.org/2000/svg";
let host = null;
let counter = 0;
const mapCache = new Map();

export const supportsRefraction = (() => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const chromium = /\b(Chrome|Chromium|Edg)\//.test(ua) && !/Firefox\//.test(ua);
  return chromium && CSS.supports("backdrop-filter", "blur(1px)");
})();

function ensureHost() {
  if (host && host.isConnected) return host;
  host = document.createElementNS(SVG_NS, "svg");
  host.setAttribute("aria-hidden", "true");
  host.setAttribute("width", "0");
  host.setAttribute("height", "0");
  host.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  document.body.appendChild(host);
  return host;
}

// Signed distance to a rounded box centred on the origin (negative inside).
function roundedBoxSdf(px, py, hw, hh, r) {
  const qx = Math.abs(px) - (hw - r);
  const qy = Math.abs(py) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function displacementMap(w, h, radius, bezel) {
  const key = `${w}x${h}r${radius}b${bezel}`;
  if (mapCache.has(key)) return mapCache.get(key);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(radius, hw, hh);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hw;
      const py = y + 0.5 - hh;
      const depth = -roundedBoxSdf(px, py, hw, hh, r);
      let dx = 0;
      let dy = 0;
      if (depth >= 0 && depth < bezel) {
        // Outward surface normal = gradient of the distance field.
        const gx = roundedBoxSdf(px + 1, py, hw, hh, r) - roundedBoxSdf(px - 1, py, hw, hh, r);
        const gy = roundedBoxSdf(px, py + 1, hw, hh, r) - roundedBoxSdf(px, py - 1, hw, hh, r);
        const len = Math.hypot(gx, gy) || 1;
        // Convex bezel: the surface gets steeper toward the rim, so the bend
        // grows non-linearly (squircle-ish falloff).
        const t = 1 - depth / bezel;
        const mag = t * t * (3 - 2 * t) * t;
        dx = (-gx / len) * mag;
        dy = (-gy / len) * mag;
      }
      const i = (y * w + x) * 4;
      d[i] = Math.round(128 + dx * 127);
      d[i + 1] = Math.round(128 + dy * 127);
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL();
  mapCache.set(key, url);
  return url;
}

function buildFilter(id, w, h, href, { refraction, blur, saturation }) {
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", id);
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  filter.setAttribute("x", "0");
  filter.setAttribute("y", "0");
  filter.setAttribute("width", String(w));
  filter.setAttribute("height", String(h));
  filter.setAttribute("color-interpolation-filters", "sRGB");
  filter.innerHTML = `
    <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="soft" />
    <feImage href="${href}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map" />
    <feDisplacementMap in="soft" in2="map" scale="${refraction}" xChannelSelector="R" yChannelSelector="G" result="bent" />
    <feColorMatrix in="bent" type="saturate" values="${saturation}" />`;
  return filter;
}

function resolveRadius(el, w, h, radius) {
  if (typeof radius === "number") return radius;
  const raw = getComputedStyle(el).borderTopLeftRadius;
  if (raw.endsWith("%")) return (parseFloat(raw) / 100) * Math.min(w, h);
  return parseFloat(raw) || 0;
}

/**
 * Turn an element into refracting Liquid Glass (Chromium). Elsewhere the
 * element's CSS backdrop-filter fallback stays in charge.
 *
 * @param {React.RefObject<HTMLElement>} ref
 * @param {{ radius?: number, bezel?: number, refraction?: number, blur?: number, saturation?: number }} options
 */
export function useLiquidGlass(ref, { radius, bezel = 22, refraction = 44, blur = 2, saturation = 1.7 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !supportsRefraction) return;
    if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) return;

    const svg = ensureHost();
    const base = `lg-${++counter}`;
    let version = 0;
    let filter = null;
    let lastKey = "";
    let raf = 0;

    const update = () => {
      raf = 0;
      // offsetWidth/Height ignore transforms, so entrance scale animations
      // never trigger a rebuild.
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const r = resolveRadius(el, w, h, radius);
      const key = `${w}x${h}r${r}`;
      if (key === lastKey) return;
      lastKey = key;

      const id = `${base}-${++version}`;
      const href = displacementMap(w, h, Math.round(r), Math.min(bezel, w / 2, h / 2));
      const next = buildFilter(id, w, h, href, { refraction, blur, saturation });
      svg.appendChild(next);
      el.style.backdropFilter = `url(#${id})`;
      el.style.webkitBackdropFilter = `url(#${id})`;
      el.classList.add("is-refracting");
      filter?.remove();
      filter = next;
    };

    update();
    const ro = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(update);
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      filter?.remove();
      el.style.backdropFilter = "";
      el.style.webkitBackdropFilter = "";
      el.classList.remove("is-refracting");
    };
  }, [ref, radius, bezel, refraction, blur, saturation]);
}
