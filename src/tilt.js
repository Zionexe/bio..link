// ---------------------------------------------------------------------------
// 3D tilt — the element leans toward the mouse, with a light spot (glare)
// that follows it. Spread the handlers onto any element with class "tilt":
//
//   <div className="profile-card tilt" {...tilt(6)}>
//
// Sets --rx / --ry (rotation) and --tx / --ty (glare position, %) on the
// element; the CSS for .tilt in fresh.css does the rest. Mouse/trackpad only
// (phones keep their normal scroll and tap behaviour).
// ---------------------------------------------------------------------------

const canTilt = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function tiltMove(e, max = 8) {
  if (e.pointerType && e.pointerType !== "mouse") return;
  if (!canTilt()) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--rx", `${((0.5 - y) * max).toFixed(2)}deg`);
  el.style.setProperty("--ry", `${((x - 0.5) * max).toFixed(2)}deg`);
  el.style.setProperty("--tx", `${(x * 100).toFixed(1)}%`);
  el.style.setProperty("--ty", `${(y * 100).toFixed(1)}%`);
  el.classList.add("is-tilting");
}

export function tiltLeave(e) {
  const el = e.currentTarget;
  el.classList.remove("is-tilting");
  el.style.setProperty("--rx", "0deg");
  el.style.setProperty("--ry", "0deg");
}

// Handlers for an element; `max` is the strongest lean in degrees.
export const tilt = (max = 8) => ({
  onPointerMove: (e) => tiltMove(e, max),
  onPointerLeave: tiltLeave,
});
