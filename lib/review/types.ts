// Shared shapes for the live repo review. No imports, so Node can run the tests directly.

export type PackageInfo = {
  name?: string;
  main?: string;
  scripts: Record<string, string>;
  dependencies: string[];
  devDependencies: string[];
};

// Everything the reviewer is allowed to know about a repo. Nothing is run.
export type RepoFacts = {
  owner: string;
  repo: string;
  htmlUrl: string;
  description: string | null;
  defaultBranch: string;
  languages: Record<string, number>;
  /** First 6000 characters of the README. Untrusted text. */
  readme: string | null;
  /** Top two levels. Folders end with a slash. */
  tree: string[];
  packageJson: PackageInfo | null;
  latestCommitAt: string | null;
  latestCommitSha: string | null;
  hasTests: boolean;
};

export type CheckResult = {
  criterion: string;
  pass: boolean;
  /** Names or quotes real files from the facts. */
  evidence: string;
  /** Plain words. Empty when the check passes. */
  fix: string;
};

export type ReviewSource = "gemini" | "heuristic";

export type RepoRef = { owner: string; repo: string };
