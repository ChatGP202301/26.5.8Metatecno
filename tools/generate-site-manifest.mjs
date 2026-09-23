#!/usr/bin/env node
import { readFile, readdir, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const ROOT = process.cwd();
const MODE = process.argv.includes("--write") ? "write" : "check";
const ORIGIN = "https://www.metatecnocq.com";
const SKIP = new Set([".git", "_site", "node_modules", "seo", "tools", "worker", "de"]);
const BUILD_DATE = process.env.BUILD_DATE || "2026-08-14";

async function loadJson(path, fallback) {
  try { return JSON.parse(await readFile(resolve(ROOT, path), "utf8")); }
  catch { return fallback; }
}

async function collect(current, output = []) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name.startsWith("audit-") || entry.name.startsWith(".") || SKIP.has(entry.name)) continue;
    const path = resolve(current, entry.name);
    if (entry.isDirectory()) await collect(path, output);
    else if (entry.isFile() && entry.name.endsWith(".html") && entry.name !== "404.html") output.push(path);
  }
  return output;
}
function label(file) { return relative(ROOT, file).split(sep).join("/"); }
function route(fileLabel) { return fileLabel === "index.html" ? "/" : `/${fileLabel.slice(0, -"index.html".length)}`; }
function pageType(path) {
  if (/\/thank-you\/$/.test(path)) return "thank-you";
  if (/\/products\/$/.test(path)) return "product-hub";
  if (/\/products\//.test(path)) return "product";
  if (/\/knowledge\//.test(path)) return "knowledge";
  if (/\/services\//.test(path)) return "service";
  if (/\/privacy/.test(path)) return "privacy";
  if (/\/terms/.test(path)) return "terms";
  if (path === "/" || /^\/[a-z-]+\/$/.test(path)) return "home";
  return "content";
}
function hreflangGroup(path) {
  if (path === "/") return "/";
  const parts = path.split("/").filter(Boolean);
  return `/${parts.slice(1).join("/")}${parts.length > 1 ? "/" : ""}`;
}

async function generate() {
  const policy = await loadJson("site-policy.json", { manifestVersion: 1 });
  const contentEvidence = await loadJson("seo/content-evidence.json", { pages: [] });
  const indexingDecisions = await loadJson("seo/indexing-decisions.generated.json", { status: "blocked", decisions: [] });
  const contentStatusByPath = new Map((contentEvidence.pages || []).map((page) => [page.path, page.status]));
  const indexingDecisionByPath = new Map(
    indexingDecisions.status === "ready"
      ? (indexingDecisions.decisions || []).map((decision) => [decision.path, decision.action])
      : []
  );
  const pages = [];
  for (const file of (await collect(ROOT)).sort()) {
    const fileLabel = label(file);
    const path = route(fileLabel);
    const html = await readFile(file, "utf8");
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] || `${ORIGIN}${path}`;
    const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1] || "index,follow";
    const folderLocale = fileLabel === "index.html" ? "en" : fileLabel.split("/")[0];
    const locale = folderLocale === "es" ? "es-419" : folderLocale === "pt" ? "pt-BR" : folderLocale;
    const contentEvidenceStatus = contentStatusByPath.get(path) || null;
    const indexingDecision = indexingDecisionByPath.get(path) || null;
    const governanceNoindex = (contentEvidenceStatus && contentEvidenceStatus !== "approved") || indexingDecision === "noindex_follow";
    const baseIndexable = !/noindex/i.test(robots) && canonical === `${ORIGIN}${path}`;
    pages.push({
      source: fileLabel,
      path,
      canonical,
      locale,
      pageType: pageType(path),
      indexable: baseIndexable && !governanceNoindex,
      sitemap: baseIndexable && !governanceNoindex,
      hreflangGroup: hreflangGroup(path),
      ...(contentEvidenceStatus ? { contentEvidenceStatus } : {}),
      ...(indexingDecision ? { indexingDecision } : {}),
      redirectSource: path === "/en/" ? "/en/" : null,
      redirectTarget: path === "/en/" ? "/" : null,
      lastModified: BUILD_DATE
    });
  }
  const canonicalPages = pages.filter((page) => page.sitemap);
  const seen = new Set();
  for (const page of canonicalPages) {
    if (seen.has(page.canonical)) throw new Error(`Duplicate sitemap canonical: ${page.canonical}`);
    seen.add(page.canonical);
  }
  const manifest = JSON.stringify({ version: policy.manifestVersion || 1, generatedAt: `${BUILD_DATE}T00:00:00Z`, origin: ORIGIN, pages }, null, 2) + "\n";
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${canonicalPages.map((page) => `  <url><loc>${page.canonical}</loc><lastmod>${page.lastModified}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  return { manifest, sitemap, pages, canonicalPages };
}

async function main() {
  const output = await generate();
  const targets = [["site-manifest.json", output.manifest], ["sitemap.xml", output.sitemap]];
  let changed = 0;
  for (const [name, content] of targets) {
    let current = "";
    try { current = await readFile(resolve(ROOT, name), "utf8"); } catch { /* missing */ }
    if (current !== content) {
      changed += 1;
      if (MODE === "write") await writeFile(resolve(ROOT, name), content, "utf8");
    }
  }
  console.log(`mode=${MODE} pages=${output.pages.length} indexable=${output.canonicalPages.length} changed_outputs=${changed}`);
  if (MODE === "check" && changed) process.exit(1);
}

main().catch((error) => { console.error(error); process.exit(1); });
