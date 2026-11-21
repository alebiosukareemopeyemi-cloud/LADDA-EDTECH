// What each node state looks like in shape, with no colour involved.
// NodeMarker draws from this table and scripts/greyscale-test.mjs checks it,
// so a state can never be told apart by colour alone.
// Keep this file free of imports so Node can run it directly.

export type NodeState = "verified" | "known" | "in_progress" | "todo" | "locked";

export type ShapeSpec = {
  silhouette: "circle" | "ring" | "diamond";
  edge: "solid" | "dashed" | "hatched" | "arc";
  glyph: "check-flag" | "cairn" | "dot-beacon" | "none" | "lock";
  fill: "filled" | "hollow" | "hatched";
  text: string; // announced to screen readers
};

export const NODE_SHAPES: Record<NodeState, ShapeSpec> = {
  verified: { silhouette: "circle", edge: "solid", glyph: "check-flag", fill: "filled", text: "Verified" },
  known: { silhouette: "circle", edge: "dashed", glyph: "cairn", fill: "hollow", text: "Known" },
  in_progress: { silhouette: "ring", edge: "arc", glyph: "dot-beacon", fill: "hollow", text: "In progress" },
  todo: { silhouette: "circle", edge: "solid", glyph: "none", fill: "hollow", text: "Not started" },
  locked: { silhouette: "diamond", edge: "hatched", glyph: "lock", fill: "hatched", text: "Locked" },
};
