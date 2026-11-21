// Lays any number of roadmap nodes along one winding trail.
// Wide (desktop): rows of four, left to right, then right to left, climbing the map.
// Compact (phones): rows of two down a tall map, so names stay readable.
// The trail is a smooth curve through the nodes (no hand-drawn path).

type Pt = { x: number; y: number };
export type TrailNode = Pt & { fraction: number };
export type TrailLayout = { d: string; nodes: TrailNode[]; view: { w: number; h: number } };

const f = (n: number) => n.toFixed(1);

const WIDE = { perRow: 4, cols: [150, 400, 650, 900], w: 1100, h: 760, top: 130, bottomPad: 200, turn: 130 };
const COMPACT = { perRow: 2, cols: [150, 370], w: 520, rowGap: 230, top: 130, bottomPad: 200, turn: 110 };

function bezierLen(p0: Pt, c1: Pt, c2: Pt, p3: Pt): number {
  let len = 0;
  let prev = p0;
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const u = 1 - t;
    const x = u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x;
    const y = u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y;
    len += Math.hypot(x - prev.x, y - prev.y);
    prev = { x, y };
  }
  return len;
}

export function trailLayout(count: number, compact = false): TrailLayout {
  const cfg = compact ? COMPACT : WIDE;
  const perRow = cfg.perRow;
  const rows = Math.max(1, Math.ceil(count / perRow));
  const h = compact ? COMPACT.top + (rows - 1) * COMPACT.rowGap + COMPACT.bottomPad : WIDE.h;
  const bottom = h - cfg.bottomPad;
  const rowY = (row: number) => (rows === 1 ? (cfg.top + bottom) / 2 : bottom - (row * (bottom - cfg.top)) / (rows - 1));

  // Nodes and the helper points that make the turns between rows smooth.
  const pts: Pt[] = [];
  const nodeIndex: number[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const forward = row % 2 === 0;
    const x = cfg.cols[forward ? col : perRow - 1 - col];
    const y = rowY(row) + (col % 2 === 0 ? 20 : -20);
    nodeIndex.push(pts.length);
    pts.push({ x, y });
    const lastInRow = col === perRow - 1 && i < count - 1;
    if (lastInRow) pts.push({ x: x + (forward ? cfg.turn : -cfg.turn), y: (rowY(row) + rowY(row + 1)) / 2 });
  }

  // Catmull-Rom through every point, as cubic Beziers.
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  const cum: number[] = [0];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
    cum.push(cum[i] + bezierLen(p1, c1, c2, p2));
  }
  const total = cum[cum.length - 1] || 1;

  return {
    d,
    view: { w: cfg.w, h },
    nodes: nodeIndex.map((idx) => ({ x: pts[idx].x, y: pts[idx].y, fraction: cum[idx] / total })),
  };
}
