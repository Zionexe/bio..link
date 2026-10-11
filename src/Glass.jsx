import { useRef } from "react";
import { useLiquidGlass } from "./liquidGlass";

// ---------------------------------------------------------------------------
// Glass — a Liquid Glass surface. Refracts what's behind it in Chromium
// (useLiquidGlass); elsewhere the CSS blur backdrop is the fallback.
// ---------------------------------------------------------------------------
export default function Glass({ as: Tag = "div", className = "", glass, children, ...rest }) {
  const ref = useRef(null);
  useLiquidGlass(ref, glass);
  return (
    <Tag ref={ref} className={`liquid-glass ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
