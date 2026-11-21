import type { CredentialPayload, CredentialSkill } from "../contract/credential.ts";

// One verified skill, resolved from the catalog and the stored review.
export type VerifiedSkill = {
  skillId: string;
  skillName: string;
  taskTitle: string;
  hours: number;
  repoUrl: string;
  commitHash: string;
  criteria: string[];
};

export type Holder = { name: string; university: string; department: string };

// Build exactly what gets signed. Hours are the sum over verified skills. Every criterion
// on an approved review passed, so each scores 100. Nothing here touches the clock or the
// network: the caller passes issuedAt, which keeps this testable.
export function buildCredentialPayload(opts: {
  id: string;
  holder: Holder;
  track: string;
  skills: VerifiedSkill[];
  issuedAt: string;
}): CredentialPayload {
  const skills: CredentialSkill[] = opts.skills.map((s) => ({
    skillId: s.skillId,
    skillName: s.skillName,
    taskTitle: s.taskTitle,
    repoUrl: s.repoUrl,
    commitHash: s.commitHash,
    overall: 100,
    scores: Object.fromEntries(s.criteria.map((c) => [c, 100])),
    certificate: null,
  }));
  return {
    id: opts.id,
    candidateName: opts.holder.name,
    university: opts.holder.university,
    department: opts.holder.department,
    roleTitle: opts.track,
    skills,
    issuedAt: opts.issuedAt,
    verifiedHours: opts.skills.reduce((t, s) => t + s.hours, 0),
  };
}

export function summarize(p: CredentialPayload): string {
  return `${p.candidateName} has ${p.skills.length} skills verified by approved projects, ${p.verifiedHours ?? 0} verified hours in total. Each project was reviewed against its checks, and the repo and commit behind every skill are listed below.`;
}
