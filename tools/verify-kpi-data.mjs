#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const KPI_COLUMNS = [
  "period_start", "period_end", "locale", "source_path", "organic_clicks", "form_starts", "form_errors",
  "accepted_leads", "delivered_leads", "qualified_leads", "approved_urls", "indexed_urls", "notes"
];

function parseLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted && character === '"' && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { values.push(value); value = ""; }
    else value += character;
  }
  values.push(value);
  if (quoted) throw new Error("Metrics CSV contains an unterminated quoted field.");
  return values;
}

function integer(value, field, row) {
  if (!/^(?:0|[1-9][0-9]*)$/.test(value)) throw new Error(`Metrics row ${row}: ${field} must be a non-negative integer.`);
  return Number(value);
}

export function parseKpiCsv(source) {
  const lines = source.replace(/\r/g, "").split("\n").filter((line) => line.trim());
  if (!lines.length) throw new Error("Metrics CSV is empty.");
  const headers = parseLine(lines[0]);
  if (headers.length !== KPI_COLUMNS.length || headers.some((header, index) => header !== KPI_COLUMNS[index])) {
    throw new Error(`Metrics CSV headers must be exactly: ${KPI_COLUMNS.join(",")}`);
  }
  return lines.slice(1).map((line, index) => {
    const cells = parseLine(line).map((cell) => cell.trim());
    if (cells.length !== headers.length) throw new Error(`Metrics row ${index + 2} has the wrong number of columns.`);
    const row = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]]));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.period_start) || !/^\d{4}-\d{2}-\d{2}$/.test(row.period_end)) throw new Error(`Metrics row ${index + 2}: dates must use YYYY-MM-DD.`);
    if (!/^\/(?:[^?#]*\/)?$/.test(row.source_path) || row.source_path.includes("/index.html")) throw new Error(`Metrics row ${index + 2}: source_path must be canonical and contain no query or fragment.`);
    if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(row.locale)) throw new Error(`Metrics row ${index + 2}: locale is invalid.`);
    if (/@/.test(row.notes) || /\b(?:\+?\d[\s().-]*){7,}\b/.test(row.notes)) throw new Error(`Metrics row ${index + 2}: notes may not contain email addresses or phone numbers.`);
    for (const field of KPI_COLUMNS.slice(4, 12)) row[field] = integer(row[field], field, index + 2);
    if (row.form_errors > row.form_starts) throw new Error(`Metrics row ${index + 2}: form_errors exceeds form_starts.`);
    if (row.delivered_leads > row.accepted_leads) throw new Error(`Metrics row ${index + 2}: delivered_leads exceeds accepted_leads.`);
    if (row.qualified_leads > row.delivered_leads) throw new Error(`Metrics row ${index + 2}: qualified_leads exceeds delivered_leads.`);
    if (row.indexed_urls > row.approved_urls) throw new Error(`Metrics row ${index + 2}: indexed_urls exceeds approved_urls.`);
    return row;
  });
}

export function summarizeKpis(rows) {
  const total = (field) => rows.reduce((sum, row) => sum + row[field], 0);
  const accepted = total("accepted_leads");
  const starts = total("form_starts");
  const summary = {
    rows: rows.length,
    organicClicks: total("organic_clicks"),
    formStarts: starts,
    formErrors: total("form_errors"),
    acceptedLeads: accepted,
    deliveredLeads: total("delivered_leads"),
    qualifiedLeads: total("qualified_leads"),
    deliveryRate: accepted ? total("delivered_leads") / accepted : null,
    formErrorRate: starts ? total("form_errors") / starts : null
  };
  return summary;
}

async function main() {
  const source = await readFile(resolve(process.cwd(), "seo/measurement/monthly-metrics.csv"), "utf8");
  const rows = parseKpiCsv(source);
  const summary = summarizeKpis(rows);
  console.log(`kpi_data_valid rows=${summary.rows} accepted=${summary.acceptedLeads} delivered=${summary.deliveredLeads} qualified=${summary.qualifiedLeads}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
