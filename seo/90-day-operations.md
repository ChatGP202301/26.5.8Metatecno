# SEO/GEO operating runbook

## Days 1–14: migration evidence

1. Export 16 months of Search Console search performance, page indexing, Sitemap and external-link data.
2. Prepare only aggregated qualified-lead counts. Do not export names, email addresses, phone numbers or inquiry text into this repository.
3. Complete `seo/evidence/baseline-status.json` and `seo/evidence/indexing-evidence.csv`.
4. Run `pnpm run seo:indexing:evaluate`. Missing evidence produces `hold`; it can never produce `noindex`.
5. Engineering and sales review the candidate English pages every week. Legal and native-language review remain separate approvals.

## Days 15–30: release and baseline

1. Complete the production values and human approvals in `RELEASE_CHECKLIST.md`.
2. Run the site and Worker release preflights. A failure is expected until real credentials, evidence and approvals exist.
3. Deploy only after explicit production authorization. Test one real RFQ in each priority language.
4. Record accepted, delivered and Qualified separately. Start the 30-day baseline only after production validation.

## Days 31–60: verified content

1. Use GSC and sales evidence to finalize the 12-page candidate list.
2. Review the English source against `seo/geo/brand-facts.md`.
3. Change a page in `seo/content-evidence.json` to `approved` only after every required role has signed off.
4. Translate only the approved English source. Arabic remains `noindex,follow` until native and RTL approval.

## Days 61–90: consolidation and learning

1. Review exact-duplicate candidates with engineering, sales, image and GSC evidence.
2. Add only approved one-to-one mappings to `worker/redirects-approved.js`.
3. Record aggregate monthly metrics in `seo/measurement/monthly-metrics.csv` and run the KPI verifier.
4. Review outcomes on days 30, 60 and 90. AI answer sampling is diagnostic and must retain the answer, source, environment and date; it is not a substitute for Qualified leads.

No platform is guaranteed to cite a page. This work improves discoverability, verifiability and extractability; it does not guarantee AI citations.
