# Shutdown Command - Implementation Plan

## Goal
Implement a first CoS command, `/shutdown`, that captures a freeform brain dump and sorts it into:
- TODOs / action items
- Knowledgebase items
- Calendar items

## Recommended MVP
Start with a review-only workflow that is specified independently from any one host, then use it inside Codex chat first before building external integrations.

Why:
- It lets us validate the capture and classification rules first.
- It avoids premature coupling to Notion, Google Calendar, or a knowledgebase.
- It keeps the first version simple enough to test daily.
- It preserves portability across Codex on Windows/Mac and Goose on Mac.

## MVP User Flow
1. You type `/shutdown`.
2. The CoS replies with a fixed capture prompt.
3. You paste one large brain dump.
4. The CoS parses the dump into candidate items.
5. The CoS returns four sections:
   - TODOs / action items
   - Knowledgebase items
   - Calendar items
   - Ambiguous / needs review
6. You review and optionally ask for edits or export.

## Implementation Shape

### v1 Decision: Prompt-only workflow
Use `/shutdown` as a repeatable prompt workflow in chat. The source of truth is the prompt contract in this repo, not a local app, script, or integration.

Pros:
- Fastest to ship
- No app code required
- Easy to iterate on classification behavior

Tradeoffs:
- No persistence by default
- No external task, calendar, or knowledgebase writes in v1
- The user manually reviews the grouped output before doing anything with it

## Recommendation
Implement `/shutdown` as a prompt workflow first, but define it in host-agnostic terms so it can later be reproduced in Codex, Goose, or another chat host without changing the core behavior.

## Portability Constraint

Design `/shutdown` as three layers:
1. Workflow contract
   - The user invokes shutdown
   - The system asks for a brain dump
   - The system classifies items into fixed buckets
   - The system returns a structured review
2. Prompt contract
   - The exact capture prompt
   - The exact classification rules
   - The exact output structure
3. Host adapter
   - Codex prompt workflow
   - Goose prompt workflow
   - Future skill, wrapper, or automation only after the prompt behavior is stable

Only the host adapter should be tool-specific. The workflow contract and prompt contract should remain shared across environments.

## Core Prompt Contract

### Trigger
The user types `/shutdown`.

### Assistant response
Return this style of prompt:

"Paste everything still in your head or sitting in temporary places. Include rough notes, reminders, ideas, commitments, dates, and anything unfinished. I will sort it into TODOs, knowledgebase items, calendar items, and anything ambiguous."

### Classification rules
- A TODO / action item is something that requires you to do, decide, follow up on, or deliver something.
- A knowledgebase item is information worth preserving for later reference, but not something that requires immediate action.
- A calendar item is time-bound and belongs on a schedule, reminder, or event list.
- If an item fits more than one bucket, prefer:
  1. Calendar item if timing is the primary need
  2. TODO if execution is the primary need
  3. Knowledgebase item if reference is the primary need
- If the item is too unclear to classify safely, place it in Ambiguous / needs review.

### Output format
The result should always include:
1. TODOs / action items
2. Knowledgebase items
3. Calendar items
4. Ambiguous / needs review

For each item, preserve enough detail to reconstruct the original intent.

## Suggested MVP Output Template

### TODOs / Action Items
- [title] - [supporting detail]

### Knowledgebase Items
- [topic] - [supporting detail]

### Calendar Items
- [item] - [date/time if present] - [supporting detail]

### Ambiguous / Needs Review
- [item] - [why it is ambiguous]

## Minimal Files To Build

### 1. Prompt spec
Store the shutdown prompt contract in this repo so the behavior stays consistent.

### 2. Example inputs/outputs
Create a small test fixture file with realistic end-of-day brain dumps and expected classifications.

### 3. Optional future adapter
Later, add a skill, wrapper, or automation only if prompt-only usage proves the workflow is valuable and stable.

## Suggested File Layout
- `shutdown-command-spec-starter.md`
- `shutdown-command-questionnaire-checklist.md`
- `shutdown-command-implementation-plan.md`
- `examples/shutdown-sample-input.md`
- `examples/shutdown-sample-output.md`

## Phase Plan

### Phase 1 - Prompt Workflow MVP
- Finalize classification rules
- Use `/shutdown` as a repeatable prompt pattern
- Review results manually
- Refine based on a week of real usage

### Phase 2 - Structured output
- Add stricter formatting
- Add extraction of due dates, names, projects, and notes
- Add an explicit ambiguous bucket

### Phase 3 - Optional Persistence
- Save raw dump plus classified output locally
- Add a simple history log for later review

### Phase 4 - Optional Integrations
- TODOs -> task system
- Knowledgebase items -> notes store
- Calendar items -> calendar queue or direct event creation

## What We Need To Decide Before Adding Adapters
- Whether v1 should save raw dumps locally
- Whether one item can appear in multiple buckets
- Whether the CoS should ask clarifying questions before producing output

## Recommended Defaults
- Run `/shutdown` first as a prompt workflow in chat
- Accept one freeform paste
- Return grouped review output only
- Preserve ambiguous items instead of guessing
- No external writes in v1
- Keep the classification contract portable so the same behavior can be reused in Goose later

## First Implementation Step
The first implementation step is not code. It is using the prompt workflow with realistic shutdown dumps and refining the expected outputs until classification quality feels reliable.
