import catalog from "@/content/catalog/backend.json";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseRepoUrl } from "@/lib/review/github";
import { buildCredentialPayload, type VerifiedSkill } from "./build.ts";
import { newCredentialId } from "./id.ts";
import { signPayload } from "./sign.ts";
import { findCredentialByUser, saveCredential } from "./store";

type Skill = { id: string; title: string; hours: number; stretch: boolean; project: { title: string; criteria: string[] } };
const SKILLS = catalog.skills as unknown as Skill[];

export type IssueUser = { id: string; email?: string; metadata: Record<string, unknown> };
export type ClientReview = { skillId: string; repoUrl: string; commitHash: string };
export type IssueResult = { status: number; body: unknown };

const fail = (status: number, message: string, extra?: object): IssueResult => ({
  status,
  body: { ok: false, code: "VALIDATION", message, ...extra },
});

const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim() : fallback);

// The verified skills for this user. Real mode reads what the review route saved.
// Mock mode has no database, so it takes the list from the browser. That is for demos only:
// real mode never reads reviews from the request.
async function verifiedSkills(userId: string, mock: boolean, client: ClientReview[]): Promise<VerifiedSkill[]> {
  const byId = new Map<string, { repoUrl: string; commitHash: string }>();
  if (mock) {
    for (const r of client) {
      if (!SKILLS.some((s) => s.id === r.skillId)) continue;
      if (!parseRepoUrl(r.repoUrl)) continue;
      if (!/^([0-9a-f]{7,40}|unknown)$/i.test(r.commitHash)) continue;
      byId.set(r.skillId, { repoUrl: r.repoUrl, commitHash: r.commitHash });
    }
  } else {
    const admin = createAdminClient();
    if (!admin) return [];
    const [nodes, reviews] = await Promise.all([
      admin.from("user_nodes").select("skill_id").eq("user_id", userId).eq("status", "verified"),
      admin.from("reviews").select("skill_id,repo_url,commit_sha").eq("user_id", userId),
    ]);
    const verified = new Set((nodes.data ?? []).map((r) => r.skill_id as string));
    for (const r of reviews.data ?? []) {
      if (verified.has(r.skill_id as string)) {
        byId.set(r.skill_id as string, { repoUrl: r.repo_url as string, commitHash: (r.commit_sha as string | null) ?? "unknown" });
      }
    }
  }
  return SKILLS.filter((s) => byId.has(s.id)).map((s) => ({
    skillId: s.id,
    skillName: s.title,
    taskTitle: s.project.title,
    hours: s.hours,
    criteria: s.project.criteria,
    ...(byId.get(s.id) as { repoUrl: string; commitHash: string }),
  }));
}

// Issue the credential once every required skill is verified. Asking again returns the same one.
export async function issueCredential(opts: {
  user: IssueUser;
  mock: boolean;
  clientReviews?: ClientReview[];
}): Promise<IssueResult> {
  const { user, mock } = opts;

  const existing = await findCredentialByUser(user.id, mock);
  if (existing) return { status: 200, body: { ok: true, data: { credentialId: existing.id, existing: true } } };

  const skills = await verifiedSkills(user.id, mock, opts.clientReviews ?? []);
  const have = new Set(skills.map((s) => s.skillId));
  const missing = SKILLS.filter((s) => !s.stretch && !have.has(s.id));
  if (missing.length > 0) {
    return fail(409, `Verify ${missing.length} more skill${missing.length === 1 ? "" : "s"} first: ${missing.map((m) => m.title).join(", ")}.`, {
      missing: missing.map((m) => m.id),
    });
  }

  const holder = {
    name: str(user.metadata.display_name ?? user.metadata.full_name, user.email?.split("@")[0] ?? "Ladda student"),
    university: str(user.metadata.university, "Not given"),
    department: str(user.metadata.department, "Not given"),
  };

  // The id is random, so a clash is rare. Try a few times, then give up politely.
  for (let attempt = 0; attempt < 4; attempt++) {
    const id = newCredentialId();
    const issuedAt = new Date().toISOString();
    const payload = buildCredentialPayload({ id, holder, track: catalog.roleTitle, skills, issuedAt });
    let signature: string;
    try {
      ({ signature } = await signPayload(payload));
    } catch {
      return fail(500, "We could not sign your credential. The signing key is not set up on the server.");
    }
    const saved = await saveCredential({ id, userId: user.id, payload, signature, createdAt: issuedAt }, mock);
    if (saved) return { status: 200, body: { ok: true, data: { credentialId: id, existing: false } } };
  }
  return fail(500, "We could not save your credential. Try again in a moment.");
}
