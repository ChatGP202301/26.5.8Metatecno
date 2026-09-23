#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const EXCLUDED = new Set([".git", "audit-2026-08-10", "node_modules"]);
const bannerText = {
  de: ["Wir verwenden notwendige Cookies und Analyse-Cookies nur nach Ihrer Einwilligung.", "Alle akzeptieren", "Nicht notwendige ablehnen"],
  en: ["We use essential cookies for the website and optional analytics cookies only after consent.", "Accept All", "Reject Non-Essential"],
  es: ["Utilizamos cookies esenciales y cookies de análisis opcionales solo después de su consentimiento.", "Aceptar todo", "Rechazar las no esenciales"],
  fr: ["Nous utilisons les cookies nécessaires et les cookies d’analyse facultatifs uniquement après consentement.", "Tout accepter", "Refuser les cookies facultatifs"],
  it: ["Utilizziamo cookie essenziali e cookie analitici opzionali solo dopo il consenso.", "Accetta tutto", "Rifiuta i non essenziali"],
  ru: ["Мы используем необходимые cookie и необязательные аналитические cookie только после согласия.", "Принять все", "Отклонить необязательные"]
};

function parseArgs(argv) {
  let root = process.cwd();
  let write = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root") {
      root = resolve(argv[++index] || "");
    } else if (argument === "--write") {
      write = true;
    } else if (argument === "--check") {
      write = false;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return { root: resolve(root), write };
}

async function htmlFiles(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || (entry.isDirectory() && EXCLUDED.has(entry.name))) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) files.push(path);
    }
  }
  await visit(root);
  return files.sort();
}

function relativeAsset(file, root, name) {
  return relative(dirname(file), resolve(root, "assets", name)).split(sep).join("/");
}

function languageFor(file, root) {
  const label = relative(root, file).split(sep).join("/");
  return label.includes("/") ? label.split("/")[0].toLowerCase() : "en";
}

function privacyHref(file, root) {
  const language = languageFor(file, root);
  return existsSync(resolve(root, language, "privacy-policy", "index.html")) ? `/${language}/privacy-policy/` : "/en/privacy-policy/";
}

function ensurePrivacyLink(html, href) {
  const footerPattern = /<footer\b[^>]*class=(['"])[^'"]*\bsite-footer\b[^'"]*\1[^>]*>[\s\S]*?<\/footer>/i;
  if (!footerPattern.test(html)) {
    return html.replace(/<\/body>/i, `<footer class="site-footer"><nav><a href="${href}">Privacy Policy</a></nav></footer></body>`);
  }
  return html.replace(footerPattern, (footer) =>
    /<nav\b/i.test(footer) ? footer.replace(/<nav>([\s\S]*?)<\/nav>/i, (nav) => {
      if (/href=(['"])[^'"]*\/privacy-policy\/\1/i.test(nav)) return nav;
      return nav.replace(/<span>([^<]+)<\/span>/i, `<a href="${href}">$1</a>`);
    }) : footer.replace(/<\/footer>/i, `<nav><a href="${href}">Privacy Policy</a></nav></footer>`)
  );
}

function genericBanner(language) {
  const [message, accept, reject] = bannerText[language] || bannerText.en;
  return `<div class="cookie-banner" data-cookie-banner hidden>\n  <p>${message}</p>\n  <div>\n    <button type="button" data-cookie-accept>${accept}</button>\n    <button type="button" data-cookie-reject>${reject}</button>\n  </div>\n</div>`;
}

function expectedHtml(html, file, root) {
  const managedScript = /\s*<script\b[^>]*\bsrc=(['"])[^'"]*assets\/(?:cookie-consent|analytics)\.js\1[^>]*><\/script>/gi;
  let next = html.replace(managedScript, "");
  if (!/\bdata-cookie-banner\b/i.test(next)) {
    next = next.replace(/<\/body>/i, `${genericBanner(languageFor(file, root))}\n</body>`);
  }
  next = ensurePrivacyLink(next, privacyHref(file, root));
  const cookie = relativeAsset(file, root, "cookie-consent.js");
  const analytics = relativeAsset(file, root, "analytics.js");
  const scripts = `<script src="${cookie}" defer></script>\n<script src="${analytics}" defer></script>`;
  return next.replace(/<\/body>/i, `${scripts}\n</body>`);
}

async function main() {
  const { root, write } = parseArgs(process.argv.slice(2));
  const files = await htmlFiles(root);
  const changed = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const expected = expectedHtml(source, file, root);
    if (source === expected) continue;
    changed.push(relative(root, file).split(sep).join("/"));
    if (write) await writeFile(file, expected, "utf8");
  }
  const mode = write ? "updated" : "noncompliant";
  console.log(`Analytics installer: ${files.length} HTML pages; ${changed.length} ${mode}.`);
  if (!write && changed.length) {
    console.error(changed.slice(0, 50).join("\n"));
    if (changed.length > 50) console.error(`... ${changed.length - 50} more`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
