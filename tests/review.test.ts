import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJson, parseReviewJson, unknownFileMentions } from "../lib/review/parse.ts";
import { heuristicReview } from "../lib/review/heuristic.ts";
import { parseRepoUrl } from "../lib/review/github.ts";
import { reviewWithGemini } from "../lib/review/gemini.ts";
import { runReview, InvalidRepoUrlError } from "../lib/review/run.ts";
import { resetReviewLimits, takeReviewSlot, REVIEW_LIMIT } from "../lib/review/rate-limit.ts";
import { CRITERIA, emptyFacts, goodFacts, goodModelJson } from "./fixtures.ts";

test("parseRepoUrl accepts public github.com links only", () => {
  assert.deepEqual(parseRepoUrl("https://github.com/amina/notes-api"), { owner: "amina", repo: "notes-api" });
  assert.deepEqual(parseRepoUrl("https://github.com/amina/notes-api.git"), { owner: "amina", repo: "notes-api" });
  assert.deepEqual(parseRepoUrl("https://www.github.com/amina/notes-api/tree/main"), { owner: "amina", repo: "notes-api" });
  for (const bad of ["", "not a url", "http://github.com/a/b", "https://gitlab.com/a/b", "https://github.com/amina", "https://github.com.evil.com/a/b", "https://github.com/-bad/repo", "javascript:alert(1)"]) {
    assert.equal(parseRepoUrl(bad), null, bad);
  }
});

test("extractJson reads a fenced array", () => {
  assert.deepEqual(extractJson('Here you go:\n```json\n[{"a":1}]\n```'), [{ a: 1 }]);
  assert.equal(extractJson("no json here"), null);
  assert.equal(extractJson("[not json]"), null);
});

test("parseReviewJson accepts a valid answer, in criteria order", () => {
  const out = parseReviewJson(goodModelJson, CRITERIA, goodFacts);
  assert.ok(out);
  assert.deepEqual(out.map((c) => c.criterion), CRITERIA);
  assert.deepEqual(out.map((c) => c.pass), [true, false, true]);
  assert.equal(out[0].fix, "");
});

test("parseReviewJson rejects wrong counts, missing criteria and empty fixes", () => {
  const items = JSON.parse(goodModelJson);
  assert.equal(parseReviewJson(JSON.stringify(items.slice(0, 2)), CRITERIA), null);
  assert.equal(parseReviewJson(JSON.stringify([{ ...items[0], criterion: "Something else" }, items[1], items[2]]), CRITERIA), null);
  assert.equal(parseReviewJson(JSON.stringify([items[0], { ...items[1], fix: "  " }, items[2]]), CRITERIA), null);
  assert.equal(parseReviewJson(JSON.stringify([{ ...items[0], pass: "yes" }, items[1], items[2]]), CRITERIA), null);
  assert.equal(parseReviewJson("totally not json", CRITERIA), null);
});

test("parseReviewJson rejects evidence that names files not in the repo", () => {
  const items = JSON.parse(goodModelJson);
  items[0].evidence = "server/app.js sets up the routes.";
  assert.equal(parseReviewJson(JSON.stringify(items), CRITERIA, goodFacts), null);
  assert.deepEqual(unknownFileMentions("See server/app.js and src/index.js", goodFacts), ["server/app.js"]);
  // A dotted file name is one file, not "test.js".
  assert.deepEqual(unknownFileMentions("tests/notes.test.js covers the routes", goodFacts), []);
  // Product names that look like files are not files.
  assert.deepEqual(unknownFileMentions("Built with Node.js and Express.js", goodFacts), []);
});

test("heuristicReview is deterministic and reads the facts", () => {
  const a = heuristicReview(CRITERIA, goodFacts);
  const b = heuristicReview(CRITERIA, goodFacts);
  assert.deepEqual(a, b);
  assert.equal(a.length, CRITERIA.length);
  assert.ok(a.every((c) => c.pass), "a healthy repo passes all three");
  assert.ok(a.every((c) => c.fix === ""));

  const empty = heuristicReview(CRITERIA, emptyFacts);
  assert.ok(empty.every((c) => !c.pass && c.fix.length > 0), "an empty repo fails with a fix for each");
});

test("heuristicReview names a real fix when one thing is missing", () => {
  const noReadme = { ...goodFacts, readme: null, tree: goodFacts.tree.filter((p) => p !== "README.md") };
  const out = heuristicReview(["Clear README with example requests"], noReadme);
  assert.equal(out[0].pass, false);
  assert.match(out[0].fix, /README/);
});

test("reviewWithGemini retries once, then succeeds", async () => {
  const answers = ["nonsense", goodModelJson];
  let calls = 0;
  const out = await reviewWithGemini(CRITERIA, goodFacts, async () => answers[calls++]);
  assert.equal(calls, 2);
  assert.equal(out.length, 3);
});

test("reviewWithGemini throws after two invalid answers", async () => {
  let calls = 0;
  await assert.rejects(reviewWithGemini(CRITERIA, goodFacts, async () => (calls++, "nope")));
  assert.equal(calls, 2);
});

test("runReview reports source gemini when the model answers", async () => {
  const out = await runReview("https://github.com/amina/notes-api", CRITERIA, {
    fetchFacts: async () => goodFacts,
    generate: async () => goodModelJson,
  });
  assert.equal(out.status, "reviewed");
  if (out.status === "reviewed") {
    assert.equal(out.source, "gemini");
    assert.equal(out.approved, false); // one check fails in goodModelJson
    assert.equal(out.repo.commit, "abc1234");
  }
});

test("runReview falls back to the heuristic when the model throws or times out", async () => {
  for (const generate of [async () => { throw new Error("boom"); }, async () => "garbage"]) {
    const out = await runReview("https://github.com/amina/notes-api", CRITERIA, { fetchFacts: async () => goodFacts, generate });
    assert.equal(out.status, "reviewed");
    if (out.status === "reviewed") {
      assert.equal(out.source, "heuristic");
      assert.equal(out.approved, true);
    }
  }
});

test("runReview reports unavailable, never throws, when GitHub fails", async () => {
  const { UpstreamError } = await import("../lib/review/github.ts");
  const out = await runReview("https://github.com/amina/notes-api", CRITERIA, {
    fetchFacts: async () => { throw new UpstreamError("rate_limited"); },
  });
  assert.equal(out.status, "unavailable");
  if (out.status === "unavailable") assert.equal(out.reason, "github_rate_limited");
});

test("runReview rejects a bad link", async () => {
  await assert.rejects(runReview("https://example.com/a/b", CRITERIA), InvalidRepoUrlError);
});

test("rate limit allows five reviews an hour per user", () => {
  resetReviewLimits();
  const t0 = 1_000_000;
  for (let i = 0; i < REVIEW_LIMIT; i++) assert.equal(takeReviewSlot("u1", t0 + i).allowed, true);
  const blocked = takeReviewSlot("u1", t0 + 10);
  assert.equal(blocked.allowed, false);
  assert.equal(takeReviewSlot("u2", t0).allowed, true, "another user is not affected");
  assert.equal(takeReviewSlot("u1", t0 + 60 * 60 * 1000 + 1).allowed, true, "the window slides");
});
