#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";

const EXCLUDED = new Set([".git", "audit-2026-08-10", "node_modules"]);
const allowPlaceholder = process.argv.includes("--allow-placeholder");
const rootArgument = process.argv.indexOf("--root");
const root = resolve(rootArgument >= 0 ? process.argv[rootArgument + 1] : process.cwd());

async function htmlFiles() {
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || (entry.isDirectory() && EXCLUDED.has(entry.name))) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) files.push(path);
    }
  }
  await visit(root);
  return files.sort();
}

const count = (source, pattern) => (source.match(pattern) || []).length;
const failures = [];
const fail = (label, message) => failures.push(`${label}: ${message}`);

async function main() {
  const analytics = await readFile(resolve(root, "assets/analytics.js"), "utf8");
  const consent = await readFile(resolve(root, "assets/cookie-consent.js"), "utf8");
  const contact = await readFile(resolve(root, "assets/contact-form.js"), "utf8");
  const measurement = analytics.match(/const MEASUREMENT_ID = "([^"]+)";/)?.[1] || "";
  if (!/^G-[A-Z0-9]{8,}$/.test(measurement)) fail("assets/analytics.js", "Measurement ID format is invalid");
  if (!allowPlaceholder && measurement.includes("REPLACE")) fail("assets/analytics.js", "Measurement ID is still a placeholder");
  for (const token of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization", "generate_lead", "metatecno_lead_pending_v1"]) {
    if (!analytics.includes(token)) fail("assets/analytics.js", `missing ${token}`);
  }
  if (!consent.includes("dataCookieSettings") && !consent.includes("cookieSettings")) fail("assets/cookie-consent.js", "Cookie Settings control is missing");
  if (!contact.includes("metatecno_lead_pending_v1")) fail("assets/contact-form.js", "lead confirmation guard is missing");

  const files = await htmlFiles();
  if (files.length !== 383) fail("site", `expected 383 HTML pages, found ${files.length}`);
  for (const file of files) {
    const label = relative(root, file).split(sep).join("/");
    const html = await readFile(file, "utf8");
    if (count(html, /<script\b[^>]*src=(['"])[^'"]*assets\/analytics\.js\1[^>]*><\/script>/gi) !== 1) fail(label, "requires exactly one analytics.js script");
    if (count(html, /<script\b[^>]*src=(['"])[^'"]*assets\/cookie-consent\.js\1[^>]*><\/script>/gi) !== 1) fail(label, "requires exactly one cookie-consent.js script");
    if (count(html, /\bdata-cookie-banner\b/gi) !== 1) fail(label, "requires exactly one cookie banner");
    if (!/<footer\b[^>]*class=(['"])[^'"]*site-footer[^'"]*\1[\s\S]*?<a\b[^>]*href=(['"])\/(?:[a-z-]+)\/privacy-policy\/\2/i.test(html)) fail(label, "footer privacy-policy link is missing");
    if (/googletagmanager\.com|google-analytics\.com|\bG-[A-Z0-9]{8,}\b/i.test(html)) fail(label, "inline Google tag or Measurement ID is forbidden");
  }

  const privacyFiles = files.filter((file) => /\/privacy-policy\/index\.html$/.test(file.split(sep).join("/")));
  for (const file of privacyFiles) {
    const html = await readFile(file, "utf8");
    if (!/Google Analytics/i.test(html)) fail(relative(root, file), "Google Analytics disclosure is missing");
  }
  if (privacyFiles.length !== 5) fail("privacy", `expected 5 existing privacy-policy pages, found ${privacyFiles.length}`);

  if (failures.length) {
    console.error(failures.slice(0, 100).join("\n"));
    if (failures.length > 100) console.error(`... ${failures.length - 100} more`);
    console.error(`Analytics verification failed: ${failures.length} findings.`);
    process.exit(1);
  }
  console.log(`Analytics verification passed: ${files.length}/${files.length} HTML pages; Measurement ID ${measurement}; 1 consent banner + 1 cookie script + 1 analytics script per page; ${privacyFiles.length} privacy disclosures.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
