# chiefOS
A project that instruments a virtual personal chief of staff (chiefOS)

Inspired by [Claude Code Chief of Staff](https://github.com/jimprosser/claude-code-cos)

## Current Working Workflow

`/shutdown` is the first implemented ChiefOS workflow.

Status:
- v1 is prompt-only
- no app code or external integrations
- no automatic writes to tasks, notes, calendars, or services
- output is a manual review grouped into TODOs, knowledgebase items, calendar items, and ambiguous items

Start here:
- Prompt workflow: `prompts/shutdown.md`
- Quickstart: `docs/workflows/shutdown/quickstart.md`
- Spec: `docs/workflows/shutdown/spec.md`
- Example input/output: `docs/workflows/shutdown/examples/`

## Integrations

Notion:
- Initial destination: Backlog database
- Setup guide: `docs/integrations/notion.md`
- Command: `npm run notion:backlog -- --title "Example item"`
- Search command: `npm run notion:backlog:search -- --query "Example"`

My unique things:

1. I use Cal Newport's Time Management System: https://www.kenst.com/cal-newports-time-management-system/
    - [ ] I'd like to have my shutdown process reminder added to the calendar daily so I remember
    - [ ] I need a calendar item for Sundays to review my next weeks action items
    - [ ] I want the ChiefOS to scan my calendar for advance items that need additional planning like birthays, anniversaries, etc
2. I work remotely but still have several things that require physical travel, such as taking and picking up kid from school and practices
3. I might want the ChiefOS to help with social media management and posting
4. I want help drafting TCorg newsletters. This should be handled using the TCorg code, but is maybe a skill or shortcut to triggering. 
5. I want help scheduling social posts. I'd prefer it if some Notion table contained all of my social posts and then the CoS could pull those out and schedule them. Either using custom code in the CoS or APIs to Buffer or Zapier or just on it's own. 
6. I want a shutdown command that I can give the CoS. 
    - [x] that command it will prompt me for all of the things in my head and/or in temporary storage.
    - [x] I will copy and paste all the stuff I have
    - [x] The CoS will separate items into TODOs / action items, knowledgebase items, calendar items, and ambiguous items.

## Platform Constraints

- I plan to use chiefOS on my work computer (Windows), personal laptop (Mac), and personal desktop (Mac).
- Some regular automated skills will likely run on the personal desktop in Codex.
- Some workflows on the personal laptop will likely run in Goose.
- chiefOS should stay tool-agnostic and model-agnostic where possible.
- Core workflows, prompts, schemas, and outputs should not depend on one specific host app or one specific model.
