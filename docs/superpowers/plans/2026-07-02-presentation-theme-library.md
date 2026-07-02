# Presentation Theme Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver 180 compositional presentation themes across ten pedagogical and eight inclusive categories.

**Architecture:** A typed library generates themes from category-owned art directions and ten composition blueprints. The creation gallery renders structural previews from those definitions. The editor resolves selected IDs dynamically and adds theme atmosphere while retaining legacy theme compatibility.

**Tech Stack:** TypeScript, React 19, Next.js, Tailwind CSS, Framer Motion, Lucide React, Node contract tests.

---

### Task 1: Theme library contract

**Files:**
- Create: `frontend/scripts/presentation-theme-library.test.mjs`
- Create: `frontend/src/lib/presentation-themes.ts`

- [ ] Write a failing test for 18 categories, 180 unique themes, ten themes per category, ten composition systems and complete inclusive profiles.
- [ ] Run the test and verify module-not-found failure.
- [ ] Implement typed category definitions, composition blueprints, theme generation, lookup and filtering.
- [ ] Run the test and expect `presentation theme library contract passed`.

### Task 2: Structural preview gallery

**Files:**
- Create: `frontend/src/components/presentation-creator/ThemePreview.tsx`
- Modify: `frontend/src/components/presentation-creator/ThemeGallery.tsx`
- Modify: `frontend/src/app/dashboard/slides/new/page.tsx`
- Modify: `frontend/scripts/presentation-theme-library.test.mjs`

- [ ] Add failing source assertions for search, pedagogical/inclusive grouping and structural preview regions.
- [ ] Implement category navigation, search and theme composition previews.
- [ ] Pass the selected theme ID unchanged to the editor URL.
- [ ] Re-run the contract test.

### Task 3: Dynamic editor theme resolution

**Files:**
- Create: `frontend/src/components/presentation-theme/ThemeAtmosphere.tsx`
- Modify: `frontend/src/app/dashboard/slides/[id]/page.tsx`
- Modify: `frontend/scripts/presentation-theme-library.test.mjs`

- [ ] Add failing assertions that the editor calls `getPresentationTheme`, accepts string IDs and renders `ThemeAtmosphere`.
- [ ] Resolve dynamic styles from theme tokens while preserving legacy themes.
- [ ] Render composition-specific atmosphere and expose the full theme list in the editor selector.
- [ ] Re-run the contract test.

### Task 4: Verification

**Files:**
- Modify only files implicated by verification failures.

- [ ] Run focused theme tests.
- [ ] Run ESLint on touched files.
- [ ] Run an isolated TypeScript project covering the creator and editor theme modules.
- [ ] Request the local creator route and confirm HTTP 200.
- [ ] Record unrelated global build failures separately.

