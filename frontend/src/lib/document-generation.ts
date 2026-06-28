import type { DocumentType } from "./types";

export function shouldShowSchoolHeader(documentType: DocumentType | null): boolean {
  return documentType !== "LESSON_PLAN";
}

export function includeHeaderForDocument(
  documentType: DocumentType,
  requestedIncludeHeader: boolean
): boolean {
  return documentType === "LESSON_PLAN" ? false : requestedIncludeHeader;
}
