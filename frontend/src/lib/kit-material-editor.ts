import type { GeneratedDocument } from "@/lib/types";
import type { LessonKit, LessonKitMaterial, LessonKitMaterialType } from "@/lib/lesson-kit";

type JsonObject = Record<string, unknown>;

export const kitMaterialEditorMeta: Record<LessonKitMaterialType, { label: string; group: string; contentKey: string }> = {
  LESSON_PLAN: { label: "Plano de aula", group: "Plano", contentKey: "plano" },
  STUDENT_ACTIVITY: { label: "Atividade do aluno", group: "Atividade", contentKey: "atividadeAluno" },
  TEACHER_ANSWER_KEY: { label: "Gabarito do professor", group: "Gabarito", contentKey: "gabaritoProfessor" },
  ASSESSMENT: { label: "Instrumento avaliativo", group: "Avaliação", contentKey: "instrumentoAvaliativo" },
  PEDAGOGICAL_EVIDENCE: { label: "Evidências pedagógicas", group: "Evidências", contentKey: "evidenciasPedagogicas" },
  INCLUSIVE_ADAPTATIONS: { label: "Adaptações inclusivas", group: "Adaptações", contentKey: "adaptacoesInclusivas" },
};

export function isLessonKitMaterialType(value: string | null): value is LessonKitMaterialType {
  return value !== null && Object.hasOwn(kitMaterialEditorMeta, value);
}

export function lessonKitMaterialEditorHref(sourceDocumentId: number, kitId: number, type: LessonKitMaterialType) {
  if (type === "LESSON_PLAN") return `/dashboard/document/${sourceDocumentId}`;
  return `/dashboard/document/${sourceDocumentId}?kit=${kitId}&material=${type}`;
}

function parseObject(content: string): JsonObject {
  try {
    const parsed = JSON.parse(content) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as JsonObject : {};
  } catch {
    return {};
  }
}

function materialPayload(type: LessonKitMaterialType, content: string) {
  const parsed = parseObject(content);
  const meta = kitMaterialEditorMeta[type];
  const kit = parsed.kitAulaCompleta ?? parsed.kit;
  if (kit && typeof kit === "object" && !Array.isArray(kit)) {
    const nested = (kit as JsonObject)[meta.contentKey];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) return nested as JsonObject;
  }
  const directlyNested = parsed[meta.contentKey];
  return directlyNested && typeof directlyNested === "object" && !Array.isArray(directlyNested)
    ? directlyNested as JsonObject
    : parsed;
}

export function wrapLessonKitMaterialContent(type: LessonKitMaterialType, content: string) {
  const meta = kitMaterialEditorMeta[type];
  return JSON.stringify({ kitAulaCompleta: { [meta.contentKey]: materialPayload(type, content) } });
}

export function unwrapLessonKitMaterialContent(type: LessonKitMaterialType, editorContent: unknown) {
  const meta = kitMaterialEditorMeta[type];
  const root = editorContent && typeof editorContent === "object" && !Array.isArray(editorContent)
    ? editorContent as JsonObject
    : {};
  const kit = root.kitAulaCompleta ?? root.kit;
  const payload = kit && typeof kit === "object" && !Array.isArray(kit)
    ? (kit as JsonObject)[meta.contentKey]
    : root[meta.contentKey] ?? root;
  return JSON.stringify(payload ?? {});
}

export function toKitMaterialEditorDocument(source: GeneratedDocument, kit: LessonKit, material: LessonKitMaterial): GeneratedDocument {
  const meta = kitMaterialEditorMeta[material.type];
  return {
    ...source,
    title: `${meta.label} - ${kit.topic}`,
    content: wrapLessonKitMaterialContent(material.type, material.content),
    kitId: kit.id,
    kitStatus: kit.status,
  };
}
