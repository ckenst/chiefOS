import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBacklogProperties,
  createBacklogItem,
  parseArgs,
  searchBacklogItems,
  summarizePage,
} from "../src/notion/backlog.mjs";

test("parseArgs reads backlog item fields", () => {
  const args = parseArgs([
    "--dry-run",
    "--title",
    "Move brainstorm into Notion",
    "--type",
    "TODO",
    "--status",
    "Inbox",
    "--source",
    "chiefOS",
    "--content",
    "Captured from shutdown.",
  ]);

  assert.deepEqual(args, {
    dryRun: true,
    title: "Move brainstorm into Notion",
    type: "TODO",
    status: "Inbox",
    source: "chiefOS",
    content: "Captured from shutdown.",
  });
});

test("buildBacklogProperties uses optional properties when present", () => {
  const properties = buildBacklogProperties(
    {
      properties: {
        Name: { type: "title" },
        Type: { type: "select" },
        Status: { type: "select" },
        Source: { type: "rich_text" },
      },
    },
    {
      title: "Publish DevRel portfolio",
      type: "TODO",
      status: "Inbox",
      source: "chiefOS",
    },
  );

  assert.equal(properties.Name.title[0].text.content, "Publish DevRel portfolio");
  assert.equal(properties.Type.select.name, "TODO");
  assert.equal(properties.Status.select.name, "Inbox");
  assert.equal(properties.Source.rich_text[0].text.content, "chiefOS");
});

test("createBacklogItem supports dry-run without credentials", async () => {
  const result = await createBacklogItem({
    title: "Example backlog item",
    content: "Created by ChiefOS dry run.",
    dryRun: true,
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.method, "POST");
  assert.equal(result.path, "/pages");
  assert.equal(result.body.properties.Name.title[0].text.content, "Example backlog item");
});

test("createBacklogItem requires a title", async () => {
  await assert.rejects(
    createBacklogItem({
      dryRun: true,
    }),
    /Missing required --title value/,
  );
});

test("searchBacklogItems supports dry-run without credentials", async () => {
  const result = await searchBacklogItems({
    query: "example",
    dryRun: true,
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.method, "POST");
  assert.equal(result.path, "/databases/dry-run-backlog-database-id/query");
  assert.equal(result.body.page_size, 10);
});

test("summarizePage extracts readable page data", () => {
  const page = summarizePage({
    id: "page-id",
    url: "https://notion.so/page-id",
    last_edited_time: "2026-04-30T12:00:00.000Z",
    properties: {
      Name: {
        type: "title",
        title: [{ plain_text: "Playwright guardrails" }],
      },
      Type: {
        type: "select",
        select: { name: "Content Idea" },
      },
      Source: {
        type: "rich_text",
        rich_text: [{ plain_text: "chiefOS" }],
      },
    },
  });

  assert.deepEqual(page, {
    id: "page-id",
    title: "Playwright guardrails",
    url: "https://notion.so/page-id",
    lastEditedTime: "2026-04-30T12:00:00.000Z",
    properties: {
      Name: "Playwright guardrails",
      Type: "Content Idea",
      Source: "chiefOS",
    },
  });
});
