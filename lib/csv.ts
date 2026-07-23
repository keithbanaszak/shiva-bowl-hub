/**
 * Minimal RFC-4180 CSV reader.
 *
 * Google Sheets exports quoted fields containing commas and embedded newlines,
 * and doubles any quote inside a quoted field — a naive split(",") mangles all
 * three, which matters because rule text is exactly the kind of prose that
 * contains commas.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // strip a UTF-8 BOM and normalise line endings
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'; // escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }

  // trailing field / row (no newline at EOF)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** CSV with a header row -> array of objects keyed by lower-cased header. */
export function parseCsvObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => {
      o[h] = (r[i] ?? "").trim();
    });
    return o;
  });
}
