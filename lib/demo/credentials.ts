import catalog from "@/content/catalog/backend.json";
import type { CredentialPayload, CredentialSkill } from "@/lib/contract";

// Three sample credentials. Typed, no network. The /api/verify route signs each
// payload with the app's ed25519 key at request time, so the verifier says Valid.
export type DemoCredential = {
  payload: CredentialPayload;
  summary: string;
  hours: number;
  projects: number;
  issuedLabel: string;
};

type CatalogSkill = {
  id: string;
  title: string;
  project: { title: string; criteria: string[] };
};
const SKILLS = catalog.skills as unknown as CatalogSkill[];

// Small deterministic helpers so the data is the same on every run.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const commit = (s: string) => hash(s).toString(16).padStart(8, "0").slice(0, 7);
const score = (s: string) => 74 + (hash(s) % 21); // 74 to 94

function skillFor(credId: string, s: CatalogSkill): CredentialSkill {
  const scores: Record<string, number> = {};
  for (const c of s.project.criteria) scores[c] = score(`${credId}:${s.id}:${c}`);
  const values = Object.values(scores);
  return {
    skillId: s.id,
    skillName: s.title,
    taskTitle: s.project.title,
    repoUrl: `https://github.com/example/${credId}-${s.id}`,
    commitHash: commit(`${credId}:${s.id}`),
    overall: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    scores,
    certificate: null,
  };
}

function build(opts: {
  id: string;
  name: string;
  university: string;
  department: string;
  issuedAt: string;
  issuedLabel: string;
  hours: number;
  skip: string[]; // catalog skills this person did not need a project for
  summary: string;
}): DemoCredential {
  const skills = SKILLS.filter((s) => !opts.skip.includes(s.id)).map((s) => skillFor(opts.id, s));
  return {
    payload: {
      id: opts.id,
      candidateName: opts.name,
      university: opts.university,
      department: opts.department,
      roleTitle: "Backend with Node.js",
      issuedAt: opts.issuedAt,
      skills,
      verifiedHours: opts.hours,
    },
    summary: opts.summary,
    hours: opts.hours,
    projects: skills.length,
    issuedLabel: opts.issuedLabel,
  };
}

export const DEMO_CREDENTIALS: Record<string, DemoCredential> = {
  "demo-001": build({
    id: "demo-001",
    name: "Amina Bello",
    university: "University of Lagos",
    department: "Computer Science",
    issuedAt: "2026-11-14T12:00:00Z",
    issuedLabel: "14 Nov 2026",
    hours: 96,
    skip: ["cli-dev-setup"],
    summary:
      "Amina Bello has 11 skills verified by approved projects, from Git and HTTP to authentication, deployment and a capstone API. Each was checked against a rubric, and the repo and commit behind every score are listed below.",
  }),
  "demo-002": build({
    id: "demo-002",
    name: "Tunde Okafor",
    university: "Obafemi Awolowo University",
    department: "Electronic and Electrical Engineering",
    issuedAt: "2026-11-09T12:00:00Z",
    issuedLabel: "9 Nov 2026",
    hours: 98,
    skip: ["testing"],
    summary:
      "Tunde Okafor has 11 skills verified by approved projects, covering the full backend path except testing. Each was checked against a rubric, and the repo and commit behind every score are listed below.",
  }),
  "demo-003": build({
    id: "demo-003",
    name: "Chiamaka Eze",
    university: "University of Nigeria, Nsukka",
    department: "Computer Science",
    issuedAt: "2026-11-18T12:00:00Z",
    issuedLabel: "18 Nov 2026",
    hours: 105,
    skip: [],
    summary:
      "Chiamaka Eze has all 12 skills on the backend path verified by approved projects, including the stretch topics. Each was checked against a rubric, and the repo and commit behind every score are listed below.",
  }),
};
