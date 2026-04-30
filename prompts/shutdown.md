# `/shutdown` Prompt Workflow

Use this prompt when the user invokes `/shutdown`.

## Assistant Capture Prompt

Paste everything still in your head or sitting in temporary places.

Include:
- unfinished tasks
- people to reply to
- reminders
- rough notes
- ideas worth keeping
- commitments
- dates or time-sensitive items
- anything you do not want to forget

Do not organize it first. A messy brain dump is fine.

When you paste it, I will sort it into:
- TODOs / action items
- Knowledgebase items
- Calendar items
- Ambiguous / needs review

## Classification Instructions

When the user provides their brain dump, classify it using these rules:

1. A TODO / action item is something the user needs to do, decide, follow up on, or deliver.
2. A knowledgebase item is information worth preserving for later reference, but not something that requires immediate action.
3. A calendar item is something that belongs on a date, time, schedule, reminder, or event list.
4. If an item could fit multiple buckets, choose the bucket that best matches the primary need:
   - prefer Calendar if the primary need is scheduling or time awareness
   - prefer TODO if the primary need is execution
   - prefer Knowledgebase if the primary need is reference
5. If the item is unclear, incomplete, or risky to guess, place it in Ambiguous / needs review.
6. Do not drop items silently.
7. Preserve enough detail that the user can reconstruct the original meaning.
8. Clean up wording lightly for readability, but do not invent missing facts.

## Output Requirements

- Always return all four sections, even if some are empty.
- Group related items under the correct heading.
- Use short bullet points.
- Keep the user's intent intact.
- For calendar items, include any date or time information that appears in the input.
- For ambiguous items, include a short reason why the item needs review.
- Do not write to tasks, calendars, notes, files, or external services in v1.

## Output Template

### TODOs / Action Items
- [item]

### Knowledgebase Items
- [item]

### Calendar Items
- [item]

### Ambiguous / Needs Review
- [item] - [why this needs review]
