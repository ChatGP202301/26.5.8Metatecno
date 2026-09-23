#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { baselineFailures } from "./evaluate-indexing-evidence.mjs";

const TEST_TURNSTILE_KEYS = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "3x00000000000000000000FF"
]);
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

function valuePresent(value) {
  return typeof value === "string" && value.trim().length > 0 && !/replace|placeholder|example/i.test(value);
}

function approvalFailures(approvals) {
  const failures = [];
  if (approvals?.legalReviewApproved !== true) failures.push("Legal review approval is missing.");
  for (const [locale, approved] of Object.entries(approvals?.nativeLanguageReview || {})) {
    if (approved !== true) failures.push(`Native-language approval is missing for ${locale}.`);
  }
  return failures;
}

export function readinessFailures({ target, env, approvals, wrangler, policy = {}, baseline = {}, indexingDecisions = {} }) {
  const failures = target === "site" ? approvalFailures(approvals) : [];
  if (target === "site") {
    if (approvals?.gscMigrationBaselineApproved !== true) failures.push("The 16-month GSC migration baseline approval is missing.");
    if (approvals?.indexingDecisionSetApproved !== true) failures.push("The locale indexing decision set approval is missing.");
    if (policy?.gscGate?.status !== "complete") failures.push("site-policy.json still blocks index-changing release work until the 16-month GSC export is complete.");
    failures.push(...baselineFailures(baseline));
    if (indexingDecisions?.status !== "ready") failures.push("The generated indexing decision set is not ready.");
    const siteKey = env.TURNSTILE_SITE_KEY || "";
    if (!valuePresent(siteKey) || TEST_TURNSTILE_KEYS.has(siteKey)) failures.push("A production TURNSTILE_SITE_KEY is required.");
    const ga4 = env.GA4_MEASUREMENT_ID || "";
    if (!/^G-[A-Z0-9]{8,}$/.test(ga4) || /REPLACE/i.test(ga4)) failures.push("A production GA4_MEASUREMENT_ID is required.");
    return failures;
  }

  if (target === "worker") {
    const databaseId = wrangler?.d1_databases?.find((entry) => entry.binding === "LEADS_DB")?.database_id || "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(databaseId) || databaseId === ZERO_UUID) {
      failures.push("A real D1 database_id is required for LEADS_DB.");
    }
    if (!valuePresent(env.CLOUDFLARE_API_TOKEN) || env.CLOUDFLARE_API_TOKEN.length < 20) failures.push("CLOUDFLARE_API_TOKEN is missing.");
    if (!/^[0-9a-f]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID || "")) failures.push("CLOUDFLARE_ACCOUNT_ID is missing or invalid.");
    if (!wrangler?.triggers?.crons?.includes("17 2 * * *")) failures.push("The daily metadata-retention Cron Trigger is missing.");
    const emailBinding = wrangler?.send_email?.find((entry) => entry.name === "LEAD_EMAIL");
    if (!emailBinding?.destination_address || !emailBinding?.allowed_sender_addresses?.length) failures.push("The fixed Email Service binding restrictions are incomplete.");
    return failures;
  }

  return ["Target must be either site or worker."];
}

async function main() {
  const targetIndex = process.argv.indexOf("--target");
  const target = targetIndex >= 0 ? process.argv[targetIndex + 1] : "";
  const root = process.cwd();
  const approvals = JSON.parse(await readFile(resolve(root, "approvals.json"), "utf8"));
  const policy = JSON.parse(await readFile(resolve(root, "site-policy.json"), "utf8"));
  const baseline = JSON.parse(await readFile(resolve(root, "seo/evidence/baseline-status.json"), "utf8"));
  const indexingDecisions = JSON.parse(await readFile(resolve(root, "seo/indexing-decisions.generated.json"), "utf8"));
  const wrangler = target === "worker"
    ? JSON.parse(await readFile(resolve(root, "wrangler.jsonc"), "utf8"))
    : {};
  const failures = readinessFailures({ target, env: process.env, approvals, wrangler, policy, baseline, indexingDecisions });
  if (failures.length) {
    console.error(failures.join("\n"));
    console.error(`release_readiness_failed target=${target || "unknown"} failures=${failures.length}`);
    process.exitCode = 1;
    return;
  }
  console.log(`release_readiness_passed target=${target}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
