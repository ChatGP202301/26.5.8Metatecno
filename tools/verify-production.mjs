#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

let root = process.cwd();
const built = process.argv.includes("--built");
const rootIndex = process.argv.indexOf("--root");
if (rootIndex >= 0) root = resolve(process.argv[rootIndex + 1]);
const failures = [];
const governanceRoot = built ? process.cwd() : root;
const SKIP = new Set([".git", "_site", "node_modules", "seo", "tools", "worker", "de"]);

async function collect(current, output = []) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name.startsWith("audit-") || entry.name.startsWith(".") || SKIP.has(entry.name)) continue;
    const path = resolve(current, entry.name);
    if (entry.isDirectory()) await collect(path, output);
    else if (entry.isFile() && entry.name.endsWith(".html") && entry.name !== "404.html") output.push(path);
  }
  return output;
}
function label(path) { return relative(root, path).split(sep).join("/"); }
function fail(message) { if (failures.length < 300) failures.push(message); }
function count(source, regex) { return (source.match(regex) || []).length; }

const files = (await collect(root)).sort();
if (files.length < 2653) fail(`Expected at least 2653 production HTML pages, found ${files.length}.`);
let forms = 0;
let indexLinks = 0;
const canonicalByPath = new Map();
const pageStateByRoute = new Map();
const hreflangTargets = [];

function routeForLabel(name) {
  return name === "index.html" ? "/" : `/${name.slice(0, -"index.html".length)}`;
}

for (const file of files) {
  const name = label(file);
  const html = await readFile(file, "utf8");
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
  if (!canonical) fail(`${name}: missing canonical`);
  canonicalByPath.set(name, canonical);
  const route = routeForLabel(name);
  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1] || "index,follow";
  pageStateByRoute.set(route, { name, robots });
  for (const alternate of html.matchAll(/<link\s+rel=["']alternate["'][^>]*\shref=["']([^"']+)["'][^>]*>/gi)) {
    try {
      const url = new URL(alternate[1]);
      if (url.origin === "https://www.metatecnocq.com") hreflangTargets.push({ source: name, path: url.pathname });
    } catch { fail(`${name}: invalid hreflang URL ${alternate[1]}`); }
  }
  if (count(html, /<h1\b/gi) !== 1) fail(`${name}: expected exactly one H1`);
  if (!/<meta\s+name=["']description["']/i.test(html)) fail(`${name}: missing description`);
  if (!/class=["'][^"']*skip-link/i.test(html)) fail(`${name}: missing skip link`);
  if (!/<main\b[^>]*\bid=["']main-content["']/i.test(html)) fail(`${name}: main landmark lacks target id`);
  if (!/<meta\s+property=["']og:title["']/i.test(html) || !/<meta\s+property=["']og:description["']/i.test(html) || !/<meta\s+property=["']og:image["']/i.test(html)) fail(`${name}: incomplete Open Graph metadata`);
  if (!/<meta\s+name=["']twitter:card["']/i.test(html)) fail(`${name}: missing Twitter card`);
  if (!/assets\/quality(?:\.[a-f0-9]{10})?\.css/i.test(html)) fail(`${name}: missing quality stylesheet`);
  if (!/assets\/navigation(?:\.[a-f0-9]{10})?\.js/i.test(html)) fail(`${name}: missing accessible navigation controller`);
  if (!/assets\/analytics(?:\.[a-f0-9]{10})?\.js/i.test(html)) fail(`${name}: missing analytics controller`);
  if (/formsubmit\.co/i.test(html)) fail(`${name}: FormSubmit remains`);
  if (/expresswater025@gmail\.com/i.test(html)) fail(`${name}: private destination email is public`);
  for (const anchor of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    if (/(?:^|\/)index\.html(?:[?#]|$)/i.test(anchor[1])) indexLinks += 1;
  }
  const pageForms = count(html, /<form\b[^>]*data-contact-form/gi);
  forms += pageForms;
  if (pageForms) {
    if (count(html, /<form\b[^>]*data-contact-form[^>]*action=["']\/api\/lead["']/gi) !== pageForms) fail(`${name}: not every RFQ form uses /api/lead`);
    if (count(html, /data-turnstile-container/gi) !== pageForms) fail(`${name}: not every RFQ form has Turnstile`);
  }
  const locale = name === "index.html" ? "en" : name.split("/")[0];
  if (["he", "fa", "ar"].includes(locale) && !/<html\b[^>]*\bdir=["']rtl["']/i.test(html)) fail(`${name}: RTL locale lacks dir=rtl`);
  if (/hreflang=["'](?:es|pt)["']/i.test(html)) fail(`${name}: generic Spanish or Portuguese hreflang remains`);
  if (/hreflang=["']de["']/i.test(html)) fail(`${name}: undeployed German hreflang remains`);
}

if (indexLinks) fail(`Internal index.html anchors remaining: ${indexLinks}`);
if (forms < 2000) fail(`Expected at least 2000 RFQ forms, found ${forms}.`);
const enHome = await readFile(resolve(root, "en/index.html"), "utf8");
if (!/content=["']noindex,follow["']/i.test(enHome) || !/canonical["']\s+href=["']https:\/\/www\.metatecnocq\.com\/["']/i.test(enHome)) fail("/en/ must be a noindex fallback canonicalized to /.");

const manifest = JSON.parse(await readFile(resolve(root, "site-manifest.json"), "utf8"));
if (manifest.pages.length !== files.length) fail(`Manifest has ${manifest.pages.length} pages, HTML inventory has ${files.length}.`);
const manifestSitemap = new Set(manifest.pages.filter((page) => page.sitemap).map((page) => page.canonical));
const manifestByPath = new Map(manifest.pages.map((page) => [page.path, page]));
const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== new Set(sitemapUrls).size) fail("Sitemap contains duplicate URLs.");
if (sitemapUrls.length !== manifestSitemap.size || sitemapUrls.some((url) => !manifestSitemap.has(url))) fail("Sitemap does not exactly match the manifest indexable set.");

const contentEvidence = JSON.parse(await readFile(resolve(governanceRoot, "seo/content-evidence.json"), "utf8"));
const governanceNoindexPaths = new Set();
for (const entry of contentEvidence.pages || []) {
  const state = pageStateByRoute.get(entry.path);
  const page = manifestByPath.get(entry.path);
  if (!state || !page) {
    fail(`Content evidence registry path is missing from the site: ${entry.path}`);
    continue;
  }
  if (entry.status !== "approved") {
    governanceNoindexPaths.add(entry.path);
    if (!/noindex/i.test(state.robots)) fail(`${state.name}: unapproved evidence content must be noindex`);
    if (page.sitemap) fail(`${state.name}: unapproved evidence content must not be in Sitemap`);
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.reviewedAt || "")
    || !(entry.requiredRoles || []).every((role) => (entry.approvedRoles || []).includes(role))) {
    fail(`${state.name}: approved evidence content lacks the dated approvals required by its registry entry`);
  }
}

const indexingDecisions = JSON.parse(await readFile(resolve(governanceRoot, "seo/indexing-decisions.generated.json"), "utf8"));
if (indexingDecisions.status === "ready") {
  for (const decision of indexingDecisions.decisions || []) {
    if (decision.action !== "noindex_follow") continue;
    governanceNoindexPaths.add(decision.path);
    const state = pageStateByRoute.get(decision.path);
    const page = manifestByPath.get(decision.path);
    if (!state || !page) fail(`Indexing decision path is missing from the site: ${decision.path}`);
    else {
      if (!/noindex/i.test(state.robots)) fail(`${state.name}: approved noindex decision is not reflected in HTML`);
      if (page.sitemap) fail(`${state.name}: approved noindex decision remains in Sitemap`);
    }
  }
}

for (const target of hreflangTargets) {
  if (governanceNoindexPaths.has(target.path)) fail(`${target.source}: hreflang points to a governance-held page ${target.path}`);
}

const llms = await readFile(resolve(root, "llms.txt"), "utf8");
if (!/^# Metatecno$/m.test(llms) || !/Compatibility notice/.test(llms)) fail("llms.txt lacks the approved brand definition or compatibility notice.");
for (const match of llms.matchAll(/\[[^\]]+\]\((https:\/\/www\.metatecnocq\.com[^)]+)\)/g)) {
  const url = new URL(match[1]);
  const page = manifestByPath.get(url.pathname);
  if (!page || !page.sitemap) fail(`llms.txt points to a missing or non-indexable page: ${url.pathname}`);
}
const businessProfile = JSON.parse(await readFile(resolve(governanceRoot, "seo/geo/business-profile.json"), "utf8"));
const activeProfileText = `${businessProfile.businessDefinition || ""} ${(businessProfile.coreTerminology || []).join(" ")}`.toLowerCase();
if (!/chlor-alkali/.test(activeProfileText) || !/electrolyzer/.test(activeProfileText)) fail("The GEO business profile lacks the current chlor-alkali electrolyzer entity definition.");
for (const retiredTerm of businessProfile.prohibitedLegacyTerminology || []) {
  if (activeProfileText.includes(retiredTerm.toLowerCase())) fail(`The active GEO vocabulary still includes retired terminology: ${retiredTerm}`);
}

const html404 = await readFile(resolve(root, "404.html"), "utf8");
if (!/noindex,follow/i.test(html404) || !/Page Not Found/i.test(html404)) fail("Branded 404 is incomplete.");
const navigationController = await readFile(resolve(root, "assets/navigation.js"), "utf8");
if (!/aria-expanded/.test(navigationController) || !/aria-controls/.test(navigationController) || !/Escape/.test(navigationController)) {
  fail("Accessible mobile navigation controller is incomplete.");
}
const qualityStyles = await readFile(resolve(root, "assets/quality.css"), "utf8");
if (!/\.site-header\.nav-enhanced[\s\S]*\.nav\[hidden\]\s*\{\s*display:\s*none/.test(qualityStyles)) {
  fail("Mobile navigation hidden-state styling is incomplete.");
}
if (built) {
  for (const file of files.slice(0, 50)) {
    const html = await readFile(file, "utf8");
    if (/__(?:TURNSTILE_SITE_KEY|GA4_MEASUREMENT_ID)__/.test(html)) fail(`${label(file)}: unresolved build token`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`verification_failed=${failures.length}`);
  process.exit(1);
}
console.log(`verification_passed html_pages=${files.length} forms=${forms} sitemap_urls=${sitemapUrls.length} built=${built}`);
