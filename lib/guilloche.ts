// Guilloche: the fine looping lines on banknotes and passports.
// Generated from a few overlapping sine waves, so there is no hand-drawn path.

export function guillochePaths({
  width = 720,
  height = 96,
  lines = 16,
  step = 6,
}: { width?: number; height?: number; lines?: number; step?: number } = {}): string[] {
  const mid = height / 2;
  return Array.from({ length: lines }, (_, i) => {
    const phase = (i / lines) * Math.PI * 2;
    const amp = height * 0.34;
    let d = "";
    for (let x = 0; x <= width; x += step) {
      // A fast wave inside a slow envelope, shifted a little for each line.
      const envelope = 0.55 + 0.45 * Math.sin(x * 0.011 + phase * 1.5);
      const y = mid + amp * envelope * Math.sin(x * 0.045 + phase) + (i - lines / 2) * 0.9;
      d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
    }
    return d;
  });
}
