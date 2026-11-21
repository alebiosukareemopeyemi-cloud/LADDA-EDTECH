import { contourRings } from "@/lib/contours";
import { VIEW } from "./trailData";

// 13 topographic rings, generated once at build time. Decorative.
const RINGS = contourRings({ count: 13 });

export default function ContourBackdrop() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full"
    >
      {RINGS.map((r, i) => (
        <path key={i} d={r.d} fill="none" stroke={r.stroke} strokeWidth="1" strokeOpacity={r.opacity} />
      ))}
    </svg>
  );
}
