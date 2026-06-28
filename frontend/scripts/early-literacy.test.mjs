import assert from "node:assert/strict";

import {
  getCompletionOptions,
  getFigureIconName,
  getLetters,
  getSyllables,
  isEarlyLiteracyWorksheetContent,
  normalizeEarlyLiteracyType,
} from "../src/lib/early-literacy.ts";

assert.equal(normalizeEarlyLiteracyType("completar_silaba"), "COMPLETAR_PALAVRA");
assert.equal(normalizeEarlyLiteracyType("INTERPRETACAO_DE_TEXTO"), "SEPARAR_SILABAS");

assert.deepEqual(getSyllables({ palavra: "VACA", silabas: ["VA", "CA"] }), ["VA", "CA"]);
assert.deepEqual(getSyllables({ palavra: "PATO" }), ["PA", "TO"]);

assert.deepEqual(getLetters({ palavra: "GALO" }), ["G", "A", "L", "O"]);
assert.deepEqual(getCompletionOptions({ palavra: "VACA", silabas: ["VA", "CA"], opcoes: ["VA", "PA", "LA"] }), [
  "VA",
  "PA",
  "LA",
]);

assert.equal(getFigureIconName("vaca"), "Milk");
assert.equal(getFigureIconName("dinossauro"), "Image");

assert.equal(isEarlyLiteracyWorksheetContent({ layout: "ALFABETIZACAO_VISUAL" }), true);
assert.equal(isEarlyLiteracyWorksheetContent({ layout: "ALFABETIZACAO_VISUAL_V2" }), true);
assert.equal(isEarlyLiteracyWorksheetContent({ tipoAvaliacao: "ALFABETIZACAO_INICIAL" }), true);
assert.equal(isEarlyLiteracyWorksheetContent({ atividadesVisuais: [] }), true);
assert.equal(isEarlyLiteracyWorksheetContent({ layout: "PADRAO" }), false);
