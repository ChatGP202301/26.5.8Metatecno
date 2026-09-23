#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const EVIDENCE_COLUMNS = [
  "path",
  "locale",
  "organic_clicks",
  "qualified_leads",
  "meaningful_backlinks",
  "native_review_passed",
  "evidence_window_start",
  "evidence_window_end",
  "reviewed_at",
  "reviewed_by_role",
  "notes"
];

function parseCsvRows(source) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else value += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else value += character;
  }
  if (quoted) throw new Error("Evidence CSV contains an unterminated quoted field.");
  row.push(value.replace(/\r$/, ""));
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

export function parseEvidenceCsv(source) {
  const rows = parseCsvRows(source);
  if (!rows.length) throw new Error("Evidence CSV is empty.");
  const headers = rows[0].map((item) => item.trim());
  if (headers.length !== EVIDENCE_COLUMNS.length || headers.some((header, index) => header !== EVIDENCE_COLUMNS[index])) {
    throw new Error(`Evidence CSV headers must be exactly: ${EVIDENCE_COLUMNS.join(",")}`);
  }
  return rows.slice(1).map((cells, rowIndex) => {
    if (cells.length !== headers.length) throw new Error(`Evidence CSV row ${rowIndex + 2} has ${cells.length} columns; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index].trim()]));
  });
}

function integer(value, field, path) {
  if (!/^(?:0|[1-9][0-9]*)$/.test(value)) throw new Error(`${path}: ${field} must be a non-negative integer.`);
  return Number(value);
}

function boolean(value, field, path) {
  if (!/^(?:true|false)$/i.test(value)) throw new Error(`${path}: ${field} must be true or false.`);
  return value.toLowerCase() === "true";
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

export function baselineFailures(baseline) {
  const failures = [];
  if (baseline?.status !== "complete") failures.push("The 16-month evidence baseline is not marked complete.");
  if (!Number.isFinite(baseline?.windowMonths) || baseline.windowMonths < 16) failures.push("The evidence window must cover at least 16 months.");
  if (!validDate(baseline?.windowStart || "") || !validDate(baseline?.windowEnd || "")) failures.push("The evidence window start and end dates are missing or invalid.");
  for (const [name, complete] of Object.entries(baseline?.exports || {})) {
    if (complete !== true) failures.push(`Required baseline export is incomplete: ${name}.`);
  }
  if (baseline?.containsLeadPii !== false) failures.push("The repository evidence set must explicitly exclude lead PII.");
  if (!validDate(baseline?.approvedAt || "") || !baseline?.approvedByRole) failures.push("The baseline requires a dated role-based approval.");
  return failures;
}

function normalizeRow(row, manifestPage) {
  const path = row.path;
  if (!/^\/(?:[^?#]*\/)?$/.test(path) || path.includes("/index.html")) throw new Error(`${path || "row"}: path must be a canonical directory URL without query, fragment or index.html.`);
  if (!manifestPage) throw new Error(`${path}: path is not present in site-manifest.json.`);
  if (row.locale !== manifestPage.locale) throw new Error(`${path}: locale ${row.locale} does not match manifest locale ${manifestPage.locale}.`);
  for (const field of ["evidence_window_start", "evidence_window_end", "reviewed_at"]) {
    if (!validDate(row[field])) throw new Error(`${path}: ${field} must use YYYY-MM-DD.`);
  }
  if (!row.reviewed_by_role) throw new Error(`${path}: reviewed_by_role is required.`);
  const freeText = `${row.reviewed_by_role} ${row.notes}`;
  if (/@/.test(freeText) || /\b(?:\+?\d[\s().-]*){7,}\b/.test(freeText)) {
    throw new Error(`${path}: evidence notes may not contain email addresses or phone numbers.`);
  }
  return {
    path,
    locale: row.locale,
    signals: {
      organicClicks: integer(row.organic_clicks, "organic_clicks", path),
      qualifiedLeads: integer(row.qualified_leads, "qualified_leads", path),
      meaningfulBacklinks: integer(row.meaningful_backlinks, "meaningful_backlinks", path),
      nativeReviewPassed: boolean(row.native_review_passed, "native_review_passed", path)
    },
    evidenceWindowStart: row.evidence_window_start,
    evidenceWindowEnd: row.evidence_window_end,
    reviewedAt: row.reviewed_at,
    reviewedByRole: row.reviewed_by_role,
    notes: row.notes
  };
}

export function evaluateIndexingEvidence({ manifest, policy, baseline, csvText, generatedAt = new Date().toISOString() }) {
  const gateFailures = baselineFailures(baseline);
  if (gateFailures.length) {
    return {
      version: 1,
      status: "blocked-awaiting-evidence",
      generatedAt: null,
      baselineStatus: baseline?.status || "missing",
      failures: gateFailures,
      decisions: [],
      summary: { preserve: 0, noindexFollow: 0, hold: 0 }
    };
  }

  const primary = new Set(policy.primaryLocales || []);
  const frozenIndexable = new Set(policy.frozenIndexableLocales || []);
  const manifestByPath = new Map(manifest.pages.map((page) => [page.path, page]));
  const rows = parseEvidenceCsv(csvText);
  const evidenceByPath = new Map();
  for (const row of rows) {
    if (evidenceByPath.has(row.path)) throw new Error(`${row.path}: duplicate evidence row.`);
    const page = manifestByPath.get(row.path);
    if (page && (primary.has(page.locale) || frozenIndexable.has(page.locale))) {
      throw new Error(`${row.path}: indexing evidence rows are only for non-priority locales.`);
    }
    const evidence = normalizeRow(row, page);
    if (evidence.evidenceWindowStart > baseline.windowStart || evidence.evidenceWindowEnd < baseline.windowEnd) {
      throw new Error(`${row.path}: page evidence does not cover the approved baseline window.`);
    }
    if (evidence.reviewedAt < evidence.evidenceWindowEnd) throw new Error(`${row.path}: reviewed_at cannot predate the evidence window end.`);
    evidenceByPath.set(row.path, evidence);
  }

  const candidates = manifest.pages.filter((page) => (page.indexable || page.indexingDecision) && !primary.has(page.locale) && !frozenIndexable.has(page.locale));
  const decisions = candidates.map((page) => {
    const evidence = evidenceByPath.get(page.path);
    if (!evidence) return { path: page.path, locale: page.locale, action: "hold", signals: null, reason: "missing-page-evidence" };
    const preserve = evidence.signals.organicClicks > 0
      || evidence.signals.qualifiedLeads > 0
      || evidence.signals.meaningfulBacklinks > 0
      || evidence.signals.nativeReviewPassed;
    return {
      path: page.path,
      locale: page.locale,
      action: preserve ? "preserve" : "noindex_follow",
      signals: evidence.signals,
      reviewedAt: evidence.reviewedAt,
      reviewedByRole: evidence.reviewedByRole,
      reason: preserve ? "preservation-signal-present" : "reviewed-without-preservation-signal"
    };
  });
  const summary = {
    preserve: decisions.filter((item) => item.action === "preserve").length,
    noindexFollow: decisions.filter((item) => item.action === "noindex_follow").length,
    hold: decisions.filter((item) => item.action === "hold").length
  };
  return { version: 1, status: "ready", generatedAt, baselineStatus: baseline.status, decisions, summary };
}

async function main() {
  const root = process.cwd();
  const write = process.argv.includes("--write");
  const [manifest, policy, baseline, csvText] = await Promise.all([
    readFile(resolve(root, "site-manifest.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "site-policy.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "seo/evidence/baseline-status.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "seo/evidence/indexing-evidence.csv"), "utf8")
  ]);
  const result = evaluateIndexingEvidence({ manifest, policy, baseline, csvText });
  if (write) await writeFile(resolve(root, "seo/indexing-decisions.generated.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(`indexing_evidence_status=${result.status} preserve=${result.summary.preserve} noindex_follow=${result.summary.noindexFollow} hold=${result.summary.hold}`);
  if (result.status !== "ready") {
    for (const failure of result.failures || []) console.error(failure);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
