import catalog from "@/content/catalog/backend.json";
import { ReviewRequestSchema } from "@/lib/contract/review";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvalidRepoUrlError, RepoNotFoundError, runReview, type RunDeps } from "./run.ts";
import { takeReviewSlot, REVIEW_LIMIT } from "./rate-limit.ts";
import { parseRepoUrl } from "./github.ts";

type Skill = { id: string; project: { criteria: string[] } };

export type HandlerResult = { status: number; body: unknown };

const fail = (status: number, code: string, message: string, extra?: object): HandlerResult => ({
  status,
  body: { ok: false, code, message, ...extra },
});

// Save an approved node and the review behind it. Only runs outside mock mode.
async function persistApproval(
  userId: string,
  nodeId: string,
  r: { source: string; checks: unknown; repoUrl: string; commit: string | null }
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const now = new Date().toISOString();
  const node = await admin
    .from("user_nodes")
    .upsert({ user_id: userId, skill_id: nodeId, status: "verified", source: "task", updated_at: now }, { onConflict: "user_id,skill_id" });
  const review = await admin.from("reviews").upsert(
    { user_id: userId, skill_id: nodeId, repo_url: r.repoUrl, commit_sha: r.commit, source: r.source, checks: r.checks, created_at: now },
    { onConflict: "user_id,skill_id" }
  );
  return !node.error && !review.error;
}

// Everything the review routes share. The route supplies who the user is.
export async function handleReview(
  raw: unknown,
  ctx: { userId: string; mock: boolean },
  deps?: RunDeps
): Promise<HandlerResult> {
  const parsed = ReviewRequestSchema.safeParse(raw);
  if (!parsed.success) return fail(400, "VALIDATION", "Send a skill and a GitHub repo link.");
  const { nodeId, repoUrl } = parsed.data;

  const skill = (catalog.skills as unknown as Skill[]).find((s) => s.id === nodeId);
  if (!skill) return fail(404, "VALIDATION", "That skill does not exist.");

  // A bad link is the student's typo: tell them, and do not count it against the hourly limit.
  if (!parseRepoUrl(repoUrl)) {
    return fail(400, "VALIDATION", "Paste a public GitHub repo link, like https://github.com/you/project.");
  }

  const slot = takeReviewSlot(ctx.userId);
  if (!slot.allowed) {
    return fail(429, "RATE_LIMITED", `You have used ${REVIEW_LIMIT} reviews this hour. Try again in ${Math.ceil(slot.retryAfterSec / 60)} minutes.`, {
      retryAfterSec: slot.retryAfterSec,
    });
  }

  try {
    const out = await runReview(repoUrl, skill.project.criteria, deps);
    if (out.status === "unavailable") return { status: 200, body: { ok: true, data: out } };

    let persisted = false;
    if (out.approved && !ctx.mock) {
      persisted = await persistApproval(ctx.userId, nodeId, {
        source: out.source,
        checks: out.checks,
        repoUrl: out.repo.url,
        commit: out.repo.commit,
      }).catch(() => false);
    }
    return { status: 200, body: { ok: true, data: { ...out, persisted, remaining: slot.remaining } } };
  } catch (e) {
    if (e instanceof InvalidRepoUrlError) {
      return fail(400, "VALIDATION", "Paste a public GitHub repo link, like https://github.com/you/project.");
    }
    if (e instanceof RepoNotFoundError) {
      return fail(422, "VALIDATION", "We could not find a public repo at that link. Check the spelling and that the repo is public.");
    }
    // Anything unexpected still must not surface as a 500 to the student.
    return { status: 200, body: { ok: true, data: { status: "unavailable", reason: "github_unreachable", message: "The review is not available right now. Wait a moment and submit again." } } };
  }
}
