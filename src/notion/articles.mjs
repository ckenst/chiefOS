import { NotionClient } from "./client.mjs";

const DEFAULT_LIMIT = 100;

export function parseArticleArgs(argv) {
  const args = {
    dryRun: false,
    format: "markdown",
    view: "tracking",
    limit: DEFAULT_LIMIT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg.startsWith("--")) {
      const key = toCamelCase(arg.slice(2));
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      args[key] = value;
      index += 1;
    }
  }

  return args;
}

export async function listArticles({
  notionApiKey,
  writingDatabaseId,
  limit = DEFAULT_LIMIT,
  dryRun = false,
}) {
  assertDatabaseId(writingDatabaseId, "NOTION_WRITING_DATABASE_ID", dryRun);

  const client = new NotionClient({ apiKey: notionApiKey, dryRun });
  const body = {
    page_size: normalizeLimit(limit),
    sorts: [{ property: "Updated", direction: "descending" }],
  };

  if (dryRun) {
    return client.queryDatabase(writingDatabaseId || "dry-run-writing-database-id", body);
  }

  const response = await client.queryDatabase(writingDatabaseId, body);
  return response.results.map(summarizeArticlePage);
}

export async function auditArticleTracking({
  notionApiKey,
  writingDatabaseId,
  weeklyPlanDatabaseId,
  backlogDatabaseId,
  limit = DEFAULT_LIMIT,
  dryRun = false,
}) {
  assertDatabaseId(writingDatabaseId, "NOTION_WRITING_DATABASE_ID", dryRun);
  assertDatabaseId(weeklyPlanDatabaseId, "NOTION_WEEKLY_PLAN_DATABASE_ID", dryRun);
  assertDatabaseId(backlogDatabaseId, "NOTION_BACKLOG_DATABASE_ID", dryRun);

  const client = new NotionClient({ apiKey: notionApiKey, dryRun });
  const pageSize = normalizeLimit(limit);

  if (dryRun) {
    return {
      dryRun: true,
      writing: await client.queryDatabase(writingDatabaseId || "dry-run-writing-database-id", {
        page_size: pageSize,
      }),
      weeklyPlan: await client.queryDatabase(
        weeklyPlanDatabaseId || "dry-run-weekly-plan-database-id",
        { page_size: pageSize },
      ),
      backlog: await client.queryDatabase(backlogDatabaseId || "dry-run-backlog-database-id", {
        page_size: pageSize,
      }),
    };
  }

  const [articlesResponse, weeklyResponse, backlogResponse] = await Promise.all([
    client.queryDatabase(writingDatabaseId, {
      page_size: pageSize,
      sorts: [{ property: "Updated", direction: "descending" }],
    }),
    client.queryDatabase(weeklyPlanDatabaseId, { page_size: pageSize }),
    client.queryDatabase(backlogDatabaseId, { page_size: pageSize }),
  ]);

  const articles = articlesResponse.results.map(summarizeArticlePage);
  const trackingItems = [
    ...weeklyResponse.results.map((page) => summarizeTrackingPage(page, "Weekly Plan")),
    ...backlogResponse.results.map((page) => summarizeTrackingPage(page, "Backlog")),
  ];

  return articles.map((article) => {
    const trackers = trackingItems.filter(
      (item) =>
        urlsMatch(item.sourceUrl, article.url) ||
        normalizedTitle(item.name) === normalizedTitle(article.name),
    );

    return {
      ...article,
      trackers,
      tracked: trackers.length > 0,
    };
  });
}

export function formatArticleTrackingAudit(items, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(items, null, 2);
  }

  const tracked = items.filter((item) => item.tracked);
  const missing = items.filter((item) => !item.tracked);

  return [
    "## Articles With Tracking",
    tracked.length
      ? tracked
          .map((item) => {
            const trackers = item.trackers
              .map((tracker) => `${tracker.destination}: ${tracker.name}`)
              .join("; ");
            return `- ${item.name} (${trackers})`;
          })
          .join("\n")
      : "- None",
    "",
    "## Articles Missing Tracking",
    missing.length ? missing.map((item) => `- ${item.name}`).join("\n") : "- None",
  ].join("\n");
}

export function summarizeArticlePage(page) {
  const properties = page.properties || {};

  return {
    id: page.id,
    name: propertyToPlainText(properties.Name),
    url: page.url,
    updated: propertyToPlainText(properties.Updated),
    nextAction: propertyToPlainText(properties["Next Action"]),
    priority: propertyToPlainText(properties.Priority),
    actionable: propertyToPlainText(properties.Actionable),
    source: propertyToPlainText(properties.Source),
    tags: propertyToPlainText(properties.Tags),
  };
}

export function summarizeTrackingPage(page, destination) {
  const properties = page.properties || {};

  return {
    id: page.id,
    destination,
    name: propertyToPlainText(properties.Name),
    status: propertyToPlainText(properties.Status),
    sourceUrl: propertyToPlainText(properties.URL),
    pageUrl: page.url,
  };
}

function propertyToPlainText(property) {
  if (!property) {
    return "";
  }

  if (property.type === "title") {
    return richTextToPlainText(property.title);
  }

  if (property.type === "rich_text") {
    return richTextToPlainText(property.rich_text);
  }

  if (property.type === "select") {
    return property.select?.name || "";
  }

  if (property.type === "multi_select") {
    return property.multi_select.map((option) => option.name).join(", ");
  }

  if (property.type === "url") {
    return property.url || "";
  }

  if (property.type === "last_edited_time") {
    return property.last_edited_time || "";
  }

  return "";
}

function richTextToPlainText(richText = []) {
  return richText.map((text) => text.plain_text || text.text?.content || "").join("");
}

function normalizeLimit(limit) {
  return Math.min(Number(limit) || DEFAULT_LIMIT, 100);
}

function urlsMatch(left, right) {
  return Boolean(left && right && stripUrl(left) === stripUrl(right));
}

function stripUrl(value) {
  return value.replace(/[?#].*$/, "").replace(/\/$/, "");
}

function normalizedTitle(value) {
  return String(value)
    .toLowerCase()
    .replace(/^\d+\s*[-:]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function assertDatabaseId(databaseId, name, dryRun) {
  if (!databaseId && !dryRun) {
    throw new Error(`Missing ${name}. Add it to .env.`);
  }
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
