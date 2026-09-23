# Metatecno production release checklist

The remediation branch is intentionally safe to commit without publishing. Complete every item below before merging to `main` or running the edge deployment workflow.

## 1. Human approvals

- Legal reviewer approves the six-language privacy and terms content.
- Native reviewers approve `es-419`, `pt-BR`, French and Russian production copy.
- Keep Arabic `noindex,follow` until a native reviewer separately approves indexing.
- Record only completed reviews in `approvals.json`; never set an approval to bypass CI.
- Engineering and sales approve any product merge before adding it to `worker/redirects-approved.js`.
- Engineering and sales review `seo/geo/core-page-candidates.csv` weekly. Newly assembled evidence pages remain `noindex,follow` until their entries in `seo/content-evidence.json` are marked `approved` with the review date and approved roles.

## 2. Migration evidence gate

- Export 16 months of Search Console search performance, page indexing, Sitemap and external-link evidence before changing frozen locales or approving redirects.
- Add only aggregate page-level signals to `seo/evidence/indexing-evidence.csv`. Never add names, email addresses, phone numbers or inquiry text.
- Complete and approve `seo/evidence/baseline-status.json`; set `site-policy.json` `gscGate.status` to `complete` only after the real exports are reviewed.
- Run `pnpm run seo:indexing:evaluate`. A page with missing evidence must remain `hold`; it can never be automatically changed to `noindex`.
- Review `seo/indexing-decisions.generated.json`, then set the two GSC/indexing approvals in `approvals.json`. Never set an approval only to bypass CI.

## 3. GitHub configuration

- Add repository variables `TURNSTILE_SITE_KEY` and `GA4_MEASUREMENT_ID`.
- Add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Confirm the Cloudflare API token is scoped to the Metatecno zone, Worker deployment, D1 migrations and required Email Service operations only.
- Run the pull-request quality workflow first. It must use a preview build and must not deploy.

## 4. Cloudflare configuration

- Re-authenticate Wrangler or use the scoped CI token; the local login was expired on 2026-08-27.
- Proxy both apex and `www` records through Cloudflare.
- Onboard `metatecnocq.com` to Email Service and confirm SPF, DKIM and DMARC.
- Verify `expresswater025@gmail.com` as the fixed destination and `website-leads@metatecnocq.com` as an allowed sender.
- Create D1 database `metatecno-leads-metadata`, replace the zero UUID in `wrangler.jsonc`, and apply the migration.
- Add Worker secrets `TURNSTILE_SECRET_KEY` and `RATE_LIMIT_SALT`.
- Keep CSP in Report-Only until production reports are clean.

## 5. Release order

1. Run the site release preflight and production build.
2. Publish the static GitHub Pages origin and verify representative six-language pages without changing DNS.
3. Run the Worker release preflight, D1 migration and Worker dry-run.
4. Deploy the Worker routes and confirm canonical redirects and security headers on 2xx, 3xx and 4xx responses.
5. Monitor for 48 hours, then submit the approved Sitemap in Search Console.

## 6. Production acceptance

- Submit one real RFQ in each priority language.
- For every submission, confirm one `MT-...` reference, one accepted API response, Gmail receipt and the matching Email Service Activity Log entry.
- Treat `accepted` as API acceptance only. Record a lead as delivered only after the Email Service log confirms it.
- Confirm replayed Turnstile tokens, invalid origins, honeypot entries, too-fast submissions, oversized requests, rate limits and delivery failures never produce a success response or `generate_lead` event.
- Confirm Google is not requested before consent and that accepted email delivery produces exactly one `generate_lead` event without PII.
- Create Gmail labels `Metatecno/Qualified` and `Metatecno/Spam`; use delivered-and-qualified inquiries as the commercial KPI.
- Start the 30-day KPI baseline only after the six-language production tests pass. Record only aggregate data in `seo/measurement/monthly-metrics.csv` and run `pnpm run verify:kpi`.

## 7. Rollback

- Static rollback: redeploy the previous known-good GitHub Pages commit.
- Edge rollback: deploy the previous known-good Worker version or restore its previous routes.
- Do not rely on a DNS switch as the only rollback mechanism.
