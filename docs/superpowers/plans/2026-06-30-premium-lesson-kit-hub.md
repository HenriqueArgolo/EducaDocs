# Premium Lesson Kit Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the embedded lesson-kit sidebar with deferred kit generation and a first-class premium hub containing six independently manageable materials.

**Architecture:** Persist `LessonKit` as an aggregate rooted in the existing lesson-plan `Document`, with five versioned derived `LessonKitMaterial` rows. A dedicated service owns creation, status, regeneration, compatibility, and authorization; the frontend consumes a focused kit API and renders the approved post-plan CTA, generation progress, bento hub, and single library identity.

**Tech Stack:** Java 17, Spring Boot 3.3, JPA/Hibernate, Flyway/PostgreSQL, JUnit 5/Mockito; Next.js 16, React 19, TypeScript, Tailwind CSS 4, Lucide React, Framer Motion.

---

## File Structure

- `V17__create_lesson_kits.sql`: aggregate and material persistence, uniqueness, status constraints, versioning.
- `LessonKit`, `LessonKitMaterial`, enums: persistence model only.
- `LessonKitRepository`, `LessonKitMaterialRepository`: ownership-aware lookup and material queries.
- `dto/lessonkit/*`: stable API contracts; no entity serialization.
- `LessonKitContentMapper`: extracts the five legacy embedded sections and composes material JSON.
- `LessonKitService`: authorization, idempotent creation, partial progress, material update/regeneration.
- `LessonKitController`: REST transport and download endpoints.
- `lesson-kit.ts`: frontend state model and pure display helpers.
- `lesson-kit-api.ts`: kit-specific HTTP calls and cache invalidation.
- `LessonKitCreationPanel`, `LessonKitProgress`, `LessonKitHub`, `LessonKitMaterialCard`: focused UI units.
- `dashboard/kit/[id]/page.tsx`: kit hub route.
- Existing document and library pages: CTA/redirect and single-item kit presentation only.

### Task 1: Persist the Kit Aggregate

**Files:**
- Create: `src/main/resources/db/migration/V17__create_lesson_kits.sql`
- Create: `src/main/java/br/com/edudocsai/entity/LessonKit.java`
- Create: `src/main/java/br/com/edudocsai/entity/LessonKitMaterial.java`
- Create: `src/main/java/br/com/edudocsai/entity/LessonKitStatus.java`
- Create: `src/main/java/br/com/edudocsai/entity/LessonKitMaterialType.java`
- Create: `src/main/java/br/com/edudocsai/entity/LessonKitMaterialStatus.java`
- Create: `src/main/java/br/com/edudocsai/repository/LessonKitRepository.java`
- Create: `src/main/java/br/com/edudocsai/repository/LessonKitMaterialRepository.java`
- Test: `src/test/java/br/com/edudocsai/repository/LessonKitRepositoryIntegrationTest.java`

- [ ] **Step 1: Write the failing repository test**

```java
@Test
void sourceDocumentIsUniqueAndMaterialsKeepIndependentVersions() {
    LessonKit kit = kits.save(LessonKit.builder()
            .user(user).sourceDocument(plan).title("Kit de Aula Semanal — 6º ano — Matemática")
            .status(LessonKitStatus.GENERATING).build());
    materials.save(LessonKitMaterial.builder().kit(kit)
            .type(LessonKitMaterialType.STUDENT_ACTIVITY)
            .status(LessonKitMaterialStatus.QUEUED).content("{}").build());

    assertThat(kits.findBySourceDocumentIdAndUserId(plan.getId(), user.getId())).contains(kit);
    assertThat(materials.findByKitIdOrderByType(kit.getId())).hasSize(1);
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `.\mvnw.cmd -Dtest=LessonKitRepositoryIntegrationTest test`
Expected: compilation failure because the kit model and repositories do not exist.

- [ ] **Step 3: Add the migration and minimal entities**

```sql
CREATE TABLE lesson_kits (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  source_document_id BIGINT NOT NULL REFERENCES documents(id),
  title VARCHAR(180) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_lesson_kits_source UNIQUE (source_document_id)
);
CREATE TABLE lesson_kit_materials (
  id BIGSERIAL PRIMARY KEY,
  lesson_kit_id BIGINT NOT NULL REFERENCES lesson_kits(id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL,
  content TEXT NOT NULL DEFAULT '{}',
  generation_error VARCHAR(500),
  version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_lesson_kit_material_type UNIQUE (lesson_kit_id, type)
);
CREATE INDEX idx_lesson_kits_user_created ON lesson_kits(user_id, created_at DESC);
```

Define statuses `GENERATING`, `PARTIAL`, `READY`; material statuses `QUEUED`, `GENERATING`, `READY`, `FAILED`; and all six material types. Map `@Version` on `LessonKitMaterial.version`.

- [ ] **Step 4: Run the repository test**

Run: `.\mvnw.cmd -Dtest=LessonKitRepositoryIntegrationTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/main/resources/db/migration/V17__create_lesson_kits.sql src/main/java/br/com/edudocsai/entity src/main/java/br/com/edudocsai/repository src/test/java/br/com/edudocsai/repository/LessonKitRepositoryIntegrationTest.java
git commit -m "feat: persist lesson kit aggregate"
```

### Task 2: Map Existing Embedded Kit Content

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/lessonkit/LessonKitContentMapper.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonkit/LessonKitContentMapperTest.java`

- [ ] **Step 1: Write failing extraction tests**

```java
@Test
void extractsPortugueseEmbeddedSectionsWithoutChangingThePlan() {
    Map<LessonKitMaterialType, String> result = mapper.extract(completePlanJson);
    assertThat(result).containsKeys(STUDENT_ACTIVITY, TEACHER_ANSWER_KEY,
            ASSESSMENT, PEDAGOGICAL_EVIDENCE, INCLUSIVE_ADAPTATIONS);
    assertThat(result.get(STUDENT_ACTIVITY)).contains("atividadeAluno");
}

@Test
void returnsEmptyMapForLegacyPlanWithoutKit() {
    assertThat(mapper.extract("{\"tema\":\"Frações\"}")).isEmpty();
}
```

- [ ] **Step 2: Verify failure**

Run: `.\mvnw.cmd -Dtest=LessonKitContentMapperTest test`
Expected: compilation failure for missing mapper.

- [ ] **Step 3: Implement strict aliases**

Use Jackson to accept only `kitAulaCompleta` or `kit`, then map `atividadeAluno/studentActivity`, `gabaritoProfessor/teacherAnswerKey`, `instrumentoAvaliativo/assessmentInstrument`, `evidenciasPedagogicas/pedagogicalEvidence`, and `adaptacoesInclusivas/inclusiveAdaptations`. Return compact JSON retaining the public wrapper key for the material renderer.

- [ ] **Step 4: Verify passing tests and commit**

Run: `.\mvnw.cmd -Dtest=LessonKitContentMapperTest test`
Expected: PASS.

```powershell
git add src/main/java/br/com/edudocsai/service/lessonkit src/test/java/br/com/edudocsai/service/lessonkit
git commit -m "feat: map embedded lesson kit materials"
```

### Task 3: Create an Idempotent Kit API

**Files:**
- Create: `src/main/java/br/com/edudocsai/dto/lessonkit/LessonKitResponse.java`
- Create: `src/main/java/br/com/edudocsai/dto/lessonkit/LessonKitMaterialResponse.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonkit/LessonKitService.java`
- Create: `src/main/java/br/com/edudocsai/controller/LessonKitController.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonkit/LessonKitServiceTest.java`
- Test: `src/test/java/br/com/edudocsai/controller/LessonKitControllerTest.java`

- [ ] **Step 1: Write failing service tests for authorization and idempotency**

```java
@Test
void createsOneKitAndPromotesEmbeddedMaterials() {
    when(currentUser.getCurrentUser()).thenReturn(user);
    when(documents.findById(10L)).thenReturn(Optional.of(plan));
    when(kits.findBySourceDocumentIdAndUserId(10L, 7L)).thenReturn(Optional.empty());
    LessonKitResponse result = service.createFromPlan(10L);
    assertThat(result.materials()).hasSize(6);
    assertThat(result.status()).isEqualTo(LessonKitStatus.READY);
}

@Test
void repeatedCreateReturnsExistingKit() {
    when(kits.findBySourceDocumentIdAndUserId(10L, 7L)).thenReturn(Optional.of(existing));
    assertThat(service.createFromPlan(10L).id()).isEqualTo(existing.getId());
    verify(kits, never()).save(any());
}
```

- [ ] **Step 2: Verify failure**

Run: `.\mvnw.cmd -Dtest=LessonKitServiceTest,LessonKitControllerTest test`
Expected: compilation failure for missing API.

- [ ] **Step 3: Implement API contracts and endpoints**

```java
@PostMapping("/from-plan/{documentId}")
@ResponseStatus(HttpStatus.CREATED)
LessonKitResponse create(@PathVariable Long documentId) {
    return service.createFromPlan(documentId);
}

@GetMapping("/{id}")
LessonKitResponse get(@PathVariable Long id) {
    return service.get(id);
}
```

`LessonKitResponse` contains `id`, `sourceDocumentId`, `title`, `status`, `grade`, `subject`, `topic`, timestamps, and ordered material summaries. Create the `LESSON_PLAN` child from the source document and promote embedded materials when present; otherwise queue the five derived rows. Enforce `LESSON_PLAN` type and owner/admin access.

- [ ] **Step 4: Verify and commit**

Run: `.\mvnw.cmd -Dtest=LessonKitServiceTest,LessonKitControllerTest test`
Expected: PASS.

```powershell
git add src/main/java/br/com/edudocsai/dto/lessonkit src/main/java/br/com/edudocsai/service/lessonkit src/main/java/br/com/edudocsai/controller/LessonKitController.java src/test/java/br/com/edudocsai
git commit -m "feat: create lesson kit API"
```

### Task 4: Generate, Edit, Regenerate, and Export Materials Independently

**Files:**
- Create: `src/main/java/br/com/edudocsai/dto/lessonkit/UpdateLessonKitMaterialRequest.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonkit/LessonKitMaterialGenerator.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonkit/LessonKitGenerationOrchestrator.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonkit/LessonKitMaterialExportService.java`
- Create: `src/main/java/br/com/edudocsai/config/AsyncConfiguration.java`
- Modify: `src/main/java/br/com/edudocsai/service/lessonkit/LessonKitService.java`
- Modify: `src/main/java/br/com/edudocsai/controller/LessonKitController.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonkit/LessonKitServiceTest.java`

- [ ] **Step 1: Write failing atomic-regeneration tests**

```java
@Test
void successfulRegenerationReplacesOnlyRequestedMaterial() {
    when(generator.generate(kit, STUDENT_ACTIVITY)).thenReturn(validActivityJson);
    service.regenerate(kit.getId(), STUDENT_ACTIVITY);
    assertThat(activity.getContent()).isEqualTo(validActivityJson);
    assertThat(answerKey.getContent()).isEqualTo(originalAnswerKey);
}

@Test
void failedRegenerationPreservesPreviousValidContent() {
    when(generator.generate(kit, STUDENT_ACTIVITY)).thenThrow(new AiProviderException("timeout"));
    assertThatThrownBy(() -> service.regenerate(kit.getId(), STUDENT_ACTIVITY));
    assertThat(activity.getContent()).isEqualTo(originalActivity);
}

@Test
void initialGenerationKeepsSuccessfulMaterialsWhenOneFails() {
    when(generator.generate(kit, ASSESSMENT)).thenThrow(new AiProviderException("timeout"));
    orchestrator.generateQueuedMaterials(kit.getId());
    assertThat(activity.getStatus()).isEqualTo(READY);
    assertThat(assessment.getStatus()).isEqualTo(FAILED);
    assertThat(kit.getStatus()).isEqualTo(PARTIAL);
}
```

- [ ] **Step 2: Verify failure**

Run: `.\mvnw.cmd -Dtest=LessonKitServiceTest test`
Expected: failure because regeneration does not exist.

- [ ] **Step 3: Implement update and regenerate endpoints**

```java
@PutMapping("/{kitId}/materials/{type}")
LessonKitMaterialResponse update(@PathVariable Long kitId,
        @PathVariable LessonKitMaterialType type,
        @Valid @RequestBody UpdateLessonKitMaterialRequest request) { ... }

@PostMapping("/{kitId}/materials/{type}/regenerate")
LessonKitMaterialResponse regenerate(@PathVariable Long kitId,
        @PathVariable LessonKitMaterialType type) { ... }

@GetMapping("/{kitId}/materials/{type}/export.docx")
ResponseEntity<byte[]> exportMaterial(@PathVariable Long kitId,
        @PathVariable LessonKitMaterialType type) { ... }
```

Enable async execution with a named bounded `ThreadPoolTaskExecutor` (`corePoolSize=2`, `maxPoolSize=4`, `queueCapacity=25`, prefix `lesson-kit-`). Publish a `LessonKitCreatedEvent` inside creation and consume it with `@TransactionalEventListener(phase = AFTER_COMMIT)` plus `@Async("lessonKitExecutor")`. Transition every queued row through `GENERATING`, and persist each result in its own `REQUIRES_NEW` transaction so one provider failure produces `PARTIAL` rather than rolling back ready siblings. Reject regeneration of `LESSON_PLAN`. Validate generated JSON before assigning it to the managed entity. On regeneration failure, retain previous content and return a recoverable error without replacing the ready version. The export service wraps the selected material in a temporary owned `Document` representation and delegates to `DocumentGeneratorService`; complete-kit export continues through the source plan endpoint.

- [ ] **Step 4: Verify and commit**

Run: `.\mvnw.cmd -Dtest=LessonKitServiceTest test`
Expected: PASS.

```powershell
git add src/main/java/br/com/edudocsai/dto/lessonkit src/main/java/br/com/edudocsai/service/lessonkit src/main/java/br/com/edudocsai/controller/LessonKitController.java src/test/java/br/com/edudocsai/service/lessonkit
git commit -m "feat: manage lesson kit materials independently"
```

### Task 5: Add Frontend Types, Helpers, and API Client

**Files:**
- Create: `frontend/src/lib/lesson-kit.ts`
- Create: `frontend/src/lib/lesson-kit-api.ts`
- Create: `frontend/scripts/lesson-kit.test.mjs`
- Modify: `frontend/package.json`

- [ ] **Step 1: Write the failing pure helper test**

```javascript
assert.equal(lessonKitLabel({ period: "WEEKLY", grade: "6º ano", subject: "Matemática" }),
  "Kit de Aula Semanal — 6º ano — Matemática");
assert.deepEqual(orderedMaterialTypes, ["LESSON_PLAN", "STUDENT_ACTIVITY",
  "TEACHER_ANSWER_KEY", "ASSESSMENT", "PEDAGOGICAL_EVIDENCE", "INCLUSIVE_ADAPTATIONS"]);
assert.equal(kitReadiness(partialKit), "4 de 6 prontos");
```

- [ ] **Step 2: Verify failure**

Run: `npm run test:lesson-kit`
Expected: script or module not found.

- [ ] **Step 3: Implement exact TypeScript contracts and API calls**

Define `LessonKit`, `LessonKitMaterial`, the three statuses, and six material types. Export `createLessonKit(documentId)`, `fetchLessonKit(id)`, `updateLessonKitMaterial`, and `regenerateLessonKitMaterial`, using the existing authenticated `request` helper and invalidating document/list cache keys after mutation.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:lesson-kit`
Expected: PASS.

```powershell
git add frontend/src/lib/lesson-kit.ts frontend/src/lib/lesson-kit-api.ts frontend/scripts/lesson-kit.test.mjs frontend/package.json
git commit -m "feat: add lesson kit frontend model"
```

### Task 6: Replace Hidden Sidebar with Post-Plan CTA and Progress

**Files:**
- Create: `frontend/src/components/lesson-kit/LessonKitCreationPanel.tsx`
- Create: `frontend/src/components/lesson-kit/LessonKitProgress.tsx`
- Modify: `frontend/src/app/dashboard/document/[id]/page.tsx`
- Create: `frontend/scripts/lesson-kit-ui.test.mjs`

- [ ] **Step 1: Write the failing source-contract test**

```javascript
assert.match(creationPanel, /Criar kit completo/);
assert.match(progressPanel, /aria-live="polite"/);
assert.doesNotMatch(documentPage, /Navegação do Kit/);
assert.match(documentPage, /LessonKitCreationPanel/);
```

- [ ] **Step 2: Verify failure**

Run: `node --experimental-strip-types scripts/lesson-kit-ui.test.mjs`
Expected: failure because the components do not exist and the old sidebar remains.

- [ ] **Step 3: Implement the approved states**

Render the CTA only for eligible lesson plans. On activation, disable duplicate clicks, show five labeled stages, poll `GET /lesson-kits/{id}` until `READY` or `PARTIAL`, then route to `/dashboard/kit/{id}`. Preserve normal plan viewing/editing. Do not use emoji icons; use Lucide. Respect reduced motion and keep all controls at least 44px high.

- [ ] **Step 4: Verify and commit**

Run: `node --experimental-strip-types scripts/lesson-kit-ui.test.mjs`
Expected: PASS.

```powershell
git add frontend/src/components/lesson-kit frontend/src/app/dashboard/document/[id]/page.tsx frontend/scripts/lesson-kit-ui.test.mjs
git commit -m "feat: add deferred lesson kit creation flow"
```

### Task 7: Build the Premium Bento Hub

**Files:**
- Create: `frontend/src/app/dashboard/kit/[id]/page.tsx`
- Create: `frontend/src/components/lesson-kit/LessonKitHero.tsx`
- Create: `frontend/src/components/lesson-kit/LessonKitHub.tsx`
- Create: `frontend/src/components/lesson-kit/LessonKitMaterialCard.tsx`
- Create: `frontend/src/components/lesson-kit/RegenerateMaterialDialog.tsx`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/scripts/lesson-kit-ui.test.mjs`

- [ ] **Step 1: Extend the failing UI contract**

```javascript
for (const label of ["Plano de aula", "Atividade do aluno", "Gabarito do professor",
  "Instrumento avaliativo", "Evidências pedagógicas", "Adaptações inclusivas"]) {
  assert.match(hubSources, new RegExp(label));
}
assert.match(hubSources, /prefers-reduced-motion/);
assert.match(hubSources, /Regenerar somente este material/);
```

- [ ] **Step 2: Verify failure**

Run: `node --experimental-strip-types scripts/lesson-kit-ui.test.mjs`
Expected: missing hub route and components.

- [ ] **Step 3: Implement the approved premium composition**

Use the local design tokens, deep-ink/violet hero, warm white surfaces, asymmetric desktop bento, two-column tablet, and one-column mobile layout. The plan card is the visual anchor. Cards expose labeled `Abrir`, `Editar`, `Imprimir`, `Baixar`, and derived-material `Regenerar` actions without making the entire multi-action card clickable. Confirmation is mandatory after manual edits.

- [ ] **Step 4: Verify UI quality and commit**

Run: `npm run test:lesson-kit; npm run lint`
Expected: both commands PASS.

```powershell
git add frontend/src/app/dashboard/kit frontend/src/components/lesson-kit frontend/src/app/globals.css frontend/scripts/lesson-kit-ui.test.mjs
git commit -m "feat: build premium lesson kit hub"
```

### Task 8: Present One Kit Identity in the Library

**Files:**
- Modify: `src/main/java/br/com/edudocsai/dto/document/DocumentResponse.java`
- Modify: `src/main/java/br/com/edudocsai/service/DocumentService.java`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/app/dashboard/documents/page.tsx`
- Modify: `frontend/src/components/dashboard/recent-documents.tsx`
- Test: `src/test/java/br/com/edudocsai/service/DocumentServiceTest.java`
- Modify: `frontend/scripts/lesson-kit-ui.test.mjs`

- [ ] **Step 1: Write failing backend and frontend tests**

```java
assertThat(response.kitId()).isEqualTo(42L);
assertThat(response.kitStatus()).isEqualTo(LessonKitStatus.READY);
assertThat(response.readyMaterialCount()).isEqualTo(6);
```

```javascript
assert.match(documentsPage, /Kit de Aula/);
assert.match(documentsPage, /readyMaterialCount/);
assert.doesNotMatch(documentsPage, /materials\.map/);
```

- [ ] **Step 2: Verify failure**

Run: `.\mvnw.cmd -Dtest=DocumentServiceTest test; npm run test:lesson-kit`
Expected: missing response fields and library kit presentation.

- [ ] **Step 3: Add kit summary fields and library routing**

Extend `DocumentResponse` with nullable `kitId`, `kitStatus`, and `readyMaterialCount`. Batch-fetch kit summaries for paginated documents to avoid N+1 queries. Show one `Kit de Aula` library card with `6 materiais` or partial readiness, and route it to `/dashboard/kit/{kitId}`. Unpromoted plans remain normal plan entries.

- [ ] **Step 4: Verify and commit**

Run: `.\mvnw.cmd -Dtest=DocumentServiceTest test; npm run test:lesson-kit; npm run lint`
Expected: PASS.

```powershell
git add src/main/java/br/com/edudocsai/dto/document/DocumentResponse.java src/main/java/br/com/edudocsai/service/DocumentService.java src/test/java/br/com/edudocsai/service/DocumentServiceTest.java frontend/src/lib/types.ts frontend/src/app/dashboard/documents/page.tsx frontend/src/components/dashboard/recent-documents.tsx frontend/scripts/lesson-kit-ui.test.mjs
git commit -m "feat: promote kits in document library"
```

### Task 9: Full Verification and Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-06-30-premium-lesson-kit-hub-design.md` only if implementation exposes an approved naming correction.

- [ ] **Step 1: Run focused backend verification**

Run: `.\mvnw.cmd -Dtest=LessonKitRepositoryIntegrationTest,LessonKitContentMapperTest,LessonKitServiceTest,LessonKitControllerTest,DocumentServiceTest test`
Expected: PASS with zero failures.

- [ ] **Step 2: Run the complete backend suite**

Run: `.\mvnw.cmd test`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Run frontend tests and static checks**

Run: `npm run test:lesson-kit; npm run test:document-template; npm run lint; npm run build`
Expected: all commands PASS and Next.js build completes.

- [ ] **Step 4: Perform visual and accessibility verification**

Open lesson plan, generation progress, ready hub, partial hub, and library at 375, 768, 1024, and 1440 widths. Verify keyboard-only navigation, visible focus, status text without color dependency, 44px targets, and reduced-motion behavior. Compare against the approved `Central Pedagógica Premium` prototype.

- [ ] **Step 5: Document the feature and commit**

Add the deferred flow, endpoints, compatibility behavior, and verification commands to `README.md`.

```powershell
git add README.md
git commit -m "docs: document premium lesson kit hub"
```

## Deferred Companion Plan

The classroom roadmap is intentionally excluded from this implementation plan. After this hub is stable, create a separate plan from `docs/superpowers/specs/2026-06-30-classroom-kit-roadmap-design.md`; it will consume the stable `LessonKit` identifiers and material order created here.
