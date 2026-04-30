import assert from "node:assert/strict";
import test from "node:test";

import {
  formatArticleTrackingAudit,
  parseArticleArgs,
  summarizeArticlePage,
  summarizeTrackingPage,
} from "../src/notion/articles.mjs";

test("parseArticleArgs defaults to tracking audit", () => {
  const args = parseArticleArgs(["--format", "json", "--limit", "50"]);

  assert.equal(args.view, "tracking");
  assert.equal(args.format, "json");
  assert.equal(args.limit, "50");
});

test("summarizeArticlePage extracts article fields", () => {
  const article = summarizeArticlePage({
    id: "article-id",
    url: "https://notion.so/article-id",
    properties: {
      Name: { type: "title", title: [{ plain_text: "Getting hired by CTOs" }] },
      Updated: { type: "last_edited_time", last_edited_time: "2026-04-30T08:13:00.000Z" },
      Priority: { type: "select", select: { name: "Medium" } },
      Source: { type: "multi_select", multi_select: [{ name: "Writing" }] },
    },
  });

  assert.deepEqual(article, {
    id: "article-id",
    name: "Getting hired by CTOs",
    url: "https://notion.so/article-id",
    updated: "2026-04-30T08:13:00.000Z",
    nextAction: "",
    priority: "Medium",
    actionable: "",
    source: "Writing",
    tags: "",
  });
});

test("summarizeTrackingPage extracts source URL from tracking item", () => {
  const item = summarizeTrackingPage(
    {
      id: "weekly-id",
      url: "https://notion.so/weekly-id",
      properties: {
        Name: { type: "title", title: [{ plain_text: "Getting hired by CTOs" }] },
        Status: { type: "select", select: { name: "To Do" } },
        URL: { type: "url", url: "https://notion.so/article-id" },
      },
    },
    "Weekly Plan",
  );

  assert.deepEqual(item, {
    id: "weekly-id",
    destination: "Weekly Plan",
    name: "Getting hired by CTOs",
    status: "To Do",
    sourceUrl: "https://notion.so/article-id",
    pageUrl: "https://notion.so/weekly-id",
  });
});

test("formatArticleTrackingAudit separates tracked and missing articles", () => {
  const output = formatArticleTrackingAudit([
    {
      name: "Getting hired by CTOs",
      tracked: true,
      trackers: [{ destination: "Weekly Plan", name: "Getting hired by CTOs" }],
    },
    { name: "Quality Strategy", tracked: false, trackers: [] },
  ]);

  assert.match(output, /## Articles With Tracking/);
  assert.match(output, /- Getting hired by CTOs \(Weekly Plan: Getting hired by CTOs\)/);
  assert.match(output, /## Articles Missing Tracking/);
  assert.match(output, /- Quality Strategy/);
});
