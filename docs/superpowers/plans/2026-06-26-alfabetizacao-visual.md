# Alfabetizacao Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first vertical slice for 1 ano literacy worksheets with theme-aware word banks, varied exercise types, validation/fallback, and a less repetitive renderer.

**Architecture:** Backend owns pedagogy and data quality: it gives the AI a constrained word bank, validates the response, and falls back to deterministic exercises when needed. Frontend owns visual composition: each exercise type gets a dedicated template instead of the current one-size-fits-all row.

**Tech Stack:** Spring Boot Java service/tests, Jackson JSON post-processing, Next.js React/TypeScript renderer, existing Lucide icon fallback.

---

## File Structure

- Create `src/main/java/br/com/edudocsai/service/EarlyLiteracyWordBank.java`: local thematic catalog for 1 ano words, figures, syllables, aliases, and topic matching.
- Create `src/main/java/br/com/edudocsai/service/EarlyLiteracyWorksheetNormalizer.java`: validates and repairs `ALFABETIZACAO_VISUAL` JSON before persistence.
- Modify `src/main/java/br/com/edudocsai/service/EarlyLiteracySupport.java`: expose word-bank prompt text, expanded activity types, and 1 ano detection helpers.
- Modify `src/main/java/br/com/edudocsai/service/ActivityMaterialService.java`: use word-bank constraints in the prompt and normalize generated content before save.
- Test `src/test/java/br/com/edudocsai/service/EarlyLiteracyWordBankTest.java`: topic-to-word-bank behavior.
- Test `src/test/java/br/com/edudocsai/service/EarlyLiteracyWorksheetNormalizerTest.java`: validation, fallback, variation, and gabarito preservation.
- Modify `src/test/java/br/com/edudocsai/service/ActivityMaterialServiceTest.java`: prompt and saved content behavior.
- Create frontend helper `src/lib/early-literacy.ts`: normalize exercise types, figure metadata, syllable/letter utility functions.
- Modify `src/app/dashboard/library/[id]/page.tsx`: render each early-literacy exercise with a dedicated visual template.
- Modify `scripts/document-rendering.test.mjs` or add `scripts/early-literacy-rendering.test.mjs`: verify structured early-literacy output stays student-safe and non-generic.

## Tasks

### Task 1: Theme Word Bank

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/EarlyLiteracyWordBank.java`
- Create: `src/test/java/br/com/edudocsai/service/EarlyLiteracyWordBankTest.java`
- Modify: `src/main/java/br/com/edudocsai/service/EarlyLiteracySupport.java`

- [ ] Write tests proving topic "animais da fazenda" returns farm words such as VACA, PATO and GALO, while "frutas" returns fruit words such as UVA, BANANA and MELA.
- [ ] Run `.\mvnw.cmd -Dtest=EarlyLiteracyWordBankTest test` and verify the tests fail because the class does not exist.
- [ ] Implement `EarlyLiteracyWordBank` with entries containing `word`, `figure`, `syllables`, `categories`, and `aliases`.
- [ ] Expand `EarlyLiteracySupport.allowedActivityTypesForPrompt()` to include `COMPLETAR_PALAVRA`, `CONTAR_LETRAS`, and `CAÇA_LETRA`.
- [ ] Run `.\mvnw.cmd -Dtest=EarlyLiteracyWordBankTest test` and verify it passes.

### Task 2: Normalizer And Fallback

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/EarlyLiteracyWorksheetNormalizer.java`
- Create: `src/test/java/br/com/edudocsai/service/EarlyLiteracyWorksheetNormalizerTest.java`

- [ ] Write tests proving invalid/generated content is repaired: unknown figures are replaced by topic words, commands over 8 words are shortened, and at least two exercise types are present.
- [ ] Run `.\mvnw.cmd -Dtest=EarlyLiteracyWorksheetNormalizerTest test` and verify the tests fail because the class does not exist.
- [ ] Implement a normalizer that parses generated JSON, preserves valid exercises, replaces invalid items from the topic word bank, and returns valid `ALFABETIZACAO_VISUAL_V2`.
- [ ] Implement fallback worksheet generation for cases where AI JSON is empty, invalid, off-topic, or repetitive.
- [ ] Run `.\mvnw.cmd -Dtest=EarlyLiteracyWorksheetNormalizerTest test` and verify it passes.

### Task 3: Backend Generation Integration

**Files:**
- Modify: `src/main/java/br/com/edudocsai/service/ActivityMaterialService.java`
- Modify: `src/main/java/br/com/edudocsai/service/EarlyLiteracySupport.java`
- Modify: `src/test/java/br/com/edudocsai/service/ActivityMaterialServiceTest.java`

- [ ] Write/update tests proving the prompt includes topic-specific word candidates and the saved content is normalized before persistence.
- [ ] Run `.\mvnw.cmd -Dtest=ActivityMaterialServiceTest test` and verify the new test fails.
- [ ] Update the prompt to require `layout: "ALFABETIZACAO_VISUAL_V2"` and to provide candidate words grouped by theme.
- [ ] Call the normalizer before extracting title/description and before saving `content`.
- [ ] Run `.\mvnw.cmd -Dtest=ActivityMaterialServiceTest test` and verify it passes.

### Task 4: Frontend Visual Templates

**Files:**
- Create: `C:\Users\joaoh\OneDrive\Área de Trabalho\Documentos\eduDocs-frotend\edudocs-frontend\src\lib\early-literacy.ts`
- Modify: `C:\Users\joaoh\OneDrive\Área de Trabalho\Documentos\eduDocs-frotend\edudocs-frontend\src\app\dashboard\library\[id]\page.tsx`

- [ ] Add a frontend helper test or script proving exercise type normalization and syllable/letter rendering data.
- [ ] Run the helper test and verify it fails before the helper exists.
- [ ] Extract shared figure metadata and render helpers into `early-literacy.ts`.
- [ ] Replace the generic row renderer with dedicated templates for `SEPARAR_SILABAS`, `LETRA_INICIAL`, `LIGAR_FIGURA_PALAVRA`, `COMPLETAR_PALAVRA`, `CIRCULAR_LETRA`, and `CONTAR_LETRAS`.
- [ ] Run frontend tests/build and verify TypeScript passes.

### Task 5: Real Verification

**Files:**
- Modify or create: frontend script under `scripts/`
- Use generated output artifacts under `tmp/early-literacy-v2/`

- [ ] Generate a real activity for `1º ano`, `Língua Portuguesa`, topic `animais da fazenda`.
- [ ] Verify the saved JSON contains farm-related words and at least two exercise types.
- [ ] Render or print the page and inspect that gabarito is not visible in the student sheet.
- [ ] Run `.\mvnw.cmd test`, `npm run build`, and the targeted frontend test.

## Self-Review

- Spec coverage: word bank, IA planning, validation/fallback, renderer variation, and verification are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Scope: limited to 1 ano literacy worksheets, not all material types.
