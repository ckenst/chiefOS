import assert from "node:assert/strict";
import test from "node:test";

import {
  createWeeklyPlanItem,
  formatWeeklyPlan,
  listWeeklyPlan,
  parseWeeklyPlanArgs,
  summarizeWeeklyPlanPage,
} from "../src/notion/weekly-plan.mjs";

test("parseWeeklyPlanArgs supports weekly plan views", () => {
  const args = parseWeeklyPlanArgs([
    "--view",
    "working",
    "--format",
    "json",
    "--dry-run",
  ]);

  assert.equal(args.view, "working");
  assert.equal(args.format, "json");
  assert.equal(args.dryRun, true);
});

test("parseWeeklyPlanArgs supports source-aware creation", () => {
  const args = parseWeeklyPlanArgs([
    "--action",
    "add",
    "--title",
    "Getting hired by CTOs",
    "--source-url",
    "https://notion.so/article-id",
  ]);

  assert.equal(args.action, "add");
  assert.equal(args.title, "Getting hired by CTOs");
  assert.equal(args.sourceUrl, "https://notion.so/article-id");
});

test("createWeeklyPlanItem can attach a source URL", async () => {
  const result = await createWeeklyPlanItem({
    title: "Getting hired by CTOs",
    sourceUrl: "https://notion.so/article-id",
    dryRun: true,
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.method, "POST");
  assert.equal(result.path, "/pages");
  assert.equal(result.body.properties.Name.title[0].text.content, "Getting hired by CTOs");
  assert.equal(result.body.properties.URL.url, "https://notion.so/article-id");
});

test("listWeeklyPlan supports dry-run summary", async () => {
  const result = await listWeeklyPlan({
    view: "summary",
    dryRun: true,
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.method, "POST");
  assert.equal(result.path, "/databases/dry-run-weekly-plan-database-id/query");
  assert.deepEqual(result.body.filter.or.map((filter) => filter.select.equals), ["Doing", "To Do"]);
});

test("summarizeWeeklyPlanPage extracts common fields", () => {
  const item = summarizeWeeklyPlanPage({
    id: "page-id",
    url: "https://notion.so/page-id",
    properties: {
      Name: {
        type: "title",
        title: [{ plain_text: "Build out Chief of Staff" }],
      },
      Status: {
        type: "select",
        select: { name: "Doing" },
      },
      "Due Date": {
        type: "date",
        date: { start: "2026-04-30" },
      },
      Priority: {
        type: "select",
        select: { name: "P1" },
      },
      URL: {
        type: "url",
        url: "https://notion.so/source-page",
      },
    },
  });

  assert.equal(item.name, "Build out Chief of Staff");
  assert.equal(item.status, "Doing");
  assert.equal(item.dueDate, "2026-04-30");
  assert.equal(item.priority, "P1");
  assert.equal(item.sourceUrl, "https://notion.so/source-page");
});

test("formatWeeklyPlan renders a chat-friendly summary", () => {
  const output = formatWeeklyPlan([
    { name: "Build out Chief of Staff", status: "Doing", dueDate: "", priority: "" },
    { name: "Move notes to Notion", status: "To Do", dueDate: "2026-05-01", priority: "" },
  ]);

  assert.match(output, /## What You Are Working On/);
  assert.match(output, /- Build out Chief of Staff/);
  assert.match(output, /## Up Next This Week/);
  assert.match(output, /- Move notes to Notion \(due 2026-05-01\)/);
});
