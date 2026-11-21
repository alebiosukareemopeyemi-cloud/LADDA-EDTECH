import { test, before } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { buildCredentialPayload, summarize, type VerifiedSkill } from "../lib/credential/build.ts";
import { isCredentialIdShape, newCredentialId } from "../lib/credential/id.ts";
import { publicKeyBase64, signPayload, verifyPayload } from "../lib/credential/sign.ts";
import { base64ToBytes, canonicalize } from "../lib/credential/encoding.ts";
import { applyVerified, isTrackComplete, newlyUnlocked } from "../lib/roadmap/progress.ts";
import type { Roadmap, RoadmapNode } from "../lib/contract/index.ts";

// A throwaway key for the tests. Never the real one.
before(() => {
  process.env.CREDENTIAL_PRIVATE_KEY = randomBytes(32).toString("hex");
});

const skills: VerifiedSkill[] = [
  { skillId: "git-github", skillName: "Git and GitHub", taskTitle: "Practice repo", hours: 4, repoUrl: "https://github.com/amina/git-practice", commitHash: "abc1234", criteria: ["Clear commits", "A pull request"] },
  { skillId: "node-express", skillName: "Node.js and Express", taskTitle: "Notes API", hours: 10, repoUrl: "https://github.com/amina/notes-api", commitHash: "def5678", criteria: ["All routes work"] },
];
const holder = { name: "Amina Bello", university: "University of Lagos", department: "Computer Science" };

const make = (id = "abcd2345") =>
  buildCredentialPayload({ id, holder, track: "Backend Engineer", skills, issuedAt: "2026-11-20T10:00:00.000Z" });

test("credential ids are 8 url-safe characters without look-alikes", () => {
  for (let i = 0; i < 200; i++) {
    const id = newCredentialId();
    assert.match(id, /^[a-z2-9]{8}$/);
    assert.doesNotMatch(id, /[01oil]/);
    assert.ok(isCredentialIdShape(id));
  }
  assert.equal(isCredentialIdShape("../etc/passwd"), false);
  assert.equal(isCredentialIdShape(""), false);
});

test("the payload sums hours and counts projects", () => {
  const p = make();
  assert.equal(p.verifiedHours, 14);
  assert.equal(p.skills.length, 2);
  assert.equal(p.candidateName, "Amina Bello");
  assert.deepEqual(p.skills[0].scores, { "Clear commits": 100, "A pull request": 100 });
  assert.match(summarize(p), /2 skills verified/);
});

test("sign then verify round trip is valid", async () => {
  const p = make();
  const { signature, publicKey } = await signPayload(p);
  assert.equal(publicKey, await publicKeyBase64());
  assert.equal(base64ToBytes(signature).length, 64);
  assert.equal(await verifyPayload(p, signature, publicKey), true);
});

test("key order in the payload does not matter, because it is canonical", async () => {
  const p = make();
  const { signature, publicKey } = await signPayload(p);
  const shuffled = JSON.parse(JSON.stringify(p));
  const reordered = Object.fromEntries(Object.entries(shuffled).reverse());
  assert.equal(canonicalize(reordered), canonicalize(p));
  assert.equal(await verifyPayload(reordered, signature, publicKey), true);
});

test("changing any signed field makes the check fail", async () => {
  const p = make();
  const { signature, publicKey } = await signPayload(p);
  assert.equal(await verifyPayload({ ...p, verifiedHours: 140 }, signature, publicKey), false, "hours 14 to 140");
  assert.equal(await verifyPayload({ ...p, candidateName: "Someone Else" }, signature, publicKey), false, "name");
  assert.equal(await verifyPayload({ ...p, id: "zzzz9999" }, signature, publicKey), false, "id");
  const lowered = { ...p, skills: p.skills.map((s, i) => (i === 0 ? { ...s, commitHash: "0000000" } : s)) };
  assert.equal(await verifyPayload(lowered, signature, publicKey), false, "commit hash");
});

test("a signature from a different key does not verify", async () => {
  const p = make();
  const { signature } = await signPayload(p);
  process.env.CREDENTIAL_PRIVATE_KEY = randomBytes(32).toString("hex");
  const otherPublic = await publicKeyBase64();
  assert.equal(await verifyPayload(p, signature, otherPublic), false);
});

test("garbage signatures and keys fail closed instead of throwing", async () => {
  const p = make();
  assert.equal(await verifyPayload(p, "not base64!!", "also not"), false);
  assert.equal(await verifyPayload(p, "AAAA", "AAAA"), false);
});

const node = (id: string, over: Partial<RoadmapNode> = {}): RoadmapNode => ({
  id, title: id, blurb: "", phase: "core", status: "todo", source: null, locked: false, blockedBy: [], prereqs: [],
  nextStep: "learn", hours: 5, isStretch: false, ...over,
});
const road = (nodes: RoadmapNode[]): Roadmap => ({
  roleId: "backend", roleTitle: "Backend Engineer", stage: "studying", nodes,
  progress: { verified: 0, known: 0, total: nodes.length }, weeksLeft: 1, hoursPerWeek: 10,
});

test("progress: a verified skill unlocks what depended on it", () => {
  const before = road([
    node("a", { status: "in_progress", nextStep: "build" }),
    node("b", { prereqs: ["a"], blockedBy: ["a"], locked: true }),
    node("opt", { isStretch: true }),
  ]);
  const after = applyVerified(before, ["a"]);
  assert.equal(after.nodes[0].status, "verified");
  assert.equal(after.nodes[0].nextStep, "done");
  assert.equal(after.nodes[1].locked, false);
  assert.deepEqual(newlyUnlocked(before, after).map((n) => n.id), ["b"]);
  assert.equal(after.progress.verified, 1);
  assert.equal(before.nodes[0].status, "in_progress", "the original is not changed");
});

test("progress: the track is complete when every required skill is verified, stretch is optional", () => {
  const base = road([node("a"), node("b", { prereqs: ["a"], locked: true, blockedBy: ["a"] }), node("opt", { isStretch: true })]);
  assert.equal(isTrackComplete(base), false);
  assert.equal(isTrackComplete(applyVerified(base, ["a"])), false);
  assert.equal(isTrackComplete(applyVerified(base, ["a", "b"])), true);
  assert.equal(isTrackComplete(road([])), false, "an empty path is not complete");
});
