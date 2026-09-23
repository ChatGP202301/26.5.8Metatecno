#!/usr/bin/env node
import assert from "node:assert/strict";
import { KPI_COLUMNS, parseKpiCsv, summarizeKpis } from "./verify-kpi-data.mjs";

const header = `${KPI_COLUMNS.join(",")}\n`;
assert.deepEqual(parseKpiCsv(header), []);
const rows = parseKpiCsv(`${header}2026-09-01,2026-09-30,en,/en/contact/,100,20,0,5,5,2,20,18,aggregate only\n`);
const summary = summarizeKpis(rows);
assert.equal(summary.deliveryRate, 1);
assert.equal(summary.formErrorRate, 0);
assert.equal(summary.qualifiedLeads, 2);
assert.throws(() => parseKpiCsv(`${header}2026-09-01,2026-09-30,en,/en/contact/,100,20,0,5,4,5,20,18,invalid\n`), /qualified_leads exceeds/);
assert.throws(() => parseKpiCsv(`${header}2026-09-01,2026-09-30,en,/en/contact/,100,20,0,5,5,2,20,18,user@example.com\n`), /email addresses/);

console.log("kpi_data_tests_passed scenarios=5");
