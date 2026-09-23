#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const temporaryRoot = await mkdtemp(join(tmpdir(), "metatecno-governance-"));

function run(script, args = []) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [resolve(toolsDirectory, script), ...args], { cwd: temporaryRoot, stdio: "pipe" });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolvePromise(output) : reject(new Error(output)));
  });
}

try {
  await mkdir(resolve(temporaryRoot, "seo"), { recursive: true });
  await mkdir(resolve(temporaryRoot, "ja/example"), { recursive: true });
  await writeFile(resolve(temporaryRoot, "site-policy.json"), JSON.stringify({ manifestVersion: 2 }), "utf8");
  await writeFile(resolve(temporaryRoot, "seo/content-evidence.json"), JSON.stringify({ pages: [] }), "utf8");
  await writeFile(resolve(temporaryRoot, "seo/indexing-decisions.generated.json"), JSON.stringify({
    status: "ready",
    decisions: [{ path: "/ja/example/", action: "noindex_follow" }]
  }), "utf8");
  await writeFile(resolve(temporaryRoot, "ja/example/index.html"), `<!doctype html><html lang="ja"><head><title>Example</title><meta name="description" content="Example page"><meta name="robots" content="index,follow"><link rel="canonical" href="https://www.metatecnocq.com/ja/example/"><link rel="alternate" hreflang="ja" href="https://www.metatecnocq.com/ja/example/"></head><body><main><h1>Example</h1></main></body></html>`, "utf8");

  await run("modernize-site.mjs", ["--write"]);
  await run("generate-site-manifest.mjs", ["--write"]);
  let html = await readFile(resolve(temporaryRoot, "ja/example/index.html"), "utf8");
  let manifest = JSON.parse(await readFile(resolve(temporaryRoot, "site-manifest.json"), "utf8"));
  assert.match(html, /noindex,follow/);
  assert.doesNotMatch(html, /rel="alternate"/);
  assert.equal(manifest.pages[0].sitemap, false);

  await writeFile(resolve(temporaryRoot, "seo/indexing-decisions.generated.json"), JSON.stringify({
    status: "ready",
    decisions: [{ path: "/ja/example/", action: "preserve" }]
  }), "utf8");
  await run("modernize-site.mjs", ["--write"]);
  await run("generate-site-manifest.mjs", ["--write"]);
  html = await readFile(resolve(temporaryRoot, "ja/example/index.html"), "utf8");
  manifest = JSON.parse(await readFile(resolve(temporaryRoot, "site-manifest.json"), "utf8"));
  assert.match(html, /index,follow/);
  assert.match(html, /hreflang="ja" href="https:\/\/www\.metatecnocq\.com\/ja\/example\/"/);
  assert.equal(manifest.pages[0].sitemap, true);

  console.log("governance_integration_tests_passed scenarios=2");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
