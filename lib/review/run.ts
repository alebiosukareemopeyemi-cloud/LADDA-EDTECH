import { fetchRepoFacts, parseRepoUrl, RepoNotFoundError, UpstreamError } from "./github.ts";
import { reviewWithGemini, type GenerateFn } from "./gemini.ts";
import { heuristicReview } from "./heuristic.ts";
import type { CheckResult, RepoFacts, ReviewSource } from "./types.ts";

export class InvalidRepoUrlError extends Error {
  constructor() {
    super("Not a public github.com/<owner>/<repo> link.");
  }
}
export { RepoNotFoundError };

export type RepoSummary = {
  owner: string;
  repo: string;
  url: string;
  defaultBranch: string;
  commit: string | null;
  latestCommitAt: string | null;
};

export type ReviewOutcome =
  | { status: "reviewed"; source: ReviewSource; approved: boolean; checks: CheckResult[]; repo: RepoSummary }
  | { status: "unavailable"; reason: "github_rate_limited" | "github_unreachable"; message: string };

export type RunDeps = {
  fetchFacts?: (ref: { owner: string; repo: string }) => Promise<RepoFacts>;
  generate?: GenerateFn;
};

// The whole review: validate the link, read the repo, ask the model, and fall back to
// the heuristic on any model failure. Upstream trouble never throws to the caller,
// except a repo that does not exist (the student can fix that) and a bad link.
export async function runReview(repoUrl: string, criteria: string[], deps: RunDeps = {}): Promise<ReviewOutcome> {
  const ref = parseRepoUrl(repoUrl);
  if (!ref) throw new InvalidRepoUrlError();

  let facts: RepoFacts;
  try {
    facts = await (deps.fetchFacts ?? ((r) => fetchRepoFacts(r)))(ref);
  } catch (e) {
    if (e instanceof RepoNotFoundError) throw e;
    const rate = e instanceof UpstreamError && e.reason === "rate_limited";
    return {
      status: "unavailable",
      reason: rate ? "github_rate_limited" : "github_unreachable",
      message: rate
        ? "GitHub is limiting requests right now. Wait a minute and submit again."
        : "We could not reach GitHub. Check that the repo is public, wait a moment, and submit again.",
    };
  }

  let checks: CheckResult[];
  let source: ReviewSource = "gemini";
  try {
    checks = await reviewWithGemini(criteria, facts, deps.generate);
  } catch {
    checks = heuristicReview(criteria, facts);
    source = "heuristic";
  }

  return {
    status: "reviewed",
    source,
    approved: checks.every((c) => c.pass),
    checks,
    repo: {
      owner: facts.owner,
      repo: facts.repo,
      url: facts.htmlUrl,
      defaultBranch: facts.defaultBranch,
      commit: facts.latestCommitSha,
      latestCommitAt: facts.latestCommitAt,
    },
  };
}
