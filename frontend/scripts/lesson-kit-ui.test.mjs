import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const model = read("src/lib/lesson-kit.ts");
const panel = read("src/components/lesson-kit/LessonKitCreationPanel.tsx");
const hub = read("src/components/lesson-kit/LessonKitHub.tsx");
const api = read("src/lib/lesson-kit-api.ts");
const activityDialog = read("src/components/lesson-kit/ActivityConfigurationDialog.tsx");
const documentPage = read("src/app/dashboard/document/[id]/page.tsx");
const classroomDropdown = read("src/components/classroom/ClassroomKitDropdown.tsx");
const editorAdapterPath = new URL("../src/lib/kit-material-editor.ts", import.meta.url);
const editorAdapter = fs.existsSync(editorAdapterPath) ? fs.readFileSync(editorAdapterPath, "utf8") : "";

assert.match(model, /LESSON_PLAN/);
assert.match(model, /STUDENT_ACTIVITY/);
assert.match(panel, /Criar kit completo/);
assert.match(panel, /aria-live="polite"/);
assert.match(documentPage, /LessonKitCreationPanel/);
assert.doesNotMatch(documentPage, /Navega(?:ç|Ã§)(?:ã|Ã£)o do Kit/);

for (const label of ["Plano de aula", "Atividade do aluno", "Gabarito do professor",
  "Instrumento avaliativo", "Evidências pedagógicas", "Adaptações inclusivas"]) {
  assert.match(model + hub, new RegExp(label));
}

for (const label of ["Quantidade de atividades", "Exercícios por atividade", "Finalidade", "Dificuldade", "Modalidade"]) {
  assert.match(hub + activityDialog, new RegExp(label));
}
assert.match(api, /activityCount/);
assert.match(api, /exercisesPerActivity/);
assert.match(api, /export\.docx/);
assert.match(api, /export\.pdf/);
assert.doesNotMatch(hub, /application\/json/);
assert.doesNotMatch(hub, /window\.print/);
assert.doesNotMatch(hub, /lesson-kit-modal/);
assert.match(editorAdapter, /lessonKitMaterialEditorHref/);
assert.match(editorAdapter, /wrapLessonKitMaterialContent/);
assert.match(editorAdapter, /unwrapLessonKitMaterialContent/);
assert.match(hub, /lessonKitMaterialEditorHref/);
assert.match(classroomDropdown, /lessonKitMaterialEditorHref/);
assert.match(documentPage, /updateLessonKitMaterial/);
assert.match(documentPage, /fetchLessonKitMaterialPdfUrl/);
assert.match(hub, /definition\.type\s*===\s*"STUDENT_ACTIVITY"[\s\S]{0,500}Configurar atividade/);
assert.doesNotMatch(hub, /mt-6 flex justify-end/);

const editor = await import(editorAdapterPath.href);
assert.equal(
  editor.lessonKitMaterialEditorHref(42, 7, "STUDENT_ACTIVITY"),
  "/dashboard/document/42?kit=7&material=STUDENT_ACTIVITY",
);
assert.equal(editor.lessonKitMaterialEditorHref(42, 7, "LESSON_PLAN"), "/dashboard/document/42");
const originalActivity = { titulo: "Revisão", questoes: ["Questão 1"] };
const wrappedActivity = editor.wrapLessonKitMaterialContent("STUDENT_ACTIVITY", JSON.stringify(originalActivity));
assert.deepEqual(
  JSON.parse(editor.unwrapLessonKitMaterialContent("STUDENT_ACTIVITY", JSON.parse(wrappedActivity))),
  originalActivity,
);

console.log("lesson kit UI contract passed");
