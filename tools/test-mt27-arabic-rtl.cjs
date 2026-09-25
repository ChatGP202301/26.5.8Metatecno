const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { readFile, stat } = require("node:fs/promises");
const { extname, resolve, sep } = require("node:path");

const playwrightPath = process.env.MT27_PLAYWRIGHT_MODULE;
if (!playwrightPath) throw new Error("MT27_PLAYWRIGHT_MODULE must point to the pinned Playwright package.");
const { chromium } = require(playwrightPath);
const root = resolve(process.env.MT27_SITE_ROOT || process.cwd());
const artifacts = resolve(process.env.MT27_RTL_ARTIFACT_DIR || "/tmp/mt27-arabic-rtl");
const pages = [
  ["product", "/ar/products/mt-2-7-ion-membrane-electrolyzer/"],
  ["repair", "/ar/services/electrolyzer-cell-repair/"]
];
const viewports = [
  ["desktop", { width: 1440, height: 1000 }],
  ["narrow", { width: 390, height: 844 }]
];
const mime = {
  ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".woff2": "font/woff2"
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(`${root}${sep}`)) throw new Error("Path escaped site root.");
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const body = await readFile(file);
    response.writeHead(200, { "content-type": mime[extname(file).toLowerCase()] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

async function main() {
  const { mkdir } = require("node:fs/promises");
  await mkdir(artifacts, { recursive: true });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.MT27_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.MT27_CHROMIUM_EXECUTABLE_PATH }
        : {})
    });
    for (const [pageName, path] of pages) {
      for (const [viewportName, viewport] of viewports) {
        const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
        const origin = `http://127.0.0.1:${address.port}`;
        await page.route("**/*", (route) => route.request().url().startsWith(origin) ? route.continue() : route.abort());
        const response = await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded" });
        assert.equal(response?.status(), 200, `${path} must return HTTP 200`);
        await page.evaluate(async () => {
          const height = window.innerHeight;
          for (let y = 0; y < document.documentElement.scrollHeight; y += height) {
            window.scrollTo(0, y);
            await new Promise((resolveFrame) => requestAnimationFrame(() => setTimeout(resolveFrame, 40)));
          }
          window.scrollTo(0, 0);
          await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame));
        });
        const images = await page.locator("img").all();
        for (const image of images) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate((element) => element.decode());
          const naturalWidth = await image.evaluate((element) => element.naturalWidth);
          assert.ok(naturalWidth > 0, `${path} contains an image that did not load: ${await image.getAttribute("src")}`);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.evaluate(() => document.fonts.ready);
        const state = await page.evaluate(() => {
          const rootElement = document.documentElement;
          const body = document.body;
          const heading = document.querySelector("main h1");
          return {
            lang: rootElement.lang,
            dir: rootElement.dir,
            bodyDirection: getComputedStyle(body).direction,
            title: heading?.innerText?.trim() || "",
            documentWidth: rootElement.scrollWidth,
            bodyWidth: body.scrollWidth,
            viewportWidth: window.innerWidth,
            visibleMain: Boolean(document.querySelector("main")?.getClientRects().length),
            visibleHeader: Boolean(document.querySelector("header")?.getClientRects().length),
            visibleFooter: Boolean(document.querySelector("footer")?.getClientRects().length)
          };
        });
        assert.equal(state.lang, "ar", `${path} must declare lang=ar`);
        assert.equal(state.dir, "rtl", `${path} must declare dir=rtl`);
        assert.equal(state.bodyDirection, "rtl", `${path} body must render RTL`);
        assert.ok(state.title.length > 3, `${path} must expose a meaningful main heading`);
        assert.ok(state.visibleMain && state.visibleHeader && state.visibleFooter, `${path} main landmarks must render`);
        assert.ok(state.documentWidth <= state.viewportWidth + 1, `${path} document overflows horizontally at ${viewportName}: ${JSON.stringify(state)}`);
        assert.ok(state.bodyWidth <= state.viewportWidth + 1, `${path} body overflows horizontally at ${viewportName}: ${JSON.stringify(state)}`);
        await page.screenshot({ path: resolve(artifacts, `${pageName}-${viewportName}.png`), fullPage: true });
        console.log(`mt27_arabic_rtl_pass page=${pageName} viewport=${viewportName} lang=${state.lang} dir=${state.dir} body=${state.bodyDirection} width=${state.documentWidth}/${state.viewportWidth} heading=${JSON.stringify(state.title)}`);
        await page.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
