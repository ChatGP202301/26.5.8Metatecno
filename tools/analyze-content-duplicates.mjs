#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const root = process.cwd();
const output = resolve(root, "seo", "content-consolidation-candidates.csv");
const skip = new Set([".git", "_site", "node_modules", "seo", "tools", "worker", "de", "ar"]);

async function collect(current, files = []) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name.startsWith("audit-") || entry.name.startsWith(".") || skip.has(entry.name)) continue;
    const path = resolve(current, entry.name);
    if (entry.isDirectory()) await collect(path, files);
    else if (entry.isFile() && entry.name === "index.html") files.push(path);
  }
  return files;
}

function route(path) {
  const label = relative(root, path).split(sep).join("/");
  return label === "index.html" ? "/" : `/${label.slice(0, -"index.html".length)}`;
}

function normalizedMain(html) {
  let main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || "";
  main = main.replace(/<form\b[\s\S]*?<\/form>/gi, " ");
  main = main.replace(/<section\b[^>]*data-compatibility-disclaimer[\s\S]*?<\/section>/gi, " ");
  main = main.replace(/<script\b[\s\S]*?<\/script>/gi, " ");
  main = main.replace(/<img\b[^>]*>/gi, " ");
  main = main.replace(/<[^>]+>/g, " ");
  main = main.replace(/&(?:nbsp|amp|quot|#39);/gi, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return main;
}

function canonicalCandidate(paths) {
  return [...paths].sort((left, right) => {
    const leftNumbered = /-\d+\/$/.test(left) ? 1 : 0;
    const rightNumbered = /-\d+\/$/.test(right) ? 1 : 0;
    return leftNumbered - rightNumbered || left.length - right.length || left.localeCompare(right);
  })[0];
}

function csv(value) { return `"${String(value).replaceAll('"', '""')}"`; }

const groups = new Map();
for (const file of await collect(root)) {
  const path = route(file);
  if (!/\/products\/[^/]+\/$/.test(path)) continue;
  const locale = path.split("/").filter(Boolean)[0];
  const text = normalizedMain(await readFile(file, "utf8"));
  if (text.length < 120) continue;
  const hash = createHash("sha256").update(`${locale}\n${text}`).digest("hex");
  const group = groups.get(hash) || { hash, locale, paths: [] };
  group.paths.push(path);
  groups.set(hash, group);
}

const rows = [["cluster_id", "locale", "member_count", "canonical_candidate", "source_path", "text_hash", "status", "review_required"]];
let cluster = 0;
for (const group of [...groups.values()].filter((item) => item.paths.length > 1).sort((a, b) => b.paths.length - a.paths.length || a.hash.localeCompare(b.hash))) {
  cluster += 1;
  const candidate = canonicalCandidate(group.paths);
  for (const path of group.paths.sort()) {
    rows.push([`DUP-${String(cluster).padStart(4, "0")}`, group.locale, group.paths.length, candidate, path, group.hash, "candidate_only_not_redirected", "engineering+sales+image+GSC"]);
  }
}

await mkdir(resolve(root, "seo"), { recursive: true });
await writeFile(output, rows.map((row) => row.map(csv).join(",")).join("\n") + "\n", "utf8");
console.log(`duplicate_clusters=${cluster} candidate_pages=${rows.length - 1} output=${relative(root, output)}`);
