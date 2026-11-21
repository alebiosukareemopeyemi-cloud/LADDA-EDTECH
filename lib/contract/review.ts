import { z } from "zod";

// POST /api/review { nodeId, repoUrl }
export const ReviewRequestSchema = z.object({
  nodeId: z.string().min(1),
  repoUrl: z.string().min(1).max(300),
});

export const CheckResultSchema = z.object({
  criterion: z.string(),
  pass: z.boolean(),
  evidence: z.string(),
  fix: z.string(),
});

const Reviewed = z.object({
  status: z.literal("reviewed"),
  source: z.enum(["gemini", "heuristic"]),
  approved: z.boolean(),
  checks: z.array(CheckResultSchema),
  repo: z.object({
    owner: z.string(),
    repo: z.string(),
    url: z.string(),
    defaultBranch: z.string(),
    commit: z.string().nullable(),
    latestCommitAt: z.string().nullable(),
  }),
  persisted: z.boolean(), // true when the server saved the node as verified
  remaining: z.number(), // reviews left this hour
});

// GitHub could not be read. There is no verdict, and nothing is saved.
const Unavailable = z.object({
  status: z.literal("unavailable"),
  reason: z.enum(["github_rate_limited", "github_unreachable"]),
  message: z.string(),
});

export const ReviewResponseSchema = z.discriminatedUnion("status", [Reviewed, Unavailable]);
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;
export type ReviewedResponse = z.infer<typeof Reviewed>;
export type CheckResultDto = z.infer<typeof CheckResultSchema>;
