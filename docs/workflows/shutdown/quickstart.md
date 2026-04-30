# `/shutdown` Quickstart

`/shutdown` is the first working ChiefOS workflow.

It is intentionally prompt-only in v1:
- no app code
- no task/calendar/notes integrations
- no automatic persistence
- no external writes

## How To Run It

1. Start a chat with ChiefOS.
2. Type `/shutdown`.
3. Use the capture prompt from `prompts/shutdown.md`.
4. Paste one messy brain dump.
5. Return the classified review using the output template.
6. Manually review the result before moving anything into tasks, notes, or a calendar.

## Expected Behavior

The assistant should sort the dump into four sections:
- TODOs / action items
- Knowledgebase items
- Calendar items
- Ambiguous / needs review

The workflow should:
- preserve all meaningful items
- avoid silent dropping
- avoid inventing missing facts
- prefer review over guessing
- keep external systems untouched

## Example Fixture

Use these files to sanity-check the workflow:
- `docs/workflows/shutdown/examples/sample-input.md`
- `docs/workflows/shutdown/examples/sample-output.md`

If the workflow produces better output than the fixture, update the fixture. The examples are living tests for prompt quality.
