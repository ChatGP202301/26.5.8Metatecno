#!/usr/bin/env node
import { access, readFile, readdir } from "node:fs/promises";
import { basename, extname, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const locales = ["en", "es", "pt", "fr", "ru", "ar"];
const modelRoute = "products/mt-2-7-ion-membrane-electrolyzer/index.html";
const repairRoute = "services/electrolyzer-cell-repair/index.html";
const reviewPages = locales.flatMap((locale) => [
  `${locale}/${modelRoute}`,
  `${locale}/${repairRoute}`,
]);
reviewPages.push("ar/electrolyzer-cells/index.html");

const forbidden = [
  { label: "legacy model HJZ", regex: /HJZ/i },
  { label: "legacy Chinese company name", regex: /泸州[泓鸿]江/ },
  { label: "legacy English company name", regex: /Luzhou[\s_-]*(?:Hongjiang|Hong\s+Jiang)/i },
  { label: "legacy domain", regex: /lzhj\.cn/i },
  { label: "legacy email", regex: /1418434586\s*@\s*qq\.com/i },
  { label: "legacy landline or fax", regex: /0830[\s\-—–]*(?:2701871|2700029)/i },
];
const failures = [];
const affectedTextExtensions = new Set([".html", ".css", ".js", ".mjs", ".json", ".xml", ".txt", ".md"]);
const skipDirectories = new Set([".git", "node_modules", "_site", ".wrangler", ".pnpm-store"]);

function fail(message) {
  failures.push(message);
}

async function walk(current, output = []) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || skipDirectories.has(entry.name)) continue;
    const path = resolve(current, entry.name);
    if (entry.isDirectory()) await walk(path, output);
    else if (entry.isFile()) output.push(path);
  }
  return output;
}

function routeAsset(value) {
  const clean = value.split(/[?#]/, 1)[0];
  if (!clean.startsWith("/") || clean.startsWith("//") || clean.startsWith("/api/")) return null;
  return resolve(root, clean.slice(1));
}

function embeddedMetadata(bytes) {
  const chunks = [];
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
      const marker = bytes[offset + 1];
      if (marker === 0xda || marker === 0xd9) break;
      const length = bytes.readUInt16BE(offset + 2);
      if (length < 2 || offset + 2 + length > bytes.length) break;
      if (marker === 0xe1 || marker === 0xed || marker === 0xfe) chunks.push(bytes.subarray(offset + 4, offset + 2 + length));
      offset += 2 + length;
    }
  } else if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const type = bytes.subarray(offset, offset + 4).toString("ascii");
      const length = bytes.readUInt32LE(offset + 4);
      if (type === "EXIF" || type === "XMP ") chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
      offset += 8 + length + (length % 2);
    }
  }
  return Buffer.concat(chunks);
}

for (const name of reviewPages) {
  const path = resolve(root, name);
  let html;
  try {
    html = await readFile(path, "utf8");
  } catch {
    fail(`${name}: missing review page`);
    continue;
  }
  if (!/<meta\s+name=["']robots["']\s+content=["']noindex,follow["']/i.test(html)) fail(`${name}: must remain noindex,follow`);
  if (!/<link\s+rel=["']canonical["']/i.test(html)) fail(`${name}: missing canonical`);
  if (!/<script\s+type=["']application\/ld\+json["']/.test(html)) fail(`${name}: missing structured data`);
  for (const script of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(script[1]); } catch { fail(`${name}: invalid JSON-LD`); }
  }
  if (name.includes(modelRoute) && !/MT-2\.7/.test(html)) fail(`${name}: MT-2.7 model name missing`);
  if (name.includes(repairRoute)) {
    const process = html.match(/<ol\s+class=["']mt-process["'][^>]*>([\s\S]*?)<\/ol>/i)?.[1] || "";
    const approaches = html.match(/<div\s+class=["']mt-principles["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
    if ((process.match(/<li\b/gi) || []).length !== 9) fail(`${name}: repair workflow must contain nine steps`);
    if ((approaches.match(/<article\b/gi) || []).length !== 3) fail(`${name}: repair page must contain three approaches`);
    if (!/<form\b(?=[^>]*data-contact-form)(?=[^>]*action=["']https:\/\/formsubmit\.co\/expresswater025@gmail\.com["'])/i.test(html)) fail(`${name}: repair inquiry must use the established email delivery route`);
  }
  if (name.startsWith("ar/") && !/<html\b[^>]*lang=["']ar["'][^>]*dir=["']rtl["']/i.test(html)) fail(`${name}: Arabic page must declare RTL`);
  for (const item of forbidden) if (item.regex.test(html)) fail(`${name}: contains ${item.label}`);
  const references = [];
  for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) references.push(match[1]);
  for (const match of html.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(",")) references.push(candidate.trim().split(/\s+/, 1)[0]);
  }
  for (const value of references) {
    const asset = routeAsset(value);
    if (!asset || !/\.(?:avif|css|gif|jpe?g|js|png|svg|webp)$/i.test(asset)) continue;
    try { await access(asset); } catch { fail(`${name}: missing local asset ${value}`); }
  }
}

const files = await walk(root);
for (const path of files) {
  const name = relative(root, path).split("\\").join("/");
  for (const item of forbidden) if (item.regex.test(name)) fail(`${name}: forbidden term in filename`);
  if (!affectedTextExtensions.has(extname(path).toLowerCase())) continue;
  if (name === "tools/verify-mt-content.mjs") continue;
  const source = await readFile(path, "utf8");
  for (const item of forbidden) if (item.regex.test(source)) fail(`${name}: contains ${item.label}`);
}

const imageRoots = [resolve(root, "assets/media")];
let imageCount = 0;
for (const imageRoot of imageRoots) {
  for (const path of await walk(imageRoot, [])) {
    if (!/\.(?:jpe?g|png|webp)$/i.test(path)) continue;
    imageCount += 1;
    const bytes = await readFile(path);
    const metadata = embeddedMetadata(bytes);
    const ascii = metadata.toString("latin1");
    const utf8 = metadata.toString("utf8");
    for (const item of forbidden) {
      if (item.regex.test(ascii) || item.regex.test(utf8)) fail(`${relative(root, path)}: binary metadata contains ${item.label}`);
    }
    if (metadata.length) fail(`${relative(root, path)}: unexpected EXIF/XMP/comment metadata`);
    const file = basename(path);
    if (file.includes("-640.")) {
      const pair = path.replace("-640.", "-1280.");
      try { await access(pair); } catch { fail(`${relative(root, path)}: missing 1280 responsive pair`); }
    }
    if (file.includes("-360.")) {
      const pair = path.replace("-360.", "-720.");
      try { await access(pair); } catch { fail(`${relative(root, path)}: missing 720 responsive pair`); }
    }
  }
}

if (imageCount < 186) fail(`Expected at least 186 governed site image files, found ${imageCount}`);
if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`mt_verification_failed=${failures.length}`);
  process.exit(1);
}
console.log(`mt_verification_passed pages=${reviewPages.length} technical_images=${imageCount}`);
