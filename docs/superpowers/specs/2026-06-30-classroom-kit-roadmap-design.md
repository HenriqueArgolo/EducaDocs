# Classroom Kit Roadmap Design

## Goal

Turn kits linked to a classroom into a teacher-controlled pedagogical roadmap with both a weekly kit progression and a clear implementation sequence inside each kit.

## Dependency

This project begins after the aggregate and material identities from `2026-06-30-premium-lesson-kit-hub-design.md` are stable. It consumes complete lesson kits; it does not generate or edit their pedagogical content.

## Product Decisions

- Linking a kit to a classroom adds it to a draft roadmap.
- The roadmap has a macro level for kits over time and a micro level for stages inside a kit.
- AI suggestions are recommendations, never silent publication decisions.
- The teacher approves, rejects, or reorders every suggested sequence.
- Manual ordering remains authoritative until the teacher explicitly requests another AI suggestion.
- The teacher answer key is support attached to activity and assessment; it is not a student-facing milestone.

## Default Internal Sequence

1. Plano.
2. Atividade.
3. Avaliação.
4. Evidências.
5. Adaptações.

The teacher can adjust this order when classroom reality requires it. The system must preserve a visible distinction between the approved sequence and a pending AI suggestion.

## Roadmap Experience

### Linking

From the kit hub, the teacher chooses an owned classroom and an intended week or date range. The system creates one draft classroom link. Duplicate links return the existing roadmap item instead of creating another.

### Macro Roadmap

The classroom page presents kits in chronological order with topic, subject, grade, period, readiness, and approval state. The teacher can move a kit, change its dates, open its hub, or unlink it.

### AI Suggestion

On explicit request, the AI receives the classroom's linked kits, topics, BNCC skills, dates, and current teacher order. It returns:

- A proposed kit order.
- A short pedagogical reason for each meaningful change.
- Warnings when dates or prerequisites conflict.

The result is displayed as a reviewable draft. Nothing changes until approval.

### Micro Roadmap

Expanding a kit shows its internal stages. Completed, current, upcoming, blocked, and optional states use icon-and-text labels. Each stage links back to the corresponding kit material.

## Visual Direction

- Continue the approved `Central Pedagógica Premium` design system.
- Use a horizontal timeline on desktop and a vertical stepper on mobile.
- Maintain one primary action per state: request suggestion, review suggestion, or approve sequence.
- Use motion only to explain reordering and expansion, lasting 150–300 ms and respecting reduced motion.
- Avoid dense project-management visuals; this is a teaching sequence, not a generic Kanban board.

## Domain Model

Add `ClassroomLessonKit` with:

- Classroom and kit identifiers.
- Start and end dates.
- Teacher-approved macro position.
- Internal stage order.
- Link status.
- Suggestion status and explanation.
- Optimistic-lock version.
- Created and updated timestamps.

AI suggestion payloads are drafts and remain separate from approved order until confirmation.

## API Boundaries

- Link and unlink an owned kit and classroom.
- List the classroom roadmap.
- Update dates and manual order.
- Request an AI suggestion.
- Read the pending suggestion.
- Approve or reject the suggestion.
- Update internal stage order.

All mutations verify ownership and version. Order updates are atomic.

## Error and Recovery

- Duplicate link: return the existing roadmap item.
- Invalid date range: reject inline and preserve the draft form.
- Suggestion timeout: preserve the approved sequence and allow retry.
- Suggestion conflict: show the conflicting dates or prerequisite without changing order.
- Stale reorder: reject using versioning, reload current order, and explain the conflict.
- Unavailable kit material: mark the stage blocked and link to its recovery action in the hub.
- Unauthorized classroom or kit: do not reveal whether it exists.

## Accessibility and Responsive Behavior

- Drag-and-drop has keyboard move-up and move-down alternatives.
- Focus follows the moved item after reordering.
- State is never conveyed by color alone.
- Mobile uses a vertical sequence without horizontal page scrolling.
- Screen readers receive a concise order summary and change announcements.
- Touch targets are at least 44 by 44 pixels.

## Testing

### Backend

- Link an owned ready kit to an owned classroom.
- Duplicate linking is idempotent.
- Ownership and date validation.
- Manual order persistence and optimistic locking.
- AI suggestion does not modify approved order.
- Approval atomically promotes the suggestion.
- Rejection preserves approved order.
- Internal stage order persistence.

### Frontend

- Draft link flow and recoverable validation.
- Macro roadmap ordering and date editing.
- Pending suggestion comparison and explanations.
- Approve, reject, and manual override behavior.
- Micro roadmap links to the correct kit materials.
- Keyboard-accessible reorder controls.
- Horizontal desktop and vertical mobile presentations.
- Reduced-motion and accessible state announcements.

## Non-Goals

- Generating lesson-kit materials.
- Automatically publishing an AI sequence.
- Replacing the teacher's timetable.
- Sequencing kits across unrelated classrooms.
- Student-facing assignment delivery or grading.
