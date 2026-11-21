import { z } from "zod";
import type { CheckResult, RepoFacts } from "./types.ts";

const ItemSchema = z.object({
  criterion: z.string().min(1),
  pass: z.boolean(),
  evidence: z.string().min(1).max(800),
  fix: z.string().max(800),
});

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Pull a JSON array out of model text, even when it is wrapped in a code fence or prose.
export function extractJson(text: string): unknown | null {
  const unfenced = text.replace(/```(?:json)?/gi, "");
  const start = unfenced.indexOf("[");
  const end = unfenced.lastIndexOf("]");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(unfenced.slice(start, end + 1));
  } catch {
    return null;
  }
}

// A path or file name with a code or config extension. Dots are allowed inside the name (notes.test.js).
const FILE_RE = /(?<![\w./-])((?:[\w.-]+\/)*[\w-][\w.-]*\.(?:js|jsx|ts|tsx|mjs|cjs|json|md|yml|yaml|sql|py|html|css|env|toml|lock))\b/g;
const NOT_FILES = /^(node|express|next|vue|react|nest|nuxt|socket)\.js$/i;

// File names the evidence mentions that are not in the repo facts. Empty means every mention is real.
export function unknownFileMentions(evidence: string, facts: RepoFacts): string[] {
  const known = new Set<string>();
  for (const p of facts.tree) {
    const clean = p.replace(/\/$/, "").toLowerCase();
    known.add(clean);
    known.add(clean.split("/").pop() as string);
  }
  if (facts.readme) known.add("readme.md");
  if (facts.packageJson) known.add("package.json");
  const bad: string[] = [];
  for (const m of evidence.matchAll(FILE_RE)) {
    const token = m[1];
    if (NOT_FILES.test(token)) continue;
    const lower = token.toLowerCase();
    if (known.has(lower) || known.has(lower.split("/").pop() as string)) continue;
    if (/^readme(\.[a-z]+)?$/.test(lower) && facts.readme) continue;
    bad.push(token);
  }
  return bad;
}

// Validate the model output: strict JSON, exactly one entry per criterion, real files only.
// Returns null when anything is off, so the caller can retry or fall back.
export function parseReviewJson(text: string, criteria: string[], facts?: RepoFacts): CheckResult[] | null {
  const raw = extractJson(text);
  const parsed = z.array(ItemSchema).safeParse(raw);
  if (!parsed.success || parsed.data.length !== criteria.length) return null;

  const out: CheckResult[] = [];
  for (const criterion of criteria) {
    const item = parsed.data.find((i) => norm(i.criterion) === norm(criterion));
    if (!item) return null;
    if (!item.pass && item.fix.trim() === "") return null; // a failure must say how to fix it
    if (facts && unknownFileMentions(item.evidence, facts).length > 0) return null;
    out.push({ criterion, pass: item.pass, evidence: item.evidence.trim(), fix: item.pass ? "" : item.fix.trim() });
  }
  return out;
}
