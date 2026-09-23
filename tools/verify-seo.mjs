#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const SITE_ORIGIN = "https://www.metatecnocq.com";
const SKIP_DIRECTORIES = new Set(["node_modules"]);
const MAX_FAILURE_OUTPUT = 200;

function parseArgs(argv) {
  let root = process.cwd();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root") {
      const value = argv[index + 1];
      if (!value) throw new Error("--root requires a directory.");
      root = resolve(value);
      index += 1;
    } else if (argument.startsWith("--root=")) {
      root = resolve(argument.slice("--root=".length));
    } else if (argument === "--help" || argument === "-h") {
      console.log("Usage: node tools/verify-seo.mjs [--root <directory>]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return resolve(root);
}

async function htmlFiles(root) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.isSymbolicLink()) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) await visit(path);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
        files.push(path);
      }
    }
  }

  await visit(root);
  return files;
}

const count = (source, pattern) => (source.match(pattern) || []).length;
const attribute = (tag, name) => tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"))?.[2];
const relTokens = (tag) => (attribute(tag, "rel") || "").toLowerCase().split(/\s+/).filter(Boolean);

function fileLabel(root, file) {
  return relative(root, file).split(sep).join("/");
}

function expectedCanonical(label) {
  if (label === "index.html") return `${SITE_ORIGIN}/`;
  if (label.endsWith("/index.html")) return `${SITE_ORIGIN}/${label.slice(0, -"index.html".length)}`;
  return `${SITE_ORIGIN}/${label}`;
}

function internalIndexHref(rawHref, pageUrl) {
  if (!rawHref || rawHref.trim().startsWith("#")) return false;
  try {
    const target = new URL(rawHref.trim(), pageUrl);
    return target.origin === SITE_ORIGIN && target.pathname.endsWith("/index.html");
  } catch {
    return false;
  }
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

async function main() {
  const root = parseArgs(process.argv.slice(2));
  const files = await htmlFiles(root);
  const htmlByLabel = new Map();
  const failures = [];
  let totalFailures = 0;
  let internalIndexLinks = 0;
  let hreflangIndexLinks = 0;
  const recordFailure = (message) => {
    totalFailures += 1;
    if (failures.length < MAX_FAILURE_OUTPUT) failures.push(message);
  };

  for (const file of files) {
    const label = fileLabel(root, file);
    const html = await readFile(file, "utf8");
    htmlByLabel.set(label, html);
    const pageUrl = new URL(expectedCanonical(label));
    const linkMatches = [...html.matchAll(/<link\b[^>]*>/gi)];
    const linkTags = linkMatches.map((match) => match[0]);
    const canonicalMatches = linkMatches.filter((match) => relTokens(match[0]).includes("canonical"));
    const canonicalUrls = canonicalMatches
      .map((match) => attribute(match[0], "href"))
      .filter(Boolean);

    if (canonicalUrls.length !== 1) {
      recordFailure(`${label}:1: expected exactly one canonical, found ${canonicalUrls.length}`);
    } else if (canonicalUrls[0] !== expectedCanonical(label)) {
      const canonicalLine = lineNumber(html, canonicalMatches[0]?.index || 0);
      recordFailure(`${label}:${canonicalLine}: canonical ${canonicalUrls[0]} does not match ${expectedCanonical(label)}`);
    }

    for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
      const tag = match[0];
      const href = attribute(tag, "href");
      if (internalIndexHref(href, pageUrl)) {
        internalIndexLinks += 1;
        recordFailure(`${label}:${lineNumber(html, match.index)}: internal anchor points to index.html: ${href}`);
      }
    }

    for (const match of linkMatches) {
      const tag = match[0];
      if (!attribute(tag, "hreflang")) continue;
      const href = attribute(tag, "href");
      if (internalIndexHref(href, pageUrl)) {
        hreflangIndexLinks += 1;
        recordFailure(`${label}:${lineNumber(html, match.index)}: hreflang points to index.html: ${href}`);
      }
    }
  }

  const languages = [...htmlByLabel.keys()]
    .filter((label) => /^[^/]+\/index\.html$/.test(label))
    .map((label) => label.split("/")[0])
    .sort();

  for (const language of languages) {
    const label = `${language}/index.html`;
    const html = htmlByLabel.get(label);
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
    const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1]?.trim();
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
    if (!title || title.length < 25) recordFailure(`${label}:${lineNumber(html, Math.max(0, html.search(/<title\b/i)))}: title missing or too short`);
    if (!description) recordFailure(`${label}:${lineNumber(html, Math.max(0, html.search(/<meta\s+name="description"/i)))}: meta description is missing`);
    if (count(html, /<h1\b/gi) !== 1) recordFailure(`${label}:${lineNumber(html, Math.max(0, html.search(/<h1\b/i)))}: requires exactly one H1`);
    if (!h1 || h1.toLocaleLowerCase() === "metatecno") recordFailure(`${label}:${lineNumber(html, Math.max(0, html.search(/<h1\b/i)))}: H1 must express product intent, not only the brand`);
    const hreflang = language === "ko-kp" ? "ko-KP" : language;
    if (!html.includes(`hreflang="${hreflang}" href="${SITE_ORIGIN}/${language}/"`)) recordFailure(`${label}:1: self hreflang is missing`);
  }

  const sitemapPath = resolve(root, "sitemap.xml");
  const sitemap = await readFile(sitemapPath, "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim());
  for (const url of sitemapUrls) {
    const sitemapLine = lineNumber(sitemap, Math.max(0, sitemap.indexOf(`<loc>${url}</loc>`)));
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      recordFailure(`sitemap.xml:${sitemapLine}: invalid URL ${url}`);
      continue;
    }
    if (parsed.origin !== SITE_ORIGIN) recordFailure(`sitemap.xml:${sitemapLine}: non-canonical origin ${url}`);
    if (parsed.pathname.endsWith("/index.html")) recordFailure(`sitemap.xml:${sitemapLine}: index.html URL ${url}`);
  }
  if (totalFailures) {
    console.error(failures.join("\n"));
    if (totalFailures > failures.length) console.error(`... ${totalFailures - failures.length} additional failures omitted from console output.`);
    console.error(`SEO checks failed: ${files.length} HTML pages; ${languages.length} localized home pages; ${internalIndexLinks} internal index.html links; ${hreflangIndexLinks} hreflang index.html URLs; ${sitemapUrls.length} sitemap URLs.`);
    process.exit(1);
  }

  console.log(`SEO checks passed: ${files.length}/${files.length} HTML pages; ${languages.length} localized home pages; 0 internal index.html links; 0 hreflang index.html URLs; ${sitemapUrls.length} sitemap URLs.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
