import type { PackageInfo, RepoFacts, RepoRef } from "./types.ts";

const API = "https://api.github.com";

export class RepoNotFoundError extends Error {
  constructor() {
    super("Repo not found or not public.");
  }
}
export class UpstreamError extends Error {
  reason: "rate_limited" | "unreachable";
  constructor(reason: "rate_limited" | "unreachable") {
    super(`GitHub ${reason}`);
    this.reason = reason;
  }
}

// Only public https://github.com/<owner>/<repo> links. Extra path parts such as /tree/main are ignored.
export function parseRepoUrl(input: string): RepoRef | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (!["github.com", "www.github.com"].includes(u.hostname.toLowerCase())) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(owner)) return null;
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(repo) || repo === "." || repo === "..") return null;
  return { owner, repo };
}

type FetchLike = typeof fetch;
export type FactsDeps = { fetch?: FetchLike; timeoutMs?: number };

const NO_TEST = /no test specified/i;

function toPackageInfo(raw: string): PackageInfo | null {
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
    const scripts: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj(j.scripts))) if (typeof v === "string") scripts[k] = v;
    return {
      name: typeof j.name === "string" ? j.name : undefined,
      main: typeof j.main === "string" ? j.main : undefined,
      scripts,
      dependencies: Object.keys(obj(j.dependencies)),
      devDependencies: Object.keys(obj(j.devDependencies)),
    };
  } catch {
    return null;
  }
}

// Folders and files in the top two levels, folders marked with a trailing slash.
export function shapeTree(entries: { path: string; type: string }[]): string[] {
  const out: string[] = [];
  for (const e of entries) {
    if (e.path.split("/").length > 2) continue;
    out.push(e.type === "tree" ? `${e.path}/` : e.path);
    if (out.length >= 300) break;
  }
  return out.sort();
}

export function detectTests(tree: string[], pkg: PackageInfo | null): boolean {
  const folder = tree.some((p) => /^(tests?|__tests__|spec)\//i.test(p) || /\/(tests?|__tests__|spec)\/$/i.test(p));
  const file = tree.some((p) => /\.(test|spec)\.[cm]?[jt]sx?$/i.test(p));
  const script = !!pkg?.scripts.test && !NO_TEST.test(pkg.scripts.test);
  return folder || file || script;
}

// Public GitHub REST API, no token, one shared timeout. Throws RepoNotFoundError or UpstreamError.
export async function fetchRepoFacts({ owner, repo }: RepoRef, deps: FactsDeps = {}): Promise<RepoFacts> {
  const doFetch = deps.fetch ?? fetch;
  const timeoutMs = deps.timeoutMs ?? 6000; // per request
  const base = { "User-Agent": "ladda-review", "X-GitHub-Api-Version": "2022-11-28" };
  const get = (path: string, accept = "application/vnd.github+json") =>
    doFetch(`${API}/repos/${owner}/${repo}${path}`, {
      headers: { ...base, Accept: accept },
      signal: AbortSignal.timeout(timeoutMs),
    });

  let meta: Response;
  try {
    meta = await get("");
  } catch {
    throw new UpstreamError("unreachable");
  }
  if (meta.status === 404) throw new RepoNotFoundError();
  if (meta.status === 403 || meta.status === 429) throw new UpstreamError("rate_limited");
  if (!meta.ok) throw new UpstreamError("unreachable");
  const info = (await meta.json()) as {
    description?: string | null;
    default_branch?: string;
    html_url?: string;
    private?: boolean;
  };
  if (info.private) throw new RepoNotFoundError();
  const branch = info.default_branch || "main";

  // A missing README is a fact (the repo has none). A request that fails is not: without the
  // tree, README or package.json we would mark good work as missing, so that counts as unreachable.
  const attempt = async (p: Promise<Response>): Promise<{ res: Response | null; failed: boolean }> => {
    try {
      return { res: await p, failed: false };
    } catch {
      return { res: null, failed: true };
    }
  };
  const [langA, readmeA, treeA, pkgA, commitA] = await Promise.all([
    attempt(get("/languages")),
    attempt(get("/readme", "application/vnd.github.raw+json")),
    attempt(get(`/git/trees/${encodeURIComponent(branch)}?recursive=1`)),
    attempt(get("/contents/package.json", "application/vnd.github.raw+json")),
    attempt(get("/commits?per_page=1")),
  ]);
  if (readmeA.failed || treeA.failed || pkgA.failed) throw new UpstreamError("unreachable");
  if ([readmeA, treeA, pkgA].some((a) => a.res?.status === 403 || a.res?.status === 429)) {
    throw new UpstreamError("rate_limited");
  }
  const [langRes, readmeRes, treeRes, pkgRes, commitRes] = [langA.res, readmeA.res, treeA.res, pkgA.res, commitA.res];

  const json = async <T>(r: Response | null): Promise<T | null> => {
    if (!r || !r.ok) return null;
    try {
      return (await r.json()) as T;
    } catch {
      return null;
    }
  };

  const languages = (await json<Record<string, number>>(langRes)) ?? {};
  const readmeText = readmeRes && readmeRes.ok ? await readmeRes.text().catch(() => null) : null;
  const treeJson = await json<{ tree?: { path: string; type: string }[] }>(treeRes);
  const tree = shapeTree(treeJson?.tree ?? []);
  const pkgText = pkgRes && pkgRes.ok ? await pkgRes.text().catch(() => null) : null;
  const packageJson = pkgText ? toPackageInfo(pkgText) : null;
  const commits = await json<{ sha?: string; commit?: { committer?: { date?: string } } }[]>(commitRes);
  const latest = commits?.[0];

  return {
    owner,
    repo,
    htmlUrl: info.html_url ?? `https://github.com/${owner}/${repo}`,
    description: info.description ?? null,
    defaultBranch: branch,
    languages,
    readme: readmeText ? readmeText.slice(0, 6000) : null,
    tree,
    packageJson,
    latestCommitAt: latest?.commit?.committer?.date ?? null,
    latestCommitSha: latest?.sha ? latest.sha.slice(0, 7) : null,
    hasTests: detectTests(tree, packageJson),
  };
}
