import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const component = read("src/components/classroom/ClassroomKitDropdown.tsx");
const page = read("src/app/dashboard/classrooms/[id]/page.tsx");
const types = read("src/lib/types.ts");
const kitModel = read("src/lib/lesson-kit.ts");
const kitPage = read("src/app/dashboard/kit/[id]/page.tsx");
const kitHub = read("src/components/lesson-kit/LessonKitHub.tsx");

assert.match(types, /kitId\?: number/);
assert.match(page, /ClassroomKitDropdown/);
assert.match(component, /aria-expanded/);
assert.match(component, /Materiais do kit/);
for (const label of ["Plano de aula", "Atividade do aluno", "Gabarito do professor", "Instrumento avaliativo", "Evidências pedagógicas", "Adaptações inclusivas"]) {
  assert.match(component + kitModel, new RegExp(label));
}
assert.match(component, /lessonKitMaterialEditorHref/);
assert.match(kitPage, /useSearchParams/);
assert.match(kitPage, /router\.replace\(lessonKitMaterialEditorHref/);
assert.doesNotMatch(kitHub, /lesson-kit-modal/);
assert.match(kitHub, /lessonKitMaterialEditorHref/);
assert.match(kitHub, /Configurar atividade/);

console.log("classroom kit dropdown contract passed");
