#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readinessFailures } from "./check-release-readiness.mjs";
import { MT27_INDEX_SCOPE } from "./mt27-scoped-release.mjs";

const approved = {
  legalReviewApproved: true,
  nativeLanguageReview: { "es-419": true, "pt-BR": true, fr: true, ru: true },
  arabicIndexingApproved: false,
  gscMigrationBaselineApproved: true,
  indexingDecisionSetApproved: true
};
const completePolicy = { gscGate: { status: "complete" } };
const completeBaseline = {
  status: "complete",
  windowMonths: 16,
  windowStart: "2025-04-01",
  windowEnd: "2026-07-31",
  exports: { searchPerformance: true, pageIndexing: true, sitemaps: true, externalLinks: true, qualifiedLeadBaseline: true },
  containsLeadPii: false,
  approvedAt: "2026-08-27",
  approvedByRole: "seo-owner"
};
const readyDecisions = { status: "ready" };
const validWorker = {
  triggers: { crons: ["17 2 * * *"] },
  d1_databases: [{ binding: "LEADS_DB", database_id: "123e4567-e89b-42d3-a456-426614174000" }],
  send_email: [{ name: "LEAD_EMAIL", destination_address: "fixed@example.com", allowed_sender_addresses: ["website@example.com"] }]
};

assert.deepEqual(readinessFailures({
  target: "site",
  env: { TURNSTILE_SITE_KEY: "0x4AAAAAAAAabcdefghijklmnop", GA4_MEASUREMENT_ID: "G-ABCDEF1234" },
  approvals: approved,
  wrangler: {},
  policy: completePolicy,
  baseline: completeBaseline,
  indexingDecisions: readyDecisions
}), []);

let failures = readinessFailures({
  target: "site",
  env: { TURNSTILE_SITE_KEY: "1x00000000000000000000AA", GA4_MEASUREMENT_ID: "G-REPLACE01" },
  approvals: { ...approved, legalReviewApproved: false },
  wrangler: {},
  policy: { gscGate: { status: "awaiting-16-month-export" } },
  baseline: { ...completeBaseline, status: "awaiting-16-month-export" },
  indexingDecisions: { status: "blocked-awaiting-evidence" }
});
assert.ok(failures.some((message) => message.includes("Legal review")));
assert.ok(failures.some((message) => message.includes("TURNSTILE")));
assert.ok(failures.some((message) => message.includes("GA4")));
assert.ok(failures.some((message) => message.includes("GSC") || message.includes("evidence baseline")));
assert.ok(failures.some((message) => message.includes("indexing decision")));

const scopedPolicy = JSON.parse(await readFile(new URL("../site-policy.json", import.meta.url), "utf8"));
const scopedReview = JSON.parse(await readFile(new URL("../seo/mt27-release-review.json", import.meta.url), "utf8"));
const visuallyPassedReview = {
  ...scopedReview,
  arabicRtlVisualReview: { status: "passed", evidence: "fixture-only: automated desktop/narrow-screen test" }
};
const incompleteBaseline = JSON.parse(await readFile(new URL("../seo/evidence/baseline-status.json", import.meta.url), "utf8"));
const blockedDecisions = JSON.parse(await readFile(new URL("../seo/indexing-decisions.generated.json", import.meta.url), "utf8"));
failures = readinessFailures({
  target: "site",
  scope: "mt27-indexing",
  env: { TURNSTILE_SITE_KEY: "0x4AAAAAAAAabcdefghijklmnop", GA4_MEASUREMENT_ID: "G-ABCDEF1234" },
  approvals: { legalReviewApproved: false, nativeLanguageReview: { "es-419": false, "pt-BR": false, fr: false, ru: false } },
  wrangler: {},
  policy: scopedPolicy,
  baseline: incompleteBaseline,
  indexingDecisions: blockedDecisions,
  mt27Review: visuallyPassedReview
});
assert.deepEqual(failures, [], "the exact owner-authorized 12-URL AI-review exception must not require fictitious human approvals");
assert.equal(scopedPolicy.gscGate.status, "awaiting-16-month-export", "the original 16-month baseline must remain incomplete");
assert.equal(MT27_INDEX_SCOPE.length, 12, "the exception must remain exactly 12 URLs");

assert.deepEqual(readinessFailures({
  target: "worker",
  env: { CLOUDFLARE_API_TOKEN: "test-token-with-sufficient-length", CLOUDFLARE_ACCOUNT_ID: "0123456789abcdef0123456789abcdef" },
  approvals: approved,
  wrangler: validWorker
}), []);

failures = readinessFailures({
  target: "worker",
  env: {},
  approvals: approved,
  wrangler: {
    ...validWorker,
    triggers: { crons: [] },
    d1_databases: [{ binding: "LEADS_DB", database_id: "00000000-0000-0000-0000-000000000000" }]
  }
});
assert.ok(failures.some((message) => message.includes("database_id")));
assert.ok(failures.some((message) => message.includes("API_TOKEN")));
assert.ok(failures.some((message) => message.includes("ACCOUNT_ID")));
assert.ok(failures.some((message) => message.includes("Cron Trigger")));

console.log("release_readiness_tests_passed scenarios=5");
