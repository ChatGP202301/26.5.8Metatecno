#!/usr/bin/env node
import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { validMt27ScopedProductionPublication } from "./mt27-scoped-release.mjs";

const ROOT = resolve(process.cwd(), "_site");
const ASSETS = resolve(ROOT, "assets");
const production = process.env.METATECNO_ENV === "production";
const testSiteKey = "1x00000000000000000000AA";
const siteKey = process.env.TURNSTILE_SITE_KEY || (production ? "" : testSiteKey);
const ga4 = process.env.GA4_MEASUREMENT_ID || (production ? "" : "G-REPLACE01");
const approvals = JSON.parse(await readFile(resolve(process.cwd(), "approvals.json"), "utf8"));
const policy = JSON.parse(await readFile(resolve(process.cwd(), "site-policy.json"), "utf8"));
const mt27Review = JSON.parse(await readFile(resolve(process.cwd(), "seo/mt27-release-review.json"), "utf8"));
const scopedMt27Production = production
  && process.env.METATECNO_RELEASE_SCOPE === "mt27-indexing"
  && validMt27ScopedProductionPublication(policy, mt27Review);

if (!siteKey) throw new Error("TURNSTILE_SITE_KEY is required for a production build.");
if (production && (!/^G-[A-Z0-9]{8,}$/.test(ga4) || ga4.includes("REPLACE"))) throw new Error("A real GA4_MEASUREMENT_ID is required for a production build.");
if (production && !scopedMt27Production && approvals.legalReviewApproved !== true) throw new Error("Legal review approval is required for a production build.");
if (production && !scopedMt27Production && Object.values(approvals.nativeLanguageReview || {}).some((value) => value !== true)) throw new Error("All listed priority-language reviews must be approved for a production build.");
if (production && process.env.METATECNO_RELEASE_SCOPE === "mt27-indexing" && !scopedMt27Production) {
  throw new Error("Scoped MT-2.7 production exception is invalid, incomplete, or not limited to the authorized 12 URLs.");
}

const fingerprints = new Map();
for (const entry of await readdir(ASSETS, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.(?:css|js)$/i.test(entry.name) || /\.[a-f0-9]{10}\./.test(entry.name)) continue;
  const path = resolve(ASSETS, entry.name);
  const content = await readFile(path);
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 10);
  const nextName = entry.name.replace(/\.(css|js)$/i, `.${hash}.$1`);
  await copyFile(path, resolve(ASSETS, nextName));
  fingerprints.set(entry.name, nextName);
}

async function htmlFiles(current, output = []) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const path = resolve(current, entry.name);
    if (entry.isDirectory()) await htmlFiles(path, output);
    else if (entry.isFile() && entry.name.endsWith(".html")) output.push(path);
  }
  return output;
}

for (const path of await htmlFiles(ROOT)) {
  let html = await readFile(path, "utf8");
  html = html.replaceAll("__TURNSTILE_SITE_KEY__", siteKey).replaceAll("__GA4_MEASUREMENT_ID__", ga4);
  for (const [original, fingerprinted] of fingerprints) {
    html = html.replace(new RegExp(`(?<=assets/)${original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), fingerprinted);
  }
  await writeFile(path, html, "utf8");
}

console.log(`fingerprinted_assets=${fingerprints.size} environment=${production ? "production" : "preview"}`);
