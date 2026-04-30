# Notion Integration

ChiefOS can create and search items in a target Notion database called `Backlog`.

This is the first Notion destination. The integration is intentionally shaped so more targeted destinations can be added later, such as content ideas, calendar review queues, or project-specific databases.

## Setup

1. Create a Notion internal integration and copy its secret.
2. Share the `Backlog` database with that integration.
3. Copy the Backlog database ID from the Notion URL.
4. Create a local `.env` file:

```sh
NOTION_API=secret_from_notion
NOTION_BACKLOG_DATABASE_ID=database_id_from_notion
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
- When the user asks ChiefOS to create something in Notion, the chat should use the Backlog command unless a more specific destination is configured.
- When the user asks a question that should be answered from Notion, the chat should search the relevant Notion destination before answering.
- If Notion credentials or database IDs are missing, the chat should say what is missing rather than pretending it checked Notion.
- If multiple Notion destinations exist later, the chat should choose the most specific destination first and fall back to Backlog for general capture.

## Destination Model

Current destination:
- `Backlog`: general capture database for early ChiefOS items

Likely future destinations:
- content ideas
- calendar review queue
- knowledgebase notes
- project-specific action lists

Keep workflow classification separate from destination routing. `/shutdown` should first classify items, then a later step can decide whether each item belongs in Backlog or a more specific database.
