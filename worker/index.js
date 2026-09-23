import { APPROVED_REDIRECTS } from "./redirects-approved.js";

const ORIGIN = "https://www.metatecnocq.com";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_REQUESTS_PER_HOUR = 8;
const RETENTION_SECONDS = 90 * 24 * 60 * 60;
const RATE_WINDOW_SECONDS = 60 * 60;

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy-Report-Only": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://analytics.google.com; img-src 'self' data: https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests"
};

function json(data, status = 200, extraHeaders = {}) {
  return secure(new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders }
  }));
}

function secure(response) {
  const next = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) next.headers.set(name, value);
  return next;
}

function redirect(url, status = 301) {
  return secure(Response.redirect(url, status));
}

function canonicalRedirect(request) {
  const url = new URL(request.url);
  let changed = false;
  if (url.hostname === "metatecnocq.com") {
    url.hostname = "www.metatecnocq.com";
    changed = true;
  }
  if (url.pathname.endsWith("/index.html")) {
    url.pathname = url.pathname.slice(0, -"index.html".length);
    changed = true;
  }
  if (url.pathname === "/en/") {
    url.pathname = "/";
    changed = true;
  }
  if (APPROVED_REDIRECTS[url.pathname]) {
    url.pathname = APPROVED_REDIRECTS[url.pathname];
    changed = true;
  }
  return changed ? url : null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function clean(value, maximum) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maximum);
}

function multiline(value, maximum) {
  return String(value ?? "").replace(/\r/g, "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ").trim().slice(0, maximum);
}

function validate(input) {
  const data = {
    locale: clean(input.locale, 15),
    sourcePath: clean(input.sourcePath, 180),
    name: clean(input.name, 100),
    company: clean(input.company, 140),
    email: clean(input.email, 254).toLowerCase(),
    phone: clean(input.phone, 30),
    product: clean(input.product, 160),
    medium: clean(input.medium, 120),
    temperature: clean(input.temperature, 80),
    pressure: clean(input.pressure, 80),
    quantity: clean(input.quantity, 80),
    message: multiline(input.message, 5000),
    detectedCountry: clean(input.detectedCountry, 80),
    websiteUrl: clean(input.websiteUrl, 200),
    turnstileToken: clean(input.turnstileToken, 2048),
    startedAt: Number(input.startedAt || 0)
  };
  const errors = [];
  if (!data.name) errors.push("name");
  if (!data.company) errors.push("company");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("email");
  if (!/^\+[0-9 ()-]{7,24}$/.test(data.phone)) errors.push("phone");
  if (data.message.length < 12) errors.push("message");
  if (!data.sourcePath.startsWith("/") || data.sourcePath.includes("..")) errors.push("sourcePath");
  if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(data.locale)) errors.push("locale");
  if (!data.turnstileToken) errors.push("turnstileToken");
  if (data.websiteUrl) errors.push("spam");
  const elapsed = Date.now() - data.startedAt;
  if (!Number.isFinite(elapsed) || elapsed < 2500 || elapsed > 2 * 60 * 60 * 1000) errors.push("timing");
  if ((data.message.match(/https?:\/\/|www\./gi) || []).length > 2) errors.push("links");
  return { data, errors };
}

async function parseBody(request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) throw Object.assign(new Error("body_too_large"), { status: 413 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw Object.assign(new Error("body_too_large"), { status: 413 });
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return JSON.parse(raw);
  if (contentType.includes("application/x-www-form-urlencoded")) return Object.fromEntries(new URLSearchParams(raw));
  throw Object.assign(new Error("unsupported_media_type"), { status: 415 });
}

async function verifyTurnstile(data, request, env) {
  const secret = env.TURNSTILE_SECRET_KEY || (env.ENVIRONMENT === "production" ? "" : "1x0000000000000000000000000000000AA");
  if (!secret) return { success: false, reason: "turnstile_unconfigured" };
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", data.turnstileToken);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.set("remoteip", ip);
  form.set("idempotency_key", crypto.randomUUID());
  let response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  } catch {
    return { success: false, reason: "turnstile_unavailable" };
  }
  if (!response.ok) return { success: false, reason: "turnstile_unavailable" };
  const result = await response.json();
  if (!result.success) return { success: false, reason: (result["error-codes"] || ["turnstile_rejected"])[0] };
  if (env.ENVIRONMENT === "production" && result.hostname !== "www.metatecnocq.com") return { success: false, reason: "turnstile_hostname" };
  if (env.ENVIRONMENT === "production" && result.action !== "contact_form") return { success: false, reason: "turnstile_action" };
  return { success: true };
}

async function hashRateKey(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (env.ENVIRONMENT === "production" && !env.RATE_LIMIT_SALT) throw new Error("rate_limit_unconfigured");
  const salt = env.RATE_LIMIT_SALT || "preview-only";
  const material = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function enforceRateLimit(request, env) {
  if (!env.LEADS_DB) return env.ENVIRONMENT === "production" ? { allowed: false, unavailable: true } : { allowed: true };
  const now = Math.floor(Date.now() / 1000);
  const key = await hashRateKey(request, env);
  await env.LEADS_DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(now).run();
  const current = await env.LEADS_DB.prepare("SELECT request_count FROM rate_limits WHERE rate_key = ?").bind(key).first();
  if (current && current.request_count >= MAX_REQUESTS_PER_HOUR) return { allowed: false, unavailable: false };
  await env.LEADS_DB.prepare("INSERT INTO rate_limits (rate_key, request_count, expires_at) VALUES (?, 1, ?) ON CONFLICT(rate_key) DO UPDATE SET request_count = request_count + 1")
    .bind(key, now + RATE_WINDOW_SECONDS).run();
  return { allowed: true };
}

async function purgeExpiredMetadata(env, now = Math.floor(Date.now() / 1000)) {
  if (!env.LEADS_DB) throw new Error("leads_db_unconfigured");
  const leads = await env.LEADS_DB.prepare("DELETE FROM leads WHERE purge_after < ?").bind(now).run();
  const rateLimits = await env.LEADS_DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(now).run();
  return {
    leadsDeleted: Number(leads?.meta?.changes || 0),
    rateLimitsDeleted: Number(rateLimits?.meta?.changes || 0)
  };
}

function leadId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const token = [...bytes].map((value) => value.toString(36).padStart(2, "0")).join("").slice(0, 10).toUpperCase();
  return `MT-${date}-${token}`;
}

function emailContent(data, id) {
  const rows = [
    ["Reference", id], ["Language", data.locale], ["Source page", data.sourcePath], ["Name", data.name],
    ["Company", data.company], ["Email", data.email], ["Phone", data.phone], ["Detected country", data.detectedCountry],
    ["Product / model", data.product], ["Medium", data.medium], ["Temperature", data.temperature],
    ["Pressure", data.pressure], ["Quantity", data.quantity]
  ];
  const text = `${rows.map(([key, value]) => `${key}: ${value || "-"}`).join("\n")}\n\nMessage:\n${data.message}`;
  const htmlRows = rows.map(([key, value]) => `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(key)}</th><td style="padding:6px 0">${escapeHtml(value || "-")}</td></tr>`).join("");
  const html = `<h1>Metatecno website RFQ</h1><table>${htmlRows}</table><h2>Message</h2><p style="white-space:pre-wrap">${escapeHtml(data.message)}</p><p>Reply directly to this email to contact the enquirer.</p>`;
  return { text, html };
}

async function writeLeadMetadata(env, record) {
  if (!env.LEADS_DB) return;
  const now = Math.floor(Date.now() / 1000);
  await env.LEADS_DB.prepare("INSERT INTO leads (lead_id, message_id, created_at, locale, source_path, delivery_status, error_code, purge_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(record.leadId, record.messageId || null, now, record.locale, record.sourcePath, record.deliveryStatus, record.errorCode || null, now + RETENTION_SECONDS).run();
  await purgeExpiredMetadata(env, now);
}

async function handleLead(request, env, context) {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "POST" });
  const origin = request.headers.get("Origin");
  if (env.ENVIRONMENT === "production" && origin !== ORIGIN) return json({ ok: false, error: "origin_rejected" }, 403);
  let input;
  try { input = await parseBody(request); }
  catch (error) { return json({ ok: false, error: error.message === "body_too_large" ? "body_too_large" : "invalid_request" }, error.status || 400); }
  const { data, errors } = validate(input);
  if (errors.length) return json({ ok: false, error: "validation_failed", fields: errors.filter((item) => !["spam", "timing", "links"].includes(item)) }, 400);
  const rate = await enforceRateLimit(request, env).catch(() => ({ allowed: false, unavailable: true }));
  if (!rate.allowed) return json({ ok: false, error: rate.unavailable ? "service_unavailable" : "rate_limited" }, rate.unavailable ? 503 : 429);
  const turnstile = await verifyTurnstile(data, request, env);
  if (!turnstile.success) return json({ ok: false, error: "security_check_failed" }, turnstile.reason === "turnstile_unavailable" ? 503 : 403);
  if (!env.LEAD_EMAIL) return json({ ok: false, error: "delivery_unavailable" }, 503);

  const id = leadId();
  const subjectPath = data.sourcePath.replace(/[^a-zA-Z0-9/_-]/g, "").slice(0, 80);
  const content = emailContent(data, id);
  try {
    const result = await env.LEAD_EMAIL.send({
      to: env.LEAD_DESTINATION || "expresswater025@gmail.com",
      from: { email: env.LEAD_SENDER || "website-leads@metatecnocq.com", name: "Metatecno Website" },
      replyTo: { email: data.email, name: data.name },
      subject: `[Website RFQ][${id}][${data.locale}][${subjectPath}]`,
      text: content.text,
      html: content.html,
      headers: { "X-Metatecno-Lead-ID": id }
    });
    context.waitUntil(writeLeadMetadata(env, { leadId: id, messageId: result.messageId, locale: data.locale, sourcePath: data.sourcePath, deliveryStatus: "accepted" }));
    return json({ ok: true, leadId: id, deliveryStatus: "accepted" }, 200);
  } catch (error) {
    const code = clean(error?.code || "delivery_failed", 80);
    console.error("lead_delivery_failed", id, code);
    context.waitUntil(writeLeadMetadata(env, { leadId: id, locale: data.locale, sourcePath: data.sourcePath, deliveryStatus: "failed", errorCode: code }));
    return json({ ok: false, error: "delivery_failed" }, code === "E_RATE_LIMIT_EXCEEDED" ? 429 : 502);
  }
}

function branded404() {
  const body = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,follow"><title>Page not found | Metatecno</title><style>body{margin:0;font:18px/1.6 system-ui;color:#122033;background:#f5f7fa;display:grid;min-height:100vh;place-items:center}.card{max-width:640px;margin:24px;padding:42px;border:1px solid #d7e1eb;border-radius:12px;background:white}a{color:#087371;font-weight:800}</style><main class="card"><p>404</p><h1>Page not found</h1><p>The requested page may have moved. Continue to the Metatecno homepage or request a technical quotation.</p><p><a href="/">Homepage</a> · <a href="/en/contact/">Request a quotation</a></p></main></html>`;
  return secure(new Response(body, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" } }));
}

function applyCache(response, pathname) {
  const next = secure(response);
  const contentType = next.headers.get("content-type") || "";
  if (contentType.includes("text/html")) next.headers.set("Cache-Control", "public, max-age=0, s-maxage=600, stale-while-revalidate=86400");
  else if (/\/assets\/[^/]+\.[a-f0-9]{10}\.(?:css|js)$/.test(pathname)) next.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  else if (/\/assets\/media\//.test(pathname)) next.headers.set("Cache-Control", "public, max-age=2592000, stale-while-revalidate=86400");
  return next;
}

export default {
  async fetch(request, env, context) {
    const normalized = canonicalRedirect(request);
    if (normalized) return redirect(normalized.href);
    const url = new URL(request.url);
    if (url.pathname === "/api/lead") return handleLead(request, env, context);
    const originResponse = await fetch(request);
    if (originResponse.status === 404 && request.headers.get("Accept")?.includes("text/html")) return branded404();
    return applyCache(originResponse, url.pathname);
  },

  async scheduled(controller, env) {
    const scheduledTime = Number(controller?.scheduledTime);
    const now = Number.isFinite(scheduledTime) ? Math.floor(scheduledTime / 1000) : Math.floor(Date.now() / 1000);
    const result = await purgeExpiredMetadata(env, now);
    console.info("metadata_retention_purge", {
      scheduledAt: now,
      leadsDeleted: result.leadsDeleted,
      rateLimitsDeleted: result.rateLimitsDeleted
    });
  }
};
