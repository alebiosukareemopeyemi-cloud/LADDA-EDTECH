import type { CheckResult, RepoFacts } from "./types.ts";

// A deterministic review from the same facts the model gets. It never runs code,
// so it only checks what the facts can show, and it says so in the evidence.

const readmeName = (f: RepoFacts) => f.tree.find((p) => /^readme(\.[a-z]+)?$/i.test(p)) ?? "README";
const files = (f: RepoFacts) => f.tree.filter((p) => !p.endsWith("/"));
const deps = (f: RepoFacts) => [...(f.packageJson?.dependencies ?? []), ...(f.packageJson?.devDependencies ?? [])];
const hasDep = (f: RepoFacts, ...names: string[]) => names.some((n) => deps(f).includes(n));
const find = (f: RepoFacts, re: RegExp) => files(f).find((p) => re.test(p));

type Verdict = { pass: boolean; evidence: string; fix: string };
const NOTE = " This is a file check only: the code was not run.";

function readmeRule(f: RepoFacts): Verdict {
  const text = f.readme ?? "";
  const ok = text.length >= 300 && (text.includes("```") || /\b(npm|node|curl|http)\b/i.test(text));
  return ok
    ? { pass: true, evidence: `${readmeName(f)} has ${text.length} characters and shows run steps or example requests.`, fix: "" }
    : {
        pass: false,
        evidence: text ? `${readmeName(f)} is short or has no run steps or example requests.` : "No README file was found.",
        fix: "Add a README.md that explains how to install and run the project, and shows at least one example request or command.",
      };
}

function runRule(f: RepoFacts): Verdict {
  const s = f.packageJson?.scripts ?? {};
  const script = s.start ? "start" : s.dev ? "dev" : null;
  const hasCode = files(f).some((p) => /\.(c|m)?[jt]sx?$/.test(p));
  if (f.packageJson && (script || f.packageJson.main) && hasCode) {
    return {
      pass: true,
      evidence: `package.json has ${script ? `a "${script}" script` : `main set to ${f.packageJson.main}`} and the repo has source files.${NOTE}`,
      fix: "",
    };
  }
  return {
    pass: false,
    evidence: f.packageJson ? "package.json has no start script and no main file." : "No package.json was found.",
    fix: 'Add a package.json with a "start" script (for example "start": "node index.js") so a reviewer can run the project with npm start.',
  };
}

function errorRule(f: RepoFacts): Verdict {
  const file = find(f, /(error|middleware|handler)/i);
  const mentioned = /\b(404|400|status code|error)\b/i.test(f.readme ?? "");
  if (file || mentioned) {
    return {
      pass: true,
      evidence: file ? `${file} looks like error handling.${NOTE}` : `The README describes error responses.${NOTE}`,
      fix: "",
    };
  }
  return {
    pass: false,
    evidence: "No error-handling file was found and the README does not mention error responses.",
    fix: "Return clear status codes (404 when something is missing, 400 for bad input) with a JSON error message, and list them in the README.",
  };
}

function testRule(f: RepoFacts): Verdict {
  return f.hasTests
    ? { pass: true, evidence: "A tests folder, a test file or a test script in package.json exists.", fix: "" }
    : {
        pass: false,
        evidence: "No tests folder, test file or test script was found.",
        fix: 'Add a tests folder and a "test" script in package.json so the checks can be run in one command.',
      };
}

function typesRule(f: RepoFacts): Verdict {
  const cfg = find(f, /^tsconfig\.json$/);
  return cfg || files(f).some((p) => /\.tsx?$/.test(p))
    ? { pass: true, evidence: `${cfg ?? "TypeScript source files"} found.`, fix: "" }
    : { pass: false, evidence: "No tsconfig.json or TypeScript files were found.", fix: "Add TypeScript: a tsconfig.json and .ts files with typed functions." };
}

function dataRule(f: RepoFacts): Verdict {
  const sql = find(f, /\.sql$/i);
  const dep = ["pg", "prisma", "@prisma/client", "sequelize", "knex", "mysql2", "better-sqlite3", "sqlite3", "typeorm"].find((d) => hasDep(f, d));
  return sql || dep
    ? { pass: true, evidence: `${sql ?? `package.json lists ${dep}`} shows a database is used.`, fix: "" }
    : { pass: false, evidence: "No .sql file and no database package in package.json.", fix: "Add your schema as a .sql file or migrations, and show how to create the tables in the README." };
}

function authRule(f: RepoFacts): Verdict {
  const dep = ["jsonwebtoken", "bcrypt", "bcryptjs", "argon2", "passport", "jose"].find((d) => hasDep(f, d));
  return dep || /\b(jwt|password|login|token)\b/i.test(f.readme ?? "")
    ? { pass: true, evidence: dep ? `package.json lists ${dep}.` : "The README describes login or tokens.", fix: "" }
    : { pass: false, evidence: "No auth package in package.json and no mention of login in the README.", fix: "Add login with hashed passwords and a signed token, and describe the routes that need it in the README." };
}

function deployRule(f: RepoFacts): Verdict {
  const file = find(f, /(^dockerfile$|^vercel\.json$|^fly\.toml$|^render\.yaml$|workflows\/)/i);
  const live = /https:\/\/[^\s)]+/i.test(f.readme ?? "") && /(live|deployed|demo)/i.test(f.readme ?? "");
  return file || live
    ? { pass: true, evidence: file ? `${file} found.` : "The README links to a live URL.", fix: "" }
    : { pass: false, evidence: "No Dockerfile, deploy config or live link was found.", fix: "Deploy the project, then add the live link to the README or add a Dockerfile." };
}

function gitRule(f: RepoFacts): Verdict {
  const ok = !!f.latestCommitAt && files(f).includes(".gitignore");
  return ok
    ? { pass: true, evidence: `.gitignore exists and the latest commit is ${f.latestCommitAt?.slice(0, 10)}.`, fix: "" }
    : { pass: false, evidence: "No .gitignore or no commit history was found.", fix: "Commit your work in small steps and add a .gitignore so node_modules is not tracked." };
}

function defaultRule(f: RepoFacts): Verdict {
  const ok = files(f).length >= 3 && !!f.readme;
  return ok
    ? { pass: true, evidence: `${readmeName(f)} and ${files(f).length} files were found.${NOTE}`, fix: "" }
    : { pass: false, evidence: "The repo has very few files or no README.", fix: "Add the missing parts of the brief and explain them in the README." };
}

function judge(criterion: string, f: RepoFacts): Verdict {
  const c = criterion.toLowerCase();
  if (files(f).length < 2) {
    return { pass: false, evidence: "The repo looks empty.", fix: "Push your project to the default branch, then submit the link again." };
  }
  if (/\bruns?\b|without errors|\bstarts?\b/.test(c)) return runRule(f);
  if (/readme|document|instruction/.test(c)) return readmeRule(f);
  if (/error|validation|status code|handling/.test(c)) return errorRule(f);
  if (/test/.test(c)) return testRule(f);
  if (/typescript|types/.test(c)) return typesRule(f);
  if (/sql|database|schema|quer|table/.test(c)) return dataRule(f);
  if (/auth|login|password|token|secur/.test(c)) return authRule(f);
  if (/deploy|live|docker|ci\b/.test(c)) return deployRule(f);
  if (/commit|branch|pull request|\bgit\b/.test(c)) return gitRule(f);
  if (/work|route/.test(c)) return runRule(f);
  return defaultRule(f);
}

export function heuristicReview(criteria: string[], facts: RepoFacts): CheckResult[] {
  return criteria.map((criterion) => ({ criterion, ...judge(criterion, facts) }));
}
