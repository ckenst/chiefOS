# Notion Integration

ChiefOS uses Notion as its first durable operating layer. The current normalized destinations are:

- `Weekly Plan`: active work for the current week.
- `Backlog`: unscheduled tasks, ideas, reference captures, and someday items.
- `Articles in Progress`: writing drafts and article ideas.

The `Work` database may exist in `.env`, but it is intentionally skipped for now.

## Setup

1. Create a Notion internal integration and copy its secret.
2. Share the `Backlog` database with that integration.
3. Copy the Backlog database ID from the Notion URL.
4. Create a local `.env` file:

```sh
NOTION_API=secret_from_notion
NOTION_BACKLOG_DATABASE_ID=database_id_from_notion
NOTION_WEEKLY_PLAN_DATABASE_ID=database_id_from_notion
NOTION_WRITING_DATABASE_ID=database_id_from_notion
```

## Recommended Backlog Properties

The script only requires a title property.

Optional properties are used if they exist:
- `Type` as a select
- `Status` as a select
- `Source` as rich text

The title property can have any name, such as `Name` or `Task`.

## Create A Backlog Item

```sh
npm run notion:backlog -- --title "Move shutdown brainstorm into Notion" --type "TODO" --content "Captured from ChiefOS shutdown."
```

## Search Backlog

Use this when the chat needs to answer from Notion data:

```sh
npm run notion:backlog:search -- --query "Playwright"
```

The command returns matching page titles, common property values, page URLs, and plain text from top-level page blocks.

## Weekly Plan

Use Weekly Plan commands when the user asks what they are working on, what they are supposed to work on this week, or asks to move items between weekly columns.

What am I working on?

```sh
npm run notion:weekly-plan:working
```

What am I supposed to work on this week?

```sh
npm run notion:weekly-plan:summary
```

What is still to do?

```sh
npm run notion:weekly-plan:todo
```

Add an item:

```sh
npm run notion:weekly-plan -- --action add --title "Return iPhone Mini to T-Mobile" --status Doing --due-date 2026-04-30
```

Add a source-aware item:

```sh
npm run notion:weekly-plan -- --action add --title "Getting hired by CTOs" --status "To Do" --source-url "https://app.notion.com/p/source-article"
```

Move an item:

```sh
npm run notion:weekly-plan -- --action move --title "Build out Chief of Staff" --to-status Doing
```

Set a due date:

```sh
npm run notion:weekly-plan -- --action set-due-date --title "TCorg newsletter" --due-date 2026-04-30
```

## Articles In Progress

Use the Articles in Progress commands when the user asks what articles are in progress, or when ChiefOS needs to verify whether writing items have matching tracking tasks.

List articles:

```sh
npm run notion:articles:list
```

Audit tracking:

```sh
npm run notion:articles:tracking
```

Article tracking rule:
- Every page in `Articles in Progress` should have a matching tracking item in either `Weekly Plan` or `Backlog`.
- The tracking item should set its `URL` property to the source article page URL.
- Use `Weekly Plan` when the article is intended for this week.
- Use `Backlog` when the article should be kept but is not part of the current week.

## Dry Run

Use dry run to inspect the Notion API payload without creating anything:

```sh
npm run notion:backlog:dry-run
```

Or:

```sh
npm run notion:backlog -- --dry-run --title "Example backlog item" --content "Created by ChiefOS."
```

Search dry run:

```sh
npm run notion:backlog:search:dry-run
```

## Chat Contract

The intended workflow is chat-first:
- When the user asks ChiefOS to create something in Notion, choose the most specific normalized destination.
- When the user asks what they are working on, use the Weekly Plan `Doing` view.
- When the user asks what they are supposed to work on this week, use the Weekly Plan summary view.
- When the user asks about articles, use `Articles in Progress`.
- When moving an article into the week, create a Weekly Plan item with its `URL` property pointing back to the source article page.
- When keeping an article for later, create or use a Backlog item with its `URL` property pointing back to the source article page.
- When the user asks a question that should be answered from Notion, the chat should search the relevant Notion destination before answering.
- If Notion credentials or database IDs are missing, the chat should say what is missing rather than pretending it checked Notion.

## Destination Model

Current destinations:
- `Weekly Plan`: active weekly execution
- `Backlog`: general capture and unscheduled tracking
- `Articles in Progress`: writing inventory

Likely future destinations:
- calendar review queue
- knowledgebase notes
- project-specific action lists
- work database

Keep workflow classification separate from destination routing. `/shutdown` should first classify items, then a later step can decide whether each item belongs in Backlog or a more specific database.
