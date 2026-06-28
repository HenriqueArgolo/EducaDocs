# Lesson Plan Generation 500 Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore lesson-plan generation, persist its planning period, and disable the school header for lesson plans in both backend and frontend.

**Architecture:** Keep lesson-plan request normalization in `LessonPlanRequestContext`, persist only fields owned by `GenerationRequest`, and leave classroom/timeline identifiers as operational context. Put the frontend document-type rules in a small pure module so the form and payload use the same behavior and can be tested without rendering React.

**Tech Stack:** Java 17, Spring Boot, JPA/Lombok, Flyway, JUnit 5/AssertJ/Mockito, Next.js 16, TypeScript, Node assertions.

---

### Task 1: Backend regression and compile fix

**Files:**
- Modify: `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanGenerationServiceTest.java`
- Modify: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilder.java`
- Modify: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanGenerationService.java`

- [ ] **Step 1: Write the failing persistence regression assertion**

Capture the argument passed to `generationRequestRepository.save` in the successful generation test and assert:

```java
ArgumentCaptor<GenerationRequest> requestCaptor = ArgumentCaptor.forClass(GenerationRequest.class);
verify(generationRequestRepository).save(requestCaptor.capture());
assertThat(requestCaptor.getValue().getPlanningPeriod()).isEqualTo(PlanningPeriod.SINGLE);
assertThat(requestCaptor.getValue().getIncludeHeader()).isFalse();
```

- [ ] **Step 2: Run the targeted test and verify red**

Run: `.\mvnw.cmd -Dtest=LessonPlanGenerationServiceTest test`

Expected: FAIL during compilation on the invalid `includeHeader()`, `getPlanningPeriod()`, `classroomId(...)`, or `timelineItemId(...)` calls.

- [ ] **Step 3: Apply the minimal backend correction**

In `LessonPlanPromptBuilder`, replace every `context.getPlanningPeriod()` with `context.planningPeriod()` and use the already-normalized value directly:

```java
String masterPromptGuidance = promptModuleCatalog.lessonPlanTaskGuidance(level, context.planningPeriod());
PlanningPeriod period = context.planningPeriod();
```

In `LessonPlanGenerationService.save`, keep valid builder fields and replace the invalid block with:

```java
.numberOfQuestions(0)
.includeHeader(false)
.planningPeriod(context.planningPeriod())
.build());
```

- [ ] **Step 4: Run the targeted backend tests**

Run: `.\mvnw.cmd -Dtest=LessonPlanGenerationServiceTest,LessonPlanPromptBuilderTest,LessonPlanRequestValidatorTest test`

Expected: PASS.

### Task 2: Database migration

**Files:**
- Create: `src/main/resources/db/migration/V15__add_planning_period_to_generation_requests.sql`

- [ ] **Step 1: Add the missing Flyway migration**

```sql
ALTER TABLE generation_requests
    ADD COLUMN planning_period VARCHAR(20) NOT NULL DEFAULT 'SINGLE';
```

- [ ] **Step 2: Verify the backend compiles with the mapped column**

Run: `.\mvnw.cmd -DskipTests compile`

Expected: `BUILD SUCCESS`.

### Task 3: Frontend header rule

**Files:**
- Create: `frontend/src/lib/document-generation.ts`
- Create: `frontend/scripts/document-generation.test.mjs`
- Modify: `frontend/src/components/create/step-instructions.tsx`
- Modify: `frontend/src/app/dashboard/new/page.tsx`
- Modify: `frontend/package.json`

- [ ] **Step 1: Write the failing pure-rule test**

```javascript
import assert from "node:assert/strict";
import { includeHeaderForDocument, shouldShowSchoolHeader } from "../src/lib/document-generation.ts";

assert.equal(shouldShowSchoolHeader("LESSON_PLAN"), false);
assert.equal(shouldShowSchoolHeader("EXAM"), true);
assert.equal(includeHeaderForDocument("LESSON_PLAN", true), false);
assert.equal(includeHeaderForDocument("EXAM", true), true);
assert.equal(includeHeaderForDocument("EXAM", false), false);
```

- [ ] **Step 2: Run the frontend test and verify red**

Run: `node --experimental-strip-types scripts/document-generation.test.mjs` from `frontend`.

Expected: FAIL because `src/lib/document-generation.ts` does not exist.

- [ ] **Step 3: Add and consume the shared rule**

Create `document-generation.ts`:

```typescript
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
```

Use `shouldShowSchoolHeader(documentType)` around the header control in `step-instructions.tsx`. Use `includeHeaderForDocument(formData.documentType, formData.includeHeader)` when building the API request in `page.tsx`. Add the test command as `test:document-generation` in `package.json`.

- [ ] **Step 4: Verify the frontend rule, lint, and build**

Run from `frontend`:

```powershell
npm run test:document-generation
npm run lint
npm run build
```

Expected: all commands exit 0.

### Task 4: Full verification and commit

**Files:**
- Verify all files modified above.

- [ ] **Step 1: Run backend verification**

Run: `.\mvnw.cmd test`

Expected: `BUILD SUCCESS` with all tests passing.

- [ ] **Step 2: Check the patch**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors and only the planned files modified.

- [ ] **Step 3: Commit the implementation**

```powershell
git add -- src frontend docs/superpowers/plans/2026-06-28-lesson-plan-generation-500-fix.md
git commit -m "fix: restore lesson plan generation"
```
