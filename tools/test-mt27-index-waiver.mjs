#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readinessFailures } from "./check-release-readiness.mjs";

const scope = [
  "/en/products/mt-2-7-ion-membrane-electrolyzer/", "/en/services/electrolyzer-cell-repair/",
  "/es/products/mt-2-7-ion-membrane-electrolyzer/", "/es/services/electrolyzer-cell-repair/",
  "/pt/products/mt-2-7-ion-membrane-electrolyzer/", "/pt/services/electrolyzer-cell-repair/",
  "/fr/products/mt-2-7-ion-membrane-electrolyzer/", "/fr/services/electrolyzer-cell-repair/",
  "/ru/products/mt-2-7-ion-membrane-electrolyzer/", "/ru/services/electrolyzer-cell-repair/",
  "/ar/products/mt-2-7-ion-membrane-electrolyzer/", "/ar/services/electrolyzer-cell-repair/"
];
const actualPolicy = JSON.parse(await readFile(new URL("../site-policy.json", import.meta.url), "utf8"));
const policy = {
  ...actualPolicy,
  gscGate: {
    status: "awaiting-16-month-export",
    scopedWaivers: [{
      id: "mt27-product-and-repair-indexing-2026-09-24",
      authorizedByRole: "site-owner",
      authorizedAt: "2026-09-24",
      baselineWaived: true,
      baselineStatusRemains: "awaiting-16-month-export",
      scope
    }]
  },
  scopedPublication: actualPolicy.scopedPublication
};
const mt27Review = JSON.parse(await readFile(new URL("../seo/mt27-release-review.json", import.meta.url), "utf8"));
const incompleteBaseline = {
  status: "awaiting-16-month-export",
  windowMonths: 16,
  windowStart: null,
  windowEnd: null,
  exports: { searchPerformance: false, pageIndexing: false, sitemaps: false, externalLinks: false, qualifiedLeadBaseline: false },
  containsLeadPii: false
};
const input = {
  target: "site",
  scope: "mt27-indexing",
  env: { TURNSTILE_SITE_KEY: "0x4AAAAAAAAabcdefghijklmnop", GA4_MEASUREMENT_ID: "G-ABCDEF1234" },
  approvals: { legalReviewApproved: false, nativeLanguageReview: { "es-419": false, "pt-BR": false, fr: false, ru: false }, gscMigrationBaselineApproved: false, indexingDecisionSetApproved: false },
  wrangler: {},
  policy,
  baseline: incompleteBaseline,
  indexingDecisions: { status: "blocked-awaiting-evidence" },
  mt27Review
};

let failures = readinessFailures(input);
assert.equal(failures.some((message) => /16-month|baseline/i.test(message)), false, "the exact scoped waiver must suppress baseline blockers only for this batch");
assert.ok(failures.some((message) => message.includes("Legal review")), "legal review remains a blocker");
assert.equal(failures.some((message) => message.includes("locale indexing decision set approval")), false, "the explicit exact-scope publication record covers only this batch's blocked decision set");
assert.equal(failures.filter((message) => message.includes("Native-language approval")).length, 4, "AI review does not clear the four human-native review requirements");
assert.equal(failures.filter((message) => message.includes("not eligible for publication")).length, 2, "Arabic remains held until RTL visual review");

const invalid = structuredClone(input);
invalid.policy.gscGate.scopedWaivers[0].scope.pop();
failures = readinessFailures(invalid);
assert.ok(failures.some((message) => message.includes("exact 12-URL MT-2.7 baseline waiver")), "a narrowed/mismatched scope must fail closed");
assert.ok(failures.some((message) => message.includes("16-month GSC migration baseline")), "a mismatched waiver must not suppress baseline checks");

const defaultScope = readinessFailures({ ...input, scope: "" });
assert.ok(defaultScope.some((message) => message.includes("16-month GSC migration baseline")), "default releases retain the original baseline gate");
assert.ok(defaultScope.some((message) => message.includes("locale indexing decision set approval")), "default releases retain the original indexing-decision gate");
console.log("mt27_scoped_baseline_waiver_tests_passed scenarios=3");
