import type { RepoFacts } from "../lib/review/types.ts";

export const CRITERIA = ["All routes work", "Sensible error handling", "Clear README with example requests"];

export const goodFacts: RepoFacts = {
  owner: "amina",
  repo: "notes-api",
  htmlUrl: "https://github.com/amina/notes-api",
  description: "A notes API",
  defaultBranch: "main",
  languages: { JavaScript: 12000 },
  readme:
    "# Notes API\n\nRun it with `npm start`.\n\n```\ncurl http://localhost:3000/notes\n```\n\nResponses use status 404 when a note is missing and 400 for bad input. " +
    "More text to pass the length check. ".repeat(10),
  tree: [".gitignore", "README.md", "package.json", "src/", "src/errors.js", "src/index.js", "tests/", "tests/notes.test.js"],
  packageJson: { name: "notes-api", main: "src/index.js", scripts: { start: "node src/index.js", test: "node --test" }, dependencies: ["express"], devDependencies: [] },
  latestCommitAt: "2026-11-10T10:00:00Z",
  latestCommitSha: "abc1234",
  hasTests: true,
};

export const emptyFacts: RepoFacts = {
  ...goodFacts,
  readme: null,
  tree: ["LICENSE"],
  packageJson: null,
  hasTests: false,
  latestCommitAt: null,
  latestCommitSha: null,
};

// A model answer that matches goodFacts.
export const goodModelJson = JSON.stringify([
  { criterion: "All routes work", pass: true, evidence: "src/index.js defines the routes and package.json has a start script.", fix: "" },
  { criterion: "Sensible error handling", pass: false, evidence: "src/errors.js exists but README.md does not list error cases.", fix: "List the 404 and 400 responses in the README." },
  { criterion: "Clear README with example requests", pass: true, evidence: "README.md shows a curl request.", fix: "" },
]);
