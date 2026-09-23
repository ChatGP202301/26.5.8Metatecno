# Metatecno production implementation

This repository keeps the existing static URLs and GitHub Pages origin. Eleventy produces `_site`; a zone Worker normalizes URLs, adds security headers, protects `/api/lead`, sends accepted RFQs to the fixed verified Gmail destination, and records non-PII delivery metadata for 90 days.

## Required production configuration

1. In GitHub Actions variables, set `TURNSTILE_SITE_KEY` and `GA4_MEASUREMENT_ID`.
2. In Cloudflare, proxy the apex and `www` DNS records, onboard `metatecnocq.com` to Email Service, and verify `expresswater025@gmail.com` as the allowed destination.
3. Create D1 database `metatecno-leads-metadata`, replace the zero UUID in `wrangler.jsonc`, and apply `worker/migrations/0001_leads.sql`.
4. Add Worker secrets `TURNSTILE_SECRET_KEY` and `RATE_LIMIT_SALT`. Add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
5. Deploy the Worker manually after the static Pages deployment is healthy. Keep CSP in Report-Only until browser and production violation review is clean.
6. Record completed legal and native-language reviews in `approvals.json`; production builds intentionally stop while required approvals are false.

Production builds fail closed when the Turnstile site key or real GA4 measurement ID is absent. The Worker also fails closed in production when Turnstile, D1, or Email Service bindings are missing.

## Verified local baseline (updated 2026-08-27)

- Source and preview verification: 2,669 HTML pages, 2,049 same-origin RFQ forms, 2,618 Sitemap URLs.
- Internal `/index.html` links, FormSubmit references, and public fixed Gmail destinations: zero.
- Worker unit tests cover request rejection, rate limiting, accepted delivery, failed delivery without a success response, daily retention cleanup, retained records, missing D1 and idempotent cleanup.
- Representative browser checks: English home, RFQ, and DD350 product pages; semantic landmarks, social cards, disclaimers, responsive imagery, and mobile overflow were checked. A progressive-enhancement mobile menu was added after the 390px review found a horizontally hidden final navigation item.
- Cloudflare Worker dry-run bundle: successful. No production deploy, DNS switch, email, GA4, or Search Console mutation was performed.
- The Worker runs a daily 02:17 UTC retention task. It deletes inquiry metadata after 90 days and removes expired rate-limit rows even when no new inquiry arrives.
- A successful Workers Email binding call returns a message ID, so the public API reports `accepted`, not `delivered`. Final delivery or bounce status must be confirmed in Cloudflare Email Service Activity Log.

Cloudflare CLI authentication was expired at the 2026-08-27 handoff. No attempt was made to log in, upload secrets or deploy. Follow `RELEASE_CHECKLIST.md` when the external approvals and accounts are ready.

## External acceptance steps

- Submit one real RFQ from each priority language, confirm a unique `MT-...` reference, Gmail receipt, and Email Service delivery log.
- Create Gmail labels `Metatecno/Qualified` and `Metatecno/Spam`; use Qualified as the commercial north-star count.
- Export 16 months of Search Console page/query data and backlink evidence before changing indexability of frozen non-priority locales.
- Review `seo/content-consolidation-candidates.csv`; copy only approved mappings into `worker/redirects-approved.js`. Candidate rows are deliberately not redirected automatically because different product images, models or backlinks may require separate pages.
- Native-review Arabic and legal-review translated privacy/terms content before moving Arabic drafts into the indexable manifest.
