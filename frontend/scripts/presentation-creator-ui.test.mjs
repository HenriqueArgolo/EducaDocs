import assert from "node:assert/strict";
import fs from "node:fs";

import {
  DEFAULT_THEME_ID,
  PEDAGOGICAL_FUNCTIONS,
  PRESENTATION_THEMES,
  THEME_FILTERS,
  filterPresentationThemes,
} from "../src/components/presentation-creator/catalog.ts";

assert.equal(PRESENTATION_THEMES.length, 12);
assert.equal(DEFAULT_THEME_ID, "CHALKIE");
assert.equal(new Set(PRESENTATION_THEMES.map((theme) => theme.id)).size, 12);
assert.equal(PRESENTATION_THEMES.every((theme) => Boolean(theme.editorThemeId)), true);

assert.deepEqual(
  THEME_FILTERS.filter((filter) => filter.group === "pedagogy").map((filter) => filter.id),
  ["early-years", "science", "history", "math", "teenagers"],
);
assert.equal(THEME_FILTERS.find((filter) => filter.id === "all")?.group, "all");
assert.deepEqual(
  THEME_FILTERS.filter((filter) => filter.group === "accessibility").map((filter) => filter.id),
  ["low-stimulation", "dyslexia", "low-vision", "adhd"],
);

assert.deepEqual(
  filterPresentationThemes(PRESENTATION_THEMES, ["science", "low-stimulation"]).map(
    (theme) => theme.id,
  ),
  ["SCIENCE_CLEAR", "FOCUS", "NATURE"],
);

assert.deepEqual(PEDAGOGICAL_FUNCTIONS.slice(0, 8), [
  "Capa · curiosidade",
  "Situação-problema",
  "Conhecimentos prévios",
  "Objetivos",
  "Conceito",
  "Exemplo",
  "Aplicação",
  "Verificação",
]);

const readComponent = (name) => {
  const url = new URL(`../src/components/presentation-creator/${name}`, import.meta.url);
  return fs.existsSync(url) ? fs.readFileSync(url, "utf8") : "";
};

const progress = readComponent("CreatorProgress.tsx");
const gallery = readComponent("ThemeGallery.tsx");
const outlineEditor = readComponent("OutlineEditor.tsx");
const creatorPage = fs.readFileSync(
  new URL("../src/app/dashboard/slides/new/page.tsx", import.meta.url),
  "utf8",
);

for (const label of ["Tema", "Refinar", "Aparência"]) assert.match(progress, new RegExp(label));
assert.match(progress, /aria-current/);
assert.match(progress, /aria-label="Progresso da criação"/);

assert.match(gallery, /role="radiogroup"/);
assert.match(gallery, /role="radio"/);
assert.match(gallery, /aria-checked/);
assert.match(gallery, /PRESENTATION_THEME_CATEGORIES/);
assert.match(gallery, /searchPresentationThemes/);

assert.match(outlineEditor, /PEDAGOGICAL_FUNCTIONS/);
assert.match(outlineEditor, /aria-label={`Remover slide/);
assert.match(outlineEditor, /Adicionar slide/);
assert.match(outlineEditor, /data-pedagogical-function/);
assert.match(outlineEditor, /onMove/);
assert.match(outlineEditor, /Mover slide/);

for (const component of ["CreatorProgress", "OutlineEditor", "ThemeGallery"]) {
  assert.match(creatorPage, new RegExp(`<${component}`));
}
assert.match(creatorPage, /aria-live="assertive"/);
assert.match(creatorPage, /Em breve/);
assert.match(creatorPage, /disabled/);
assert.match(creatorPage, /outline\.length === 0/);
assert.match(creatorPage, /fixed bottom-0/);
assert.match(creatorPage, /handleCreateOutline/);

console.log("presentation creator UI contract passed");
