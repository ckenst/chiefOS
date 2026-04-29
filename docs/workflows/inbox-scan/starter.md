# Chief of Staff v1 — Inbox Scan Spec Starter

## Summary
We’ll create two deliverables you can fill in immediately:
1. A concise 1-page spec template for the Inbox Scan (Layer 2).
2. A questionnaire checklist to capture remaining decisions (workflow, priorities, schema).
This v1 is read-only on email and creates tasks in a new Notion database.

## Key Changes / Interfaces
1. Notion Tasks DB (new)
   - Define a minimal schema tailored to inbox-derived tasks (title, priority, due date, duration, source email link, status, project, context).
   - Decide on a single canonical “task create/update” interface for the automation (fields required vs optional).
2. Gmail Read Scope
   - Define query boundaries: date window (yesterday), exclude promotions/social/updates/forums.
   - Explicit skip rules for FYIs, newsletters, and automated notifications.
3. Priority Framework
   - Embed your P1–P4 rules directly into the spec; make each test unambiguous.

## Implementation Changes (Spec-Only Deliverables)
1. 1-Page Spec Template (Layer 2: Inbox Scan)
   - Sections: Goal, Inputs, Tools & Permissions, Priority Framework, Triage Rules, Task Creation Rules, De-duplication Rules, State Tracking, Safety Boundaries, Output Format.
2. Questionnaire Checklist
   - Prompts to fill in: Notion schema, projects/tags, due-date heuristics, duration heuristics, duplicate matching logic, state file location, and review workflow.
3. Integration-Neutral Notes
   - Add a short “Goose mapping” appendix that stays empty for now; later we’ll map each tool to Goose’s connectors.

## Test Plan (for the spec itself)
1. Walk through 10 recent emails and ensure the spec would:
   - Create tasks for actionable items.
   - Skip FYIs/newsletters.
   - Assign correct priority using your P1–P4 definitions.
2. Validate the Notion schema can represent every task you expect from the sample.
3. Confirm safety: no email drafts or sends, no calendar access.

## Assumptions
- We start with Layer 2 (Inbox Scan) only.
- We use Gmail + Notion, with a new Notion tasks database.
- The v1 automation is read-only on email and creates tasks only.
- Platform-agnostic spec (not Goose-specific yet), but Goose is the likely runtime later.
