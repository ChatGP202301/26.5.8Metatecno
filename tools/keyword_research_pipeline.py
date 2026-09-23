#!/usr/bin/env python3
"""Local-only keyword mapper; never invents demand metrics."""
import argparse, csv, json
from pathlib import Path

def main():
    p = argparse.ArgumentParser(); p.add_argument("--out", type=Path, required=True); p.add_argument("--seed-csv", type=Path, required=True); p.add_argument("--profile-json", type=Path); p.add_argument("--language", default="generic"); p.add_argument("--country", default="generic"); p.add_argument("--page-target"); p.add_argument("--category-target"); p.add_argument("--market-profile", default="generic"); p.add_argument("--google-ads-csv"); p.add_argument("--gsc-csv"); a = p.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    with a.seed_csv.open(encoding="utf-8-sig", newline="") as f: rows = list(csv.DictReader(f))
    selected = [r for r in rows if r.get("language") == a.language] or rows
    with (a.out / "keyword-page-map.csv").open("w", encoding="utf-8-sig", newline="") as f:
        cols = ["language","country_scope","page_intent","target_path","primary_keyword","long_tail_keywords","search_engine","search_volume","rank","ctr","clicks","organic_difficulty","evidence_status"]
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader()
        for r in selected:
            w.writerow({"language":r.get("language"),"country_scope":r.get("country_scope","generic"),"page_intent":r.get("page_intent"),"target_path":r.get("target_path"),"primary_keyword":r.get("primary_keyword"),"long_tail_keywords":r.get("long_tail_keywords"),"search_engine":"yandex" if a.language == "ru" else "google","search_volume":"no-data","rank":"no-data","ctr":"no-data","clicks":"no-data","organic_difficulty":"no-data","evidence_status":r.get("evidence_status")})
    (a.out / "market-profile.json").write_text(json.dumps({"language":a.language,"country":a.country,"market_profile":a.market_profile,"search_engine":"yandex" if a.language == "ru" else "google"}, ensure_ascii=False, indent=2), encoding="utf-8")
    (a.out / "metrics-status.json").write_text(json.dumps({"google_ads":"no-data","gsc":"no-data"}, indent=2), encoding="utf-8")
    (a.out / "summary.md").write_text("# Local Keyword Mapping\n\n- Metrics: `no-data`\n- Network used: `false`\n- Website modified: `false`\n", encoding="utf-8")
    (a.out / "competitor-review.csv").write_text("domain,url,page_type,query_cluster,search_intent,evidence_excerpt,review_status,reviewed_at,source_url\n", encoding="utf-8")
if __name__ == "__main__": main()
