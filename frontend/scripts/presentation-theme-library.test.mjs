import assert from "node:assert/strict";
import fs from "node:fs";

import {
  COMPOSITION_SYSTEMS,
  PRESENTATION_THEME_CATEGORIES,
  PRESENTATION_THEME_LIBRARY,
  filterThemesByCategory,
  getPresentationTheme,
} from "../src/lib/presentation-themes.ts";

assert.equal(PRESENTATION_THEME_CATEGORIES.length, 18);
assert.equal(PRESENTATION_THEME_CATEGORIES.filter((category) => category.kind === "pedagogy").length, 10);
assert.equal(PRESENTATION_THEME_CATEGORIES.filter((category) => category.kind === "inclusion").length, 8);
assert.equal(COMPOSITION_SYSTEMS.length, 10);
assert.equal(PRESENTATION_THEME_LIBRARY.length, 180);
assert.equal(new Set(PRESENTATION_THEME_LIBRARY.map((theme) => theme.id)).size, 180);

for (const category of PRESENTATION_THEME_CATEGORIES) {
  const themes = filterThemesByCategory(category.id);
  assert.equal(themes.length, 10, `${category.label} precisa ter dez temas`);
  assert.equal(new Set(themes.map((theme) => theme.composition)).size, 10);
}

for (const theme of PRESENTATION_THEME_LIBRARY) {
  assert.ok(theme.name);
  assert.ok(theme.description);
  assert.ok(theme.artDirection);
  assert.ok(theme.imageTreatment);
  assert.ok(theme.titleTreatment);
  assert.ok(theme.signatureElement);
  assert.ok(theme.fontFamily);
  assert.match(theme.colors.canvas, /^#[0-9A-F]{6}$/i);
  assert.match(theme.colors.ink, /^#[0-9A-F]{6}$/i);
  assert.match(theme.colors.accent, /^#[0-9A-F]{6}$/i);
}

const inclusiveCategories = PRESENTATION_THEME_CATEGORIES.filter((category) => category.kind === "inclusion");
for (const category of inclusiveCategories) {
  for (const theme of filterThemesByCategory(category.id)) {
    assert.ok(theme.accessibilityProfile);
    assert.ok(theme.accessibilityProfile.rules.length >= 3);
    assert.equal(theme.accessibilityProfile.certifiedFor, category.id);
  }
}

assert.equal(getPresentationTheme("early-years-chalkie-studio")?.name, "Chalkie Studio");
assert.equal(getPresentationTheme("missing-theme"), undefined);

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const gallery = read("src/components/presentation-creator/ThemeGallery.tsx");
const previewPath = new URL("../src/components/presentation-creator/ThemePreview.tsx", import.meta.url);
const preview = fs.existsSync(previewPath) ? fs.readFileSync(previewPath, "utf8") : "";
const creator = read("src/app/dashboard/slides/new/page.tsx");
const editor = read("src/app/dashboard/slides/[id]/page.tsx");

assert.match(gallery, /PRESENTATION_THEME_CATEGORIES/);
assert.match(gallery, /Pesquisar temas/);
assert.match(preview, /data-preview-region="media"/);
assert.match(preview, /data-preview-region="title"/);
assert.match(preview, /data-preview-region="signature"/);
assert.doesNotMatch(creator, /editorThemeId/);
assert.match(editor, /getPresentationTheme/);
assert.match(editor, /ThemeAtmosphere/);
assert.match(editor, /html-to-image/);
assert.match(editor, /slideCanvasRef/);
assert.match(editor, /toPng/);

console.log("presentation theme library contract passed");
