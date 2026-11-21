// The landing trail: one route in a 1440x900 space, with eight knots.
import type { NodeState } from "@/lib/node-shapes";
import { DEMO_ROADMAP, SUMMIT_NODE } from "@/lib/demo/roadmap";

export const VIEW = { w: 1440, h: 900 } as const;

// Each segment is [x1,y1, x2,y2, x,y]: two control points and the end knot.
const START: [number, number] = [540, 830];
const SEGMENTS: number[][] = [
  [620, 830, 680, 770, 760, 770],
  [840, 770, 880, 700, 960, 700],
  [1040, 700, 1130, 690, 1130, 610],
  [1130, 540, 960, 580, 960, 500],
  [960, 430, 1120, 450, 1120, 380],
  [1120, 310, 1010, 310, 1010, 230],
  [1010, 170, 1170, 190, 1170, 130],
];

export const ROUTE =
  `M${START[0]} ${START[1]}` + SEGMENTS.map((s) => `C${s.slice(0, 4).join(" ")} ${s[4]} ${s[5]}`).join("");

type Pt = [number, number];
function bezierLength(p0: Pt, s: number[]): number {
  const p1: Pt = [s[0], s[1]];
  const p2: Pt = [s[2], s[3]];
  const p3: Pt = [s[4], s[5]];
  let len = 0;
  let prev = p0;
  for (let i = 1; i <= 64; i++) {
    const t = i / 64;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    len += Math.hypot(x - prev[0], y - prev[1]);
    prev = [x, y];
  }
  return len;
}

// How far along the route (0 to 1) each knot sits. Every knot is a segment end.
export const KNOT_FRACTIONS: number[] = (() => {
  const cum: number[] = [0];
  let from: Pt = START;
  for (const s of SEGMENTS) {
    cum.push(cum[cum.length - 1] + bezierLength(from, s));
    from = [s[4], s[5]];
  }
  return cum.map((c) => c / cum[cum.length - 1]);
})();

export type Knot = {
  id: string;
  x: number;
  y: number;
  state: NodeState;
  label: string;
  percent?: number;
  side: "left" | "right" | "above" | "below";
};

// Where each stop sits and which side its name goes, so no name lands on the
// route or the headline column. States and names come from lib/demo/roadmap.
const PLACES: { x: number; y: number; side: Knot["side"] }[] = [
  { x: 540, y: 830, side: "left" },
  { x: 760, y: 770, side: "below" },
  { x: 960, y: 700, side: "above" },
  { x: 1130, y: 610, side: "right" },
  { x: 960, y: 500, side: "left" },
  { x: 1120, y: 380, side: "right" },
  { x: 1010, y: 230, side: "left" },
];

export const KNOTS: Knot[] = PLACES.map((p, i) => {
  const n = DEMO_ROADMAP[i];
  return { id: n.id, x: p.x, y: p.y, side: p.side, state: n.state, label: n.label, percent: n.percent };
});

// The summit (K7): a flag and a seal.
export const SUMMIT = { id: SUMMIT_NODE.id, x: 1170, y: 130, label: SUMMIT_NODE.label } as const;

// The finished part of the route ends at the in-progress knot.
export const DONE_FRACTION = KNOT_FRACTIONS[2];
