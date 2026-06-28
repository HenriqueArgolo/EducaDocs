import assert from "node:assert/strict";

import { extractDocumentHistoryItems } from "../src/lib/document-history.ts";

const document = {
  id: 1,
  userId: 7,
  type: "LESSON_PLAN",
  title: "Plano de aula",
  content: "{}",
  createdAt: "2026-06-21T19:00:00Z",
};

assert.deepEqual(extractDocumentHistoryItems([document]), [document]);

assert.deepEqual(
  extractDocumentHistoryItems({
    content: [document],
    totalElements: 1,
    totalPages: 1,
    size: 20,
    number: 0,
  }),
  [document]
);

assert.throws(
  () => extractDocumentHistoryItems({ totalElements: 1 }),
  /Formato inesperado/
);
