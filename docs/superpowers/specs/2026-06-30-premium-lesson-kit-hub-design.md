# Premium Lesson Kit Hub Design

## Goal

Transform the complete lesson kit from hidden sections inside a lesson-plan document into a first-class product experience. The teacher generates the lesson plan first, explicitly creates the derived kit, manages six independent materials in one premium hub, and can link the kit to a classroom roadmap.

## Product Promise

> Turn an approved lesson plan into a classroom-ready weekly kit with an activity, answer key, assessment, pedagogical evidence, and inclusive adaptations—all organized, editable, printable, and reusable.

## Scope

This project covers:

1. The post-generation lesson-plan state and its `Criar kit completo` call to action.
2. Deferred generation of the five derived materials.
3. A first-class `Kit de Aula` identity in the library.
4. A premium kit hub containing six independent material cards.
5. Independent open, edit, print, download, and regenerate actions.
6. The stable kit identity and material ordering required by the later classroom-roadmap project.

The project does not redesign other document types.

## Core Product Decisions

- The lesson plan is generated first. The system does not generate the other five materials in the initial request.
- A single prominent CTA, `Criar kit completo`, appears after the lesson plan succeeds.
- Activating the CTA creates all five derived materials in one asynchronous kit-generation operation.
- Once generation succeeds, the library item changes identity from `Plano de Aula` to `Kit de Aula` rather than creating six unrelated library entries.
- The default title follows `Kit de Aula <periodo> — <ano> — <disciplina>`, with the topic shown as secondary context. Example: `Kit de Aula Semanal — 6º ano — Matemática`.
- The six materials remain children of one kit and can be managed independently.
- Regenerating one child never overwrites the other five.
- Classroom linking and AI sequencing are specified separately in `2026-06-30-classroom-kit-roadmap-design.md`.

## Experience Architecture

### State 1: Lesson Plan Ready

The existing lesson-plan result becomes a focused success state. It presents:

- Lesson topic, grade, subject, planning period, and BNCC context.
- A clear lesson-plan preview and its normal actions.
- One primary CTA: `Criar kit completo`.
- Supporting copy that names the five additional outputs and explains the benefit.

The old sidebar labeled `Navegação do Kit` must not appear before a kit exists.

### State 2: Kit Generation

Generation uses meaningful progress instead of a blocking generic spinner:

- The CTA becomes disabled immediately to prevent duplicate submissions.
- The interface displays the five material stages in order.
- Completed, active, queued, and failed stages have distinct icon-and-text states; color is not the only indicator.
- The active stage may use a restrained shimmer inspired by 21st.dev loading patterns.
- Progress is accessible through an `aria-live` status region.
- The teacher may leave the page. Returning to the lesson plan resumes the current server-side job state.

The initial generation order is:

1. Student activity.
2. Teacher answer key.
3. Assessment instrument.
4. Pedagogical evidence.
5. Inclusive adaptations.

The order communicates progress; the backend may generate compatible steps concurrently if that does not weaken validation or recovery.

### State 3: Premium Kit Hub

The completed kit opens as a product hub, not as one long document. Its information hierarchy is:

1. Hero summary with kit identity and essential pedagogical metadata.
2. Overall readiness and classroom-link status.
3. Asymmetric bento grid of six material cards.
4. Secondary actions such as linking to a classroom or exporting the complete kit.

The lesson-plan card is the visual anchor and occupies more space. The remaining cards are:

- Atividade do aluno.
- Gabarito do professor.
- Instrumento avaliativo.
- Evidências pedagógicas.
- Adaptações inclusivas.

Each card shows its material status and exposes:

- `Abrir`.
- `Editar`.
- `Imprimir`.
- `Baixar`.
- `Regenerar` for the five derived materials.

Regeneration requires confirmation when the current material contains manual edits. The confirmation explicitly states that only that material will be replaced.

## Visual Direction

The approved direction is `Central Pedagógica Premium`:

- Calm premium educational SaaS rather than playful classroom software.
- Deep ink and violet for high-value surfaces, warm white content surfaces, and restrained semantic accents.
- Asymmetric bento organization for scanability without turning the screen into a generic card wall.
- One primary CTA per state.
- Lucide vector icons with consistent stroke and size; no emoji as structural icons.
- Strong typographic hierarchy, generous whitespace, and a 4/8-point spacing rhythm.
- Border, elevation, radius, focus, and motion values must come from shared design tokens.
- Motion lasts 150–300 ms for interactions, communicates cause and effect, and respects `prefers-reduced-motion`.
- Text and interaction contrast must meet WCAG AA; all interactive targets must be at least 44 by 44 pixels.

21st.dev patterns are references, not wholesale dependencies. The implementation may adapt a Bento Grid composition and restrained shimmer/loading effect into local components that match the existing Next.js and Tailwind stack.

## Domain Model

The current embedded `kitAulaCompleta` JSON is insufficient as the only source of truth because independent lifecycle operations need stable identities and statuses.

Introduce a kit aggregate:

- `LessonKit`: identity, owner, source lesson-plan document, title, period, overall status, timestamps.
- `LessonKitMaterial`: identity, kit, material type, content, status, version, generation error, timestamps.

Material types are `LESSON_PLAN`, `STUDENT_ACTIVITY`, `TEACHER_ANSWER_KEY`, `ASSESSMENT`, `PEDAGOGICAL_EVIDENCE`, and `INCLUSIVE_ADAPTATIONS`.

Existing lesson plans that already contain `kitAulaCompleta` remain readable. A compatibility adapter presents them through the hub without requiring an immediate destructive migration. They may be promoted to persisted kit/material records when first edited, regenerated, or linked to a classroom.

## API Boundaries

Required capabilities:

- Create a kit from an existing owned lesson plan.
- Read the aggregate hub state and all material summaries.
- Read and update one material.
- Regenerate one derived material.
- Download or print one material.
- Export the complete kit.

Every operation verifies ownership. Create and regenerate operations are idempotent against duplicate clicks. Long-running operations expose server-side status so page refresh does not lose progress.

## Generation and Data Flow

1. The teacher generates and reviews a lesson plan.
2. The frontend requests kit creation using the lesson-plan identifier.
3. The backend validates document ownership, type, and readiness.
4. The backend creates the kit aggregate and five queued derived materials.
5. The generation service derives each material from canonical plan content, topic, grade, subject, BNCC skills, duration, and teacher instructions.
6. Each material is validated independently before becoming `READY`.
7. The hub reports partial progress without exposing invalid material content.
8. Overall kit status becomes `READY` only when all required materials are ready.
9. Independent regeneration creates the next material version and atomically replaces the visible version only after validation succeeds.

The existing canonical plan remains unchanged when a child material is regenerated.

## Error and Recovery States

- Kit creation conflict: if a kit already exists, return the existing kit and navigate to it.
- Partial generation failure: preserve completed materials, mark the failed material with a clear reason and `Tentar novamente`, and keep overall status `PARTIAL`.
- Provider timeout: retain queued or failed server state and allow retry without duplicating the kit.
- Regeneration failure: keep the previous valid version visible and report that no content was replaced.
- Stale edit: reject conflicting updates using material versioning and invite the user to reload.
- Authorization failure: do not reveal whether another user's kit or classroom exists.

## Library Behavior

- Before kit creation, the item remains a normal lesson plan.
- During creation, it displays `Criando kit` with progress.
- After at least the aggregate exists, it is presented as `Kit de Aula` with the count of ready materials and an incomplete-state badge when needed.
- Search covers title, topic, grade, subject, and classroom.
- Filtering distinguishes lesson plans from complete lesson kits without listing each child material separately.

## Responsive Behavior

- Desktop: persistent application navigation and asymmetric bento grid.
- Tablet: two-column grid with the lesson-plan card spanning the available width where useful.
- Mobile: one-column priority order, sticky primary action where appropriate, and no nested horizontal scrolling.
- Material actions collapse into a clearly labeled overflow menu only when space requires it.

## Accessibility

- Semantic headings and landmarks follow visual order.
- Cards are not clickable containers when they contain multiple actions.
- Keyboard focus is visible and predictable.
- Generation and regeneration status changes are announced politely.
- Status uses icons and text in addition to color.
- Reduced motion removes shimmer and nonessential transitions while keeping progress understandable.

## Testing Strategy

### Backend

- Kit creation from an owned lesson plan.
- Duplicate creation returns the existing kit.
- Invalid source document type is rejected.
- Each derived material is validated independently.
- Partial failure preserves ready materials.
- Regeneration replaces only the requested material after success.
- Failed regeneration preserves the previous valid version.
- Legacy embedded kits remain readable.
- DOCX/material export isolation.

### Frontend

- Lesson plan shows the CTA only when eligible.
- Loading state reports material-level progress and prevents duplicate submission.
- Hub displays all six cards and correct statuses.
- Independent actions target the correct material.
- Manually edited material requires confirmation before regeneration.
- Library shows one kit item, not six children.
- Legacy embedded kit uses the compatibility view.
- Responsive behavior at 375, 768, 1024, and 1440 pixels.
- Keyboard navigation, focus visibility, accessible status announcements, and reduced motion.

## Rollout

1. Add the kit aggregate and compatibility read path behind a feature flag.
2. Add deferred generation and hub API.
3. Release the post-plan CTA and premium hub.
4. Promote compatible embedded kits on demand.
5. Begin the separate classroom-roadmap plan after the hub is stable.

The rollout keeps old documents usable and allows the hub and roadmap to be verified independently.

## Non-Goals

- Generating the complete kit during initial lesson-plan generation.
- Creating six top-level library documents.
- Classroom roadmap UI, linking, and AI sequencing, which belong to the companion specification.
- Redesigning exams, rubrics, reports, or unrelated dashboard areas.
- Requiring all historical embedded kits to migrate in one batch.
