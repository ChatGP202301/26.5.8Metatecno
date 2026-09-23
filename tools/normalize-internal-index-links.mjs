#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const SITE_ORIGIN = "https://www.metatecnocq.com";
const MAX_EXAMPLES = 100;
const SKIP_DIRECTORIES = new Set(["node_modules"]);

function usage() {
  console.log("Usage: node tools/normalize-internal-index-links.mjs <--check|--write> [--root <directory>]");
}

function parseArgs(argv) {
  let mode = "";
  let root = process.cwd();

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check" || argument === "--write") {
      if (mode) throw new Error("Choose exactly one of --check or --write.");
      mode = argument.slice(2);
    } else if (argument === "--root") {
      const value = argv[index + 1];
      if (!value) throw new Error("--root requires a directory.");
      root = resolve(value);
      index += 1;
    } else if (argument.startsWith("--root=")) {
      root = resolve(argument.slice("--root=".length));
    } else if (argument === "--help" || argument === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!mode) throw new Error("Choose exactly one of --check or --write.");
  return { mode, root: resolve(root) };
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

function webPathForFile(root, file) {
  const localPath = relative(root, file).split(sep).join("/");
  if (localPath === "index.html") return "/";
  return `/${localPath}`;
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function cleanInternalIndexHref(rawHref, pageUrl) {
  const href = rawHref.trim();
  if (!href || href.startsWith("#")) return null;

  let original;
  try {
    original = new URL(href, pageUrl);
  } catch {
    return null;
  }

  if (original.origin !== SITE_ORIGIN || !original.pathname.endsWith("/index.html")) return null;

  const cleanPath = original.pathname.slice(0, -"index.html".length);
  const replacement = `${cleanPath}${original.search}${original.hash}`;
  const normalized = new URL(replacement, SITE_ORIGIN);

  const equivalent = original.origin === normalized.origin
    && original.pathname === `${normalized.pathname}index.html`
    && original.search === normalized.search
    && original.hash === normalized.hash;
  if (!equivalent) {
    throw new Error(`Unsafe rewrite rejected: ${rawHref} -> ${replacement}`);
  }

  return replacement;
}

function normalizeHtml(html, pageUrl, fileLabel) {
  const changes = [];
  const normalized = html.replace(/<a\b[^>]*>/gi, (tag, tagOffset) => {
    const hrefMatch = tag.match(/(?:^|\s)href\s*=\s*(["'])([\s\S]*?)\1/i);
    if (!hrefMatch) return tag;

    const rawHref = hrefMatch[2];
    const replacement = cleanInternalIndexHref(rawHref, pageUrl);
    if (replacement === null || replacement === rawHref) return tag;

    const quotedValue = `${hrefMatch[1]}${rawHref}${hrefMatch[1]}`;
    const quotedOffset = hrefMatch[0].indexOf(quotedValue);
    if (quotedOffset < 0) throw new Error(`Could not locate href value in ${fileLabel}.`);
    const valueOffset = hrefMatch.index + quotedOffset + 1;
    const absoluteOffset = tagOffset + valueOffset;

    changes.push({
      file: fileLabel,
      line: lineNumber(html, absoluteOffset),
      from: rawHref,
      to: replacement,
    });

    return `${tag.slice(0, valueOffset)}${replacement}${tag.slice(valueOffset + rawHref.length)}`;
  });

  return { changes, normalized };
}

async function main() {
  const { mode, root } = parseArgs(process.argv.slice(2));
  const files = await htmlFiles(root);
  const allChanges = [];
  let changedFiles = 0;

  for (const file of files) {
    const fileLabel = relative(root, file).split(sep).join("/");
    const html = await readFile(file, "utf8");
    const pageUrl = new URL(webPathForFile(root, file), SITE_ORIGIN);
    const { changes, normalized } = normalizeHtml(html, pageUrl, fileLabel);
    if (!changes.length) continue;

    changedFiles += 1;
    allChanges.push(...changes);
    if (mode === "write") await writeFile(file, normalized, "utf8");
  }

  for (const change of allChanges.slice(0, MAX_EXAMPLES)) {
    console.log(`${change.file}:${change.line}: ${change.from} -> ${change.to}`);
  }
  if (allChanges.length > MAX_EXAMPLES) {
    console.log(`... ${allChanges.length - MAX_EXAMPLES} additional rewrites omitted from console output.`);
  }

  console.log(`mode=${mode} html_files=${files.length} changed_files=${changedFiles} rewritten_links=${allChanges.length}`);
  if (mode === "check" && allChanges.length) process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
