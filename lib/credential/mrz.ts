// A machine-readable strip for the bottom of the passport page.
// Pure decoration built from the record: two 44-character lines.

const clean = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "<")
    .replace(/^<|<$/g, "");

const pad = (s: string, n = 44) => (s + "<".repeat(n)).slice(0, n);

export function mrzLines(opts: { name: string; id: string; hours: number | string; projects: number; issuedIso: string }) {
  const parts = opts.name.trim().split(/\s+/);
  const first = clean(parts[0] ?? "");
  const last = clean(parts.slice(1).join(" "));
  const date = opts.issuedIso.slice(0, 10).replace(/-/g, "");
  return [
    pad(`LADDA<<${last}<<${first}`),
    pad(`${clean(opts.id)}<${clean(String(opts.hours))}H<${opts.projects}P<${date}`),
  ];
}
