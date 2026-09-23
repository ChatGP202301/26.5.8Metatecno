#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const entries = await readdir(root, { withFileTypes: true });
let updated = 0;

for (const entry of entries) {
  if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
  const path = join(root, entry.name, "index.html");
  let html;
  try { html = await readFile(path, "utf8"); } catch { continue; }
  if (!/<h1>Metatecno<\/h1>/i.test(html)) continue;
  const title = html.match(/<title>([^<|]+?)(?:\s*\|\s*Metatecno)?<\/title>/i)?.[1]?.trim();
  if (!title || title.toLocaleLowerCase() === "metatecno") {
    throw new Error(`${entry.name}/index.html has a brand-only H1 but no usable localized title`);
  }
  html = html.replace(/<h1>Metatecno<\/h1>/i, `<h1>${title}</h1>`);
  await writeFile(path, html, "utf8");
  updated += 1;
}

console.log(`Normalized ${updated} localized homepage H1 values from their existing localized titles.`);
