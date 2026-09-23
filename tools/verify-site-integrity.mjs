#!/usr/bin/env node
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const ORIGIN = "https://www.metatecnocq.com";
const rootIndex = process.argv.indexOf("--root");
const root = resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : ".");
const isBuild = root.endsWith(`${sep}_site`);
const skippedDirectories = new Set([".git", "de", "node_modules", ...(isBuild ? [] : ["_site"])]);
const failures = [];
const missingTargets = new Map();
let checkedUrls = 0;
let checkedSrcsets = 0;
let indexHtmlLinks = 0;

async function collectHtml(current, output = []) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name.startsWith("audit-") || skippedDirectories.has(entry.name)) continue;
    const path = resolve(current, entry.name);
    if (entry.isDirectory()) await collectHtml(path, output);
    else if (entry.isFile() && entry.name.endsWith(".html")) output.push(path);
  }
  return output;
}

function label(file) {
  return relative(root, file).split(sep).join("/");
}

function routeFor(file) {
  const name = label(file);
  if (name === "index.html") return "/";
  if (name.endsWith("/index.html")) return `/${name.slice(0, -"index.html".length)}`;
  return `/${name}`;
}

async function exists(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

function recordMissing(target, source) {
  if (!missingTargets.has(target)) missingTargets.set(target, new Set());
  missingTargets.get(target).add(source);
}

function localUrl(raw, baseRoute) {
  const value = raw.trim();
  if (!value || value.startsWith("#") || /^(?:mailto|tel|sms|javascript|data|blob):/i.test(value)) return null;
  let url;
  try { url = new URL(value, `${ORIGIN}${baseRoute}`); } catch { return null; }
  if (url.origin !== ORIGIN) return null;
  if (/^\/(?:api|cdn-cgi)\//.test(url.pathname)) return null;
  return url;
}

async function targetExists(url) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { pathname = url.pathname; }
  const clean = pathname.replace(/^\/+/, "");
  if (!clean || pathname.endsWith("/")) return exists(resolve(root, clean, "index.html"));
  const exact = resolve(root, clean);
  if (await exists(exact)) return true;
  if (!/\.[^/]+$/.test(clean)) return exists(resolve(root, clean, "index.html"));
  return false;
}

function values(html, regex) {
  return [...html.matchAll(regex)].map((match) => match[1]);
}

const files = (await collectHtml(root)).sort();
for (const file of files) {
  const html = await readFile(file, "utf8");
  const source = label(file);
  const route = routeFor(file);
  const urls = [
    ...values(html, /<a\b[^>]*\bhref=["']([^"']+)["']/gi),
    ...values(html, /<(?:img|script|source|video|audio|iframe)\b[^>]*\bsrc=["']([^"']+)["']/gi),
    ...values(html, /<link\b[^>]*\bhref=["']([^"']+)["']/gi),
  ];
  for (const raw of urls) {
    const url = localUrl(raw, route);
    if (!url) continue;
    checkedUrls += 1;
    if (/(?:^|\/)index\.html$/i.test(url.pathname)) indexHtmlLinks += 1;
    if (!(await targetExists(url))) recordMissing(`${url.pathname}${url.search}`, source);
  }
  for (const srcset of values(html, /\bsrcset=["']([^"']+)["']/gi)) {
    for (const candidate of srcset.split(",")) {
      const raw = candidate.trim().split(/\s+/)[0];
      const url = localUrl(raw, route);
      if (!url) continue;
      checkedUrls += 1;
      checkedSrcsets += 1;
      if (!(await targetExists(url))) recordMissing(`${url.pathname}${url.search}`, source);
    }
  }
}

if (indexHtmlLinks) failures.push(`Internal index.html URLs remaining: ${indexHtmlLinks}`);
for (const [target, sources] of missingTargets) {
  failures.push(`Missing ${target} referenced by ${[...sources].slice(0, 5).join(", ")}${sources.size > 5 ? ` (+${sources.size - 5} more)` : ""}`);
}

if (failures.length) {
  console.error(failures.slice(0, 300).join("\n"));
  console.error(`integrity_failed=${failures.length} html_pages=${files.length} urls_checked=${checkedUrls} srcset_candidates=${checkedSrcsets} missing_targets=${missingTargets.size}`);
  process.exit(1);
}

console.log(`integrity_passed html_pages=${files.length} urls_checked=${checkedUrls} srcset_candidates=${checkedSrcsets} missing_targets=0`);
