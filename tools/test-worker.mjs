#!/usr/bin/env node
import assert from "node:assert/strict";
import worker from "../worker/index.js";

const originalFetch = globalThis.fetch;
let turnstileSuccess = true;
let sentMessage;

globalThis.fetch = async (input) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.includes("challenges.cloudflare.com/turnstile")) {
    return Response.json(turnstileSuccess
      ? { success: true, hostname: "www.metatecnocq.com", action: "contact_form", "error-codes": [] }
      : { success: false, "error-codes": ["timeout-or-duplicate"] });
  }
  return new Response("origin", { status: 200, headers: { "Content-Type": "text/html" } });
};

function database(options = {}) {
  const state = {
    leads: [...(options.leads || [])],
    rateLimits: [...(options.rateLimits || [])],
    statements: []
  };
  return {
    state,
    prepare(sql) {
      return {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() {
          if (!sql.includes("SELECT request_count")) return null;
          return options.rateCount ? { request_count: options.rateCount } : null;
        },
        async run() {
          state.statements.push({ sql, args: [...this.args] });
          let changes = 0;
          if (sql.startsWith("DELETE FROM leads")) {
            const before = state.leads.length;
            state.leads = state.leads.filter((row) => row.purge_after >= this.args[0]);
            changes = before - state.leads.length;
          } else if (sql.startsWith("DELETE FROM rate_limits")) {
            const before = state.rateLimits.length;
            state.rateLimits = state.rateLimits.filter((row) => row.expires_at >= this.args[0]);
            changes = before - state.rateLimits.length;
          } else if (sql.startsWith("INSERT INTO leads")) {
            state.leads.push({ lead_id: this.args[0], purge_after: this.args[7] });
            changes = 1;
          }
          return { success: true, meta: { changes } };
        }
      };
    }
  };
}

function environment(options = {}) {
  return {
    ENVIRONMENT: "production",
    TURNSTILE_SECRET_KEY: "test-secret",
    RATE_LIMIT_SALT: "test-rate-salt",
    LEAD_DESTINATION: "expresswater025@gmail.com",
    LEAD_SENDER: "website-leads@metatecnocq.com",
    LEADS_DB: options.omitDb ? undefined : (options.db || database({ rateCount: options.rateCount || 0 })),
    LEAD_EMAIL: {
      async send(message) {
        sentMessage = message;
        if (options.emailFailure) throw Object.assign(new Error("delivery failed"), { code: "E_DELIVERY_FAILED" });
        return { messageId: "email-message-1" };
      }
    }
  };
}

function context() {
  const pending = [];
  return { pending, waitUntil(promise) { pending.push(promise); } };
}

function validPayload(overrides = {}) {
  return {
    locale: "en",
    sourcePath: "/en/contact/",
    name: "Test Buyer",
    company: "Example Chemical",
    email: "buyer@example.com",
    phone: "+1 202 555 0199",
    product: "DD350 anode gasket",
    medium: "brine",
    temperature: "85 C",
    pressure: "ambient",
    quantity: "20",
    message: "Please review our operating conditions and drawing.",
    detectedCountry: "United States",
    websiteUrl: "",
    startedAt: Date.now() - 5000,
    turnstileToken: "test-token",
    ...overrides
  };
}

async function post(payload, env = environment()) {
  const ctx = context();
  const response = await worker.fetch(new Request("https://www.metatecnocq.com/api/lead", {
    method: "POST",
    headers: { Origin: "https://www.metatecnocq.com", "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }), env, ctx);
  await Promise.all(ctx.pending);
  return response;
}

const indexRedirect = await worker.fetch(new Request("https://www.metatecnocq.com/en/index.html?x=1"), environment(), context());
assert.equal(indexRedirect.status, 301);
assert.equal(indexRedirect.headers.get("location"), "https://www.metatecnocq.com/?x=1");
assert.equal(indexRedirect.headers.get("x-content-type-options"), "nosniff");

const englishRedirect = await worker.fetch(new Request("https://www.metatecnocq.com/en/"), environment(), context());
assert.equal(englishRedirect.status, 301);
assert.equal(englishRedirect.headers.get("location"), "https://www.metatecnocq.com/");

let response = await post(validPayload({ email: "invalid" }));
assert.equal(response.status, 400);

turnstileSuccess = false;
response = await post(validPayload());
assert.equal(response.status, 403);
turnstileSuccess = true;

response = await post(validPayload(), environment({ rateCount: 8 }));
assert.equal(response.status, 429);

response = await post(validPayload());
assert.equal(response.status, 200);
const accepted = await response.json();
assert.equal(accepted.ok, true);
assert.equal(accepted.deliveryStatus, "accepted");
assert.match(accepted.leadId, /^MT-\d{8}-[A-Z0-9]{10}$/);
assert.equal(sentMessage.replyTo.email, "buyer@example.com");
assert.match(sentMessage.subject, /^\[Website RFQ\]\[MT-/);
assert.ok(!JSON.stringify(accepted).includes("buyer@example.com"));

response = await post(validPayload(), environment({ emailFailure: true }));
assert.equal(response.status, 502);
assert.deepEqual(await response.json(), { ok: false, error: "delivery_failed" });

const scheduledSeconds = Math.floor(Date.UTC(2026, 7, 27, 2, 17, 0) / 1000);
const retentionDb = database({
  leads: [
    { lead_id: "expired-lead", purge_after: scheduledSeconds - 1 },
    { lead_id: "retained-lead", purge_after: scheduledSeconds + 1 }
  ],
  rateLimits: [
    { rate_key: "expired-rate", expires_at: scheduledSeconds - 1 },
    { rate_key: "retained-rate", expires_at: scheduledSeconds + 1 }
  ]
});
const originalInfo = console.info;
console.info = () => {};
await worker.scheduled({ scheduledTime: scheduledSeconds * 1000, cron: "17 2 * * *" }, { LEADS_DB: retentionDb }, context());
assert.deepEqual(retentionDb.state.leads.map((row) => row.lead_id), ["retained-lead"]);
assert.deepEqual(retentionDb.state.rateLimits.map((row) => row.rate_key), ["retained-rate"]);

await worker.scheduled({ scheduledTime: scheduledSeconds * 1000, cron: "17 2 * * *" }, { LEADS_DB: retentionDb }, context());
assert.deepEqual(retentionDb.state.leads.map((row) => row.lead_id), ["retained-lead"]);
assert.deepEqual(retentionDb.state.rateLimits.map((row) => row.rate_key), ["retained-rate"]);
console.info = originalInfo;

await assert.rejects(
  worker.scheduled({ scheduledTime: scheduledSeconds * 1000, cron: "17 2 * * *" }, {}, context()),
  /leads_db_unconfigured/
);

globalThis.fetch = originalFetch;
console.log("worker_tests_passed scenarios=11");
