#!/usr/bin/env python3
"""Read-only static SEO/GEO audit for the Metatecno HTML export."""
import argparse, csv, json, re
from pathlib import Path

FIELDS = ["priority", "type", "page", "reason", "recommendation"]

def value(html, pattern):
    match = re.search(pattern, html, re.I | re.S)
    return match.group(1).strip() if match else ""

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-root", type=Path, required=True)
    parser.add_argument("--langs", required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--include-root-index", action="store_true")
    parser.add_argument("--profile-json", type=Path)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    profile_path = args.profile_json or args.site_root / "seo" / "geo" / "business-profile.json"
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    site_policy = json.loads((args.site_root / "site-policy.json").read_text(encoding="utf-8"))
    draft_locales = set(site_policy.get("draftLocales", []))
    rows = []
    for locale in [item.strip() for item in args.langs.split(",") if item.strip()]:
        folder = "es" if locale == "es-419" else "pt" if locale == "pt-BR" else locale
        page = args.site_root / "index.html" if locale == "en" else args.site_root / folder / "index.html"
        route = "/" if locale == "en" else f"/{folder}/"
        if not page.is_file():
            rows.append(["high", "missing-language-page", route, "Localized homepage is not present in this source checkout.", "Create and review the page before it is added to Sitemap or hreflang."])
            continue
        html = page.read_text(encoding="utf-8")
        if len(re.findall(r"<h1\b", html, re.I)) != 1:
            rows.append(["high", "h1", route, "Page must contain exactly one H1.", "Use one product-intent H1."])
        if not value(html, r"<title>([^<]+)</title>"):
            rows.append(["high", "title", route, "Title is missing.", "Add a localized product-intent title."])
        if not value(html, r'<meta\s+name="description"\s+content="([^"]+)"'):
            rows.append(["medium", "description", route, "Meta description is missing.", "Add a concise localized description."])
        canonical = value(html, r'<link\s+rel="canonical"\s+href="([^"]+)"')
        expected = f"https://www.metatecnocq.com{route}"
        if canonical != expected:
            rows.append(["high", "canonical", route, f"Canonical is {canonical or 'missing'}.", f"Set self canonical to {expected}."])
        code = "ko-KP" if locale == "ko-kp" else locale
        if locale in draft_locales:
            robots = value(html, r'<meta\s+name="robots"\s+content="([^"]+)"')
            if "noindex" not in robots.lower():
                rows.append(["high", "draft-indexing", route, "Draft locale is indexable before native approval.", "Keep the draft noindex,follow and outside Sitemap/hreflang."])
        elif f'hreflang="{code}" href="{expected}"' not in html:
            rows.append(["high", "hreflang", route, "Self hreflang is missing.", "Add the exact language/URL self alternate."])
        if locale == "en":
            visible = re.sub(r"<[^>]+>", " ", html).lower()
            terms = [term.lower() for term in profile.get("coreTerminology", [])]
            if profile.get("brand", {}).get("displayName", "").lower() not in visible or not any(term in visible for term in terms):
                rows.append(["high", "entity-definition", route, "The English homepage lacks the current brand or chlor-alkali product terminology.", "Use the repository business profile; do not use the retired enamel/solar terminology."])
            for term in profile.get("prohibitedLegacyTerminology", []):
                if term.lower() in visible:
                    rows.append(["high", "legacy-business-term", route, f"Retired terminology remains: {term}.", "Remove or substantiate the term before publication."])
    keyword_map = args.site_root / "seo" / "keyword-page-map.csv"
    if keyword_map.is_file():
        seen = set()
        with keyword_map.open(encoding="utf-8-sig", newline="") as handle:
            for item in csv.DictReader(handle):
                key = (item.get("language", ""), item.get("search_engine", ""), item.get("page_intent", ""), item.get("keyword", ""))
                target = item.get("target_path", "").strip("/")
                if not item.get("keyword"):
                    rows.append(["high", "keyword-map", item.get("target_path", ""), "Keyword mapping row has no keyword.", "Add the primary keyword."])
                elif key in seen:
                    rows.append(["high", "keyword-cannibalization", item.get("target_path", ""), "Same language, search engine, intent and keyword appear more than once.", "Keep one target per keyword/intention."])
                seen.add(key)
                if target and not (args.site_root / target / "index.html").is_file():
                    rows.append(["high", "keyword-target", item.get("target_path", ""), "Mapped target is not present in source.", "Map only to an existing page or create and review the page first."])
    with (args.out / "static-audit-tasks.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle); writer.writerow(FIELDS); writer.writerows(rows)
    (args.out / "static-audit-summary.md").write_text(f"# Static Audit\n\n- Languages checked: `{args.langs}`\n- Business profile: `{profile_path}`\n- Findings: `{len(rows)}`\n- Website modified: `false`\n", encoding="utf-8")

if __name__ == "__main__": main()
