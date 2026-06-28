import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync("src/app/dashboard/document/[id]/page.tsx", "utf8");
const globalCss = readFileSync("src/app/globals.css", "utf8");

assert.match(
  globalCss,
  /@page\s*{[^}]*margin:\s*(?!0\b)[^;}]+;/s,
  "Printed documents must use a real @page margin instead of margin: 0."
);

assert.match(
  pageSource,
  /className="[^"]*\bprint-group\b[^"]*"/,
  "Document groups need a print-group class so large groups can split across pages."
);

assert.match(
  pageSource,
  /className="[^"]*\bprint-section\b[^"]*"/,
  "Document sections need a print-section class so section spacing and page breaks are controlled by print CSS."
);

assert.match(
  pageSource,
  /className="[^"]*\bprint-question\b[^"]*"/,
  "Question blocks need a print-question class so question cards are simplified for printing."
);
