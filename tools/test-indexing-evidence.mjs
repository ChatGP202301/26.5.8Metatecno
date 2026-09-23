#!/usr/bin/env node
import assert from "node:assert/strict";
import { baselineFailures, evaluateIndexingEvidence, parseEvidenceCsv } from "./evaluate-indexing-evidence.mjs";

const header = "path,locale,organic_clicks,qualified_leads,meaningful_backlinks,native_review_passed,evidence_window_start,evidence_window_end,reviewed_at,reviewed_by_role,notes\n";
const manifest = {
  pages: [
    { path: "/fr/example/", locale: "fr", indexable: true },
    { path: "/it/example/", locale: "it", indexable: true },
    { path: "/ja/with-clicks/", locale: "ja", indexable: true },
    { path: "/ja/without-signals/", locale: "ja", indexable: true },
    { path: "/ja/missing/", locale: "ja", indexable: true },
    { path: "/ja/previously-noindexed/", locale: "ja", indexable: false, indexingDecision: "noindex_follow" }
  ]
};
const policy = { primaryLocales: ["en", "es-419", "pt-BR", "fr", "ru", "ar"], frozenIndexableLocales: ["it"] };
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

assert.ok(baselineFailures({ ...completeBaseline, status: "awaiting-16-month-export" }).length > 0);
assert.equal(parseEvidenceCsv(header).length, 0);

const csvText = `${header}/ja/with-clicks/,ja,3,0,0,false,2025-04-01,2026-07-31,2026-08-27,seo-owner,aggregate only\n/ja/without-signals/,ja,0,0,0,false,2025-04-01,2026-07-31,2026-08-27,seo-owner,review complete\n/ja/previously-noindexed/,ja,0,0,0,false,2025-04-01,2026-07-31,2026-08-27,seo-owner,retain decision coverage\n`;
const result = evaluateIndexingEvidence({ manifest, policy, baseline: completeBaseline, csvText, generatedAt: "2026-08-27T00:00:00.000Z" });
assert.equal(result.status, "ready");
assert.equal(result.summary.preserve, 1);
assert.equal(result.summary.noindexFollow, 2);
assert.equal(result.summary.hold, 1);
assert.equal(result.decisions.find((item) => item.path === "/ja/with-clicks/").action, "preserve");
assert.equal(result.decisions.find((item) => item.path === "/ja/without-signals/").action, "noindex_follow");
assert.equal(result.decisions.find((item) => item.path === "/ja/missing/").action, "hold");

const blocked = evaluateIndexingEvidence({ manifest, policy, baseline: { ...completeBaseline, status: "awaiting-16-month-export" }, csvText });
assert.equal(blocked.status, "blocked-awaiting-evidence");
assert.deepEqual(blocked.decisions, []);

assert.throws(() => evaluateIndexingEvidence({ manifest, policy, baseline: completeBaseline, csvText: `${header}/ja/with-clicks/,ja,0,0,0,false,2025-04-01,2026-07-31,2026-08-27,seo-owner,user@example.com\n` }), /email addresses/);
assert.throws(() => evaluateIndexingEvidence({ manifest, policy, baseline: completeBaseline, csvText: `${csvText}/ja/with-clicks/,ja,0,0,0,false,2025-04-01,2026-07-31,2026-08-27,seo-owner,duplicate\n` }), /duplicate evidence row/);

console.log("indexing_evidence_tests_passed scenarios=7");
