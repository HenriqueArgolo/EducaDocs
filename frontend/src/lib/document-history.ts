import type { DocumentHistoryItem } from "./types";

export interface DocumentHistoryPage {
  content?: DocumentHistoryItem[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
}

export type DocumentHistoryResponse = DocumentHistoryItem[] | DocumentHistoryPage;

export function extractDocumentHistoryItems(
  payload: DocumentHistoryResponse
): DocumentHistoryItem[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.content)) {
    return payload.content;
  }

  throw new Error("Formato inesperado no historico de documentos.");
}
