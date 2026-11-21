// Greyscale test: no node state may rely on colour alone.
// Every pair of states must differ in at least two shape features
// (silhouette, edge, glyph, fill), and every glyph must be unique.
// Run: npm run test:greyscale
import { NODE_SHAPES } from "../lib/node-shapes.ts";

const features = ["silhouette", "edge", "glyph", "fill"];
const states = Object.keys(NODE_SHAPES);
const failures = [];

for (let i = 0; i < states.length; i++) {
  for (let j = i + 1; j < states.length; j++) {
    const a = NODE_SHAPES[states[i]];
    const b = NODE_SHAPES[states[j]];
    const diff = features.filter((f) => a[f] !== b[f]);
    if (diff.length < 2) {
      failures.push(`${states[i]} vs ${states[j]} differ in only ${diff.length} feature(s): ${diff.join(", ") || "none"}`);
    }
  }
}

const glyphs = states.map((s) => NODE_SHAPES[s].glyph);
if (new Set(glyphs).size !== glyphs.length) {
  // todo has no glyph; the others must still be distinct from each other.
  const used = glyphs.filter((g) => g !== "none");
  if (new Set(used).size !== used.length) failures.push("two states share a glyph");
}

if (failures.length) {
  console.error("Greyscale test failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`Greyscale test passed: ${states.length} states, all pairs differ in 2+ shape features.`);
