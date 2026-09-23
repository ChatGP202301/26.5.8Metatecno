#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const english = await readFile(join(root, "en/index.html"), "utf8");
const alternates = english.match(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g) || [];
const german = '<link rel="alternate" hreflang="de" href="https://www.metatecnocq.com/de/">';
if (!alternates.some((link) => link.includes('hreflang="de"'))) alternates.splice(-1, 0, `  ${german}`);
const block = alternates.map((link) => `  ${link.trim()}`).join("\n");

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
  const path = join(root, entry.name, "index.html");
  let html;
  try { html = await readFile(path, "utf8"); } catch { continue; }
  if (entry.name === "de") {
    html = html.replace(/\s*<link rel="alternate" hreflang="de"[\s\S]*?<link rel="stylesheet"/, `\n${block}\n  <link rel="stylesheet"`);
  } else if (!html.includes('hreflang="de"')) {
    html = html.replace(/(\s*<link rel="alternate" hreflang="x-default"[^>]+>)/, `\n  ${german}$1`);
  }
  await writeFile(path, html, "utf8");
}

console.log("Synchronized German homepage hreflang references across localized homepages.");
