import { z } from "zod";
import {
  envelope,
  NodeDetailSchema,
  RoadmapSchema,
  EvidencePollSchema,
  SubmitProjectResponseSchema,
  VerifyResponseSchema,
  OpportunityListSchema,
  OpportunitySchema,
  DemoResultSchema,
  SuggestPathsResponseSchema,
  BuildRoadmapResponseSchema,
  ReviewResponseSchema,
  type ReviewResponse,
  type ReviewedResponse,
  type ApiResult,
  type BuildRoadmapRequest,
  type BuildRoadmapResponse,
  type DemoRequest,
  type EvidencePoll,
  type NodeDetail,
  type OpportunityList,
  type Opportunity,
  type PathSuggestion,
  type Roadmap,
  type VerifyResponse,
  type DemoResult,
} from "@/lib/contract";
import { mockRoadmap, mockNodeDetail } from "@/lib/mocks/roadmap";
import {
  mockPollEvidence,
  mockVerify,
  mockVerifyTampered,
  mockOpportunities,
  mockDemoCourse,
  mockDemoGraduate,
} from "@/lib/mocks/other";
import { mockPaths } from "@/lib/mocks/intake";
import { buildPlannedRoadmap } from "@/lib/intake/planner";
import { applyVerified } from "@/lib/roadmap/progress";
import { localReviews, localVerifiedIds, markLocalVerified, saveLocalCredentialId } from "@/lib/review/local";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

// Fake network delay so skeletons and polling UI get tested on mocks.
const wait = () => new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

async function mock<T>(data: T): Promise<ApiResult<T>> {
  await wait();
  return { ok: true, data };
}

function notFound(): ApiResult<never> {
  return { ok: false, code: "VALIDATION", message: "Not found" };
}

// Real mode: call the route, validate the response with the same contract schema.
async function call<T extends z.ZodType>(
  path: string,
  schema: T,
  init?: RequestInit
): Promise<ApiResult<z.infer<T>>> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const parsed = envelope(schema).safeParse(await res.json());
    if (!parsed.success) {
      return { ok: false, code: "VALIDATION", message: "Unexpected response from server" };
    }
    return parsed.data as ApiResult<z.infer<T>>;
  } catch {
    return { ok: false, code: "VALIDATION", message: "Network error. Try again." };
  }
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

// ---- Mock bridge: the roadmap Intake builds, kept for this browser tab ----
const INTAKE_KEY = "ladda:intake-roadmap";

function savedIntakeRoadmap(): Roadmap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(INTAKE_KEY);
    if (!raw) return null;
    const parsed = RoadmapSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// ---- Roadmap and nodes ----
// Mock mode: the roadmap Intake built (or the demo student), plus whatever this browser has verified.
function mockRoadmapNow(): Roadmap {
  return applyVerified(savedIntakeRoadmap() ?? mockRoadmap, localVerifiedIds());
}

export async function getRoadmap(): Promise<ApiResult<Roadmap>> {
  if (USE_MOCKS) return mock(mockRoadmapNow());
  return call("/api/roadmap", RoadmapSchema);
}

export async function getNodeDetail(nodeId: string): Promise<ApiResult<NodeDetail>> {
  if (USE_MOCKS) {
    const d = mockNodeDetail(nodeId, mockRoadmapNow().nodes);
    return d ? mock(d) : notFound();
  }
  return call(`/api/roadmap?node=${encodeURIComponent(nodeId)}`, NodeDetailSchema);
}

// ---- Live repo review (real in both modes: only where the result is saved differs) ----
export async function reviewRepo(nodeId: string, repoUrl: string): Promise<ApiResult<ReviewResponse>> {
  return call("/api/review", ReviewResponseSchema, post({ nodeId, repoUrl }));
}

// ---- Credential on completion ----
const IssuedSchema = z.object({ credentialId: z.string(), existing: z.boolean() });

// Real mode: the server already has your reviews. Mock mode: the browser lists what it verified.
export async function issueMyCredential(): Promise<ApiResult<{ credentialId: string; existing: boolean }>> {
  const reviews = USE_MOCKS
    ? Object.entries(localReviews()).map(([skillId, r]) => ({ skillId, repoUrl: r.repoUrl, commitHash: r.commitHash }))
    : undefined;
  const res = await call("/api/credential/issue", IssuedSchema, post({ reviews }));
  if (res.ok && USE_MOCKS) saveLocalCredentialId(res.data.credentialId);
  return res;
}

// Keep an approved review so a demo survives a refresh. Mock mode only: the server saves it otherwise.
export function rememberApproval(nodeId: string, r: ReviewedResponse) {
  if (!USE_MOCKS) return;
  markLocalVerified(nodeId, {
    repoUrl: r.repo.url,
    commitHash: r.repo.commit ?? "unknown",
    criteria: r.checks.map((c) => c.criterion),
    at: new Date().toISOString(),
  });
}

// ---- Intake ----
export async function suggestPaths(
  interests: string
): Promise<ApiResult<{ paths: PathSuggestion[] }>> {
  if (USE_MOCKS) return mock({ paths: mockPaths });
  return call("/api/intake/suggest-paths", SuggestPathsResponseSchema, post({ interests }));
}

export async function buildRoadmap(
  req: BuildRoadmapRequest
): Promise<ApiResult<BuildRoadmapResponse>> {
  if (USE_MOCKS) {
    const out = buildPlannedRoadmap({
      stage: req.stage,
      hoursPerWeek: req.hoursPerWeek,
      knownSkillIds: req.knownSkillIds,
    });
    try {
      window.sessionStorage.setItem(INTAKE_KEY, JSON.stringify(out.roadmap));
    } catch {
      // storage can be blocked; the roadmap page falls back to the demo student
    }
    return mock(out);
  }
  return call("/api/intake/build-roadmap", BuildRoadmapResponseSchema, post(req));
}

// Always hits the real route (auth is real even in mock mode), so profile_complete gets saved.
const CompleteIntakeSchema = z.object({ done: z.boolean() });
export async function completeIntake(
  req: BuildRoadmapRequest
): Promise<ApiResult<{ done: boolean }>> {
  return call("/api/intake/complete", CompleteIntakeSchema, post(req));
}

// ---- Project submit and polling ----
const pollCounts = new Map<string, number>();

export async function submitProject(
  nodeId: string,
  githubUrl: string,
  projectId: string
): Promise<ApiResult<{ evidenceId: string }>> {
  if (USE_MOCKS) {
    const evidenceId = `ev-${Date.now()}`;
    pollCounts.set(evidenceId, 0);
    return mock({ evidenceId });
  }
  return call(`/api/node/${nodeId}/project`, SubmitProjectResponseSchema, post({ githubUrl, projectId }));
}

export async function pollEvidence(nodeId: string, evidenceId: string): Promise<ApiResult<EvidencePoll>> {
  if (USE_MOCKS) {
    const attempt = pollCounts.get(evidenceId) ?? 0;
    pollCounts.set(evidenceId, attempt + 1);
    return mock(mockPollEvidence(evidenceId, attempt));
  }
  return call(`/api/node/${nodeId}/evidence/${evidenceId}`, EvidencePollSchema);
}

// ---- Credential verify (public) ----
export async function getVerify(id: string, opts?: { tampered?: boolean }): Promise<ApiResult<VerifyResponse>> {
  if (USE_MOCKS) return mock(opts?.tampered ? mockVerifyTampered : mockVerify);
  return call(`/api/verify/${encodeURIComponent(id)}`, VerifyResponseSchema);
}

// ---- Opportunities ----
export async function getOpportunities(): Promise<ApiResult<OpportunityList>> {
  if (USE_MOCKS) {
    return mock({ items: mockOpportunities, featured: mockOpportunities[0] });
  }
  return call("/api/opportunities", OpportunityListSchema);
}

export async function getOpportunity(id: string): Promise<ApiResult<Opportunity>> {
  if (USE_MOCKS) {
    const o = mockOpportunities.find((x) => x.id === id);
    return o ? mock(o) : notFound();
  }
  return call(`/api/opportunities/${encodeURIComponent(id)}`, OpportunitySchema);
}

// ---- Landing try-it demo (non-streaming placeholder; streaming comes in Step 11) ----
export async function runDemo(req: DemoRequest): Promise<ApiResult<DemoResult>> {
  if (USE_MOCKS) return mock(req.mode === "course" ? mockDemoCourse : mockDemoGraduate);
  return call("/api/demo", DemoResultSchema, post(req));
}