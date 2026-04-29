# Inbox Scan Spec (Layer 2) — 1‑Page Template

## Goal
Describe the single outcome this automation must achieve each morning.

## Inputs (Sources & Scope)
- Email account(s):
- Search window: (e.g., “yesterday 00:00–23:59 local time”)
- Exclusions: (promotions, social, updates, forums, etc.)
- Optional context sources: (none for v1)

## Tools & Permissions (Read‑Only Where Possible)
- Email: read/search only, never send
- Notion: create/update tasks only
- Calendar: none
- Filesystem: none (optional state file location below)

## Priority Framework (P1–P4)
P1 — Hard consequence if missed. Test:
P2 — Time‑sensitive with compounding delay cost. Test:
P3 — Important, flexible timing. Test:
P4 — Do when there’s space. Test:

## Triage Rules (What Becomes a Task)
Include if:
- Direct asks or deliverables assigned to me
- Explicit scheduling requests requiring action
- Commitments I made that need follow‑up

Skip if:
- FYIs / no action requested
- Newsletters and non-actionable notifications
- Do not skip bills solely because they are notifications
- Threads already captured as tasks

## Task Creation Rules (Notion)
- Title format: Verb‑first (“Send revised deck to …”)
- Priority: P1–P4 (from framework)
- Due date: inferred from email context; if none, use ______
- Duration estimate: ______ (default if unknown)
- Project / area: ______
- Context: include email snippet + link to source email

## De‑duplication Rules
- Match on: (subject, sender, thread ID, key phrases)
- If duplicate exists (open): update existing vs create new
- If duplicate exists (done): skip

## State Tracking
- Last successful scan timestamp stored at: ______
- Search window uses state file to avoid re‑processing

## Safety Boundaries
- Never send email
- Never edit calendar
- Never delete or archive email

## Output Format (Daily Summary)
- Count of emails scanned
- Count of tasks created
- Count skipped (FYI/newsletter/duplicate)
- List of tasks created with priority + due date

## Goose Mapping (Fill Later)
- Email tool:
- Notion tool:
- Execution command:
