// Topographic contour rings for the landing backdrop.
// One helper generates every ring: each is a smooth closed curve whose
// outline wobbles a little and drifts from the ring before it.

export type Ring = { d: string; stroke: string; opacity: number };

type Options = {
  count?: number;
  cx?: number;
  cy?: number;
  /** Radius of the innermost ring. */
  r0?: number;
  /** Gap between rings. */
  step?: number;
  /** Points per ring. More points, more detail. */
  points?: number;
};

const FROM = [0x1b, 0x3a, 0x2a];
const TO = [0x24, 0x49, 0x3a];

function mix(t: number): string {
  const c = FROM.map((v, i) => Math.round(v + (TO[i] - v) * t));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

const f = (n: number) => n.toFixed(1);

// Closed Catmull-Rom spline turned into cubic Beziers.
function smoothClosed(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}

export function contourRings({
  count = 13,
  cx = 1060,
  cy = 250,
  r0 = 70,
  step = 56,
  points = 16,
}: Options = {}): Ring[] {
  return Array.from({ length: count }, (_, i) => {
    const t = count > 1 ? i / (count - 1) : 0;
    const base = r0 + i * step;
    // Each ring drifts a little from the one inside it.
    const ox = cx - i * 5;
    const oy = cy + i * 3.5;
    const pts: [number, number][] = Array.from({ length: points }, (_, k) => {
      const a = (k / points) * Math.PI * 2;
      const wobble =
        1 +
        0.08 * Math.sin(a * 2 + i * 0.32) +
        0.045 * Math.sin(a * 3 - i * 0.5 + 1.3) +
        0.025 * Math.sin(a * 5 + i * 0.8);
      const r = base * wobble;
      return [ox + Math.cos(a) * r * 1.2, oy + Math.sin(a) * r * 0.88];
    });
    return { d: smoothClosed(pts), stroke: mix(t), opacity: 0.8 - t * 0.35 };
  });
}
