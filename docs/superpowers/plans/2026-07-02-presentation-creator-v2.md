# Presentation Creator v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved three-step presentation creator with an editable pedagogical outline and a diverse, filterable theme gallery.

**Architecture:** Keep API and backend outline work already present. Extract presentation-creator configuration and presentational components from the route so filtering, labels and accessibility states remain testable without coupling them to navigation or API calls. The route owns form state, async actions and routing.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Node contract tests.

---

### Task 1: Lock the creator contract with a failing test

**Files:**
- Create: `frontend/scripts/presentation-creator-ui.test.mjs`
- Create: `frontend/src/components/presentation-creator/catalog.ts`

- [ ] Write a Node contract test that imports the catalog and asserts: 12 theme IDs, Chalkie as default, separate pedagogical and accessibility filters, filter intersection behavior, and pedagogical labels for the first eight slides.
- [ ] Run `node scripts/presentation-creator-ui.test.mjs` from `frontend`; expect failure because `catalog.ts` does not exist.
- [ ] Implement exported `PRESENTATION_THEMES`, `THEME_FILTERS`, `DEFAULT_THEME_ID`, `PEDAGOGICAL_FUNCTIONS` and `filterPresentationThemes()` in `catalog.ts`.
- [ ] Run the test again; expect `presentation creator UI contract passed`.

### Task 2: Build focused wizard components

**Files:**
- Create: `frontend/src/components/presentation-creator/CreatorProgress.tsx`
- Create: `frontend/src/components/presentation-creator/ThemeGallery.tsx`
- Create: `frontend/src/components/presentation-creator/OutlineEditor.tsx`
- Modify: `frontend/scripts/presentation-creator-ui.test.mjs`

- [ ] Extend the contract test to assert progress labels `Tema`, `Refinar`, `Aparência`, accessible step metadata, theme radio semantics, outline reorder-ready rows, and no emoji structural labels.
- [ ] Run the test and confirm it fails on missing components.
- [ ] Implement a centered progress indicator, a radio-like filterable theme gallery, and the editable outline list with add/remove controls and pedagogical function badges.
- [ ] Re-run the contract test and confirm it passes.

### Task 3: Integrate the approved route layout

**Files:**
- Modify: `frontend/src/app/dashboard/slides/new/page.tsx`
- Modify: `frontend/scripts/presentation-creator-ui.test.mjs`

- [ ] Extend the test to require the three extracted components, fixed action footer, disabled honest upload state, `aria-live` errors, retryable outline action, and an empty-outline guard.
- [ ] Run the test and confirm route assertions fail.
- [ ] Replace the oversized card layout with the approved centered composer, compact configuration controls, inline outline action, extracted refinement editor and theme gallery.
- [ ] Preserve classroom locking, `generateOutline`, `generatePresentation`, timeline linking and `?theme=` navigation.
- [ ] Re-run the contract test and confirm it passes.

### Task 4: Quality and visual verification

**Files:**
- Modify only files required by failures found in verification.

- [ ] Run `npm run lint` and resolve introduced errors.
- [ ] Run `npx tsc --noEmit` and resolve type errors.
- [ ] Run `npm run build` and confirm the production build succeeds.
- [ ] Start the app, inspect `/dashboard/slides/new` at 1440 px and 375 px, and verify all three steps, keyboard focus, selected theme state and sticky footer spacing.
- [ ] Compare the implementation with the approved companion mockup and remove one unnecessary decorative element if the visual hierarchy is crowded.

