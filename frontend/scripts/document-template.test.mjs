import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  getDocumentTemplate,
  getTemplateSectionIndex,
  normalizeTemplateStyle,
} from "../src/lib/document-template.ts";

assert.equal(normalizeTemplateStyle("MODERN"), "MODERN");
assert.equal(normalizeTemplateStyle("MINIMALIST"), "MINIMALIST");
assert.equal(normalizeTemplateStyle(undefined), "INSTITUTIONAL");
assert.equal(normalizeTemplateStyle("UNKNOWN"), "INSTITUTIONAL");

const institutional = getDocumentTemplate("INSTITUTIONAL");
const modern = getDocumentTemplate("MODERN");
const minimalist = getDocumentTemplate("MINIMALIST");

assert.notEqual(institutional.rootClass, modern.rootClass);
assert.notEqual(modern.rootClass, minimalist.rootClass);
assert.notEqual(institutional.signature, modern.signature);
assert.notEqual(modern.signature, minimalist.signature);

assert.equal(getTemplateSectionIndex("INSTITUTIONAL", 4), "IV");
assert.equal(getTemplateSectionIndex("MODERN", 4), "04");
assert.equal(getTemplateSectionIndex("MINIMALIST", 4), "");

const pageSource = readFileSync("src/app/dashboard/document/[id]/page.tsx", "utf8");
const globalCss = readFileSync("src/app/globals.css", "utf8");

assert.match(pageSource, /data-template=\{template\.id\}/);
assert.match(globalCss, /\.document-template--institutional/);
assert.match(globalCss, /\.document-template--modern/);
assert.match(globalCss, /\.document-template--minimalist/);
