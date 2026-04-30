import { NotionClient } from "./client.mjs";

const STATUS_BY_VIEW = {
  doing: "Doing",
  working: "Doing",
  todo: "To Do",
  "to-do": "To Do",
  done: "Done",
};

export function parseWeeklyPlanArgs(argv) {
  const args = {
    action: "list",
    dryRun: false,
    format: "markdown",
    view: "summary",
    status: undefined,
    title: undefined,
    dueDate: undefined,
    sourceUrl: undefined,
    toStatus: undefined,
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

export async function listWeeklyPlan({
  notionApiKey,
  databaseId,
  view = "summary",
  status,
  dryRun = false,
}) {
  assertDatabaseId(databaseId, dryRun);
  const client = new NotionClient({ apiKey: notionApiKey, dryRun });
  const statuses = statusesForView(view, status);

  if (dryRun) {
    return client.queryDatabase(databaseId || "dry-run-weekly-plan-database-id", {
      filter: buildStatusFilter(statuses),
      page_size: 100,
    });
  }

  const response = await client.queryDatabase(databaseId, {
    filter: buildStatusFilter(statuses),
    sorts: [
      { property: "Due Date", direction: "ascending" },
      { timestamp: "last_edited_time", direction: "descending" },
    ],
    page_size: 100,
  });

  return response.results.map(summarizeWeeklyPlanPage);
}

export async function createWeeklyPlanItem({
  notionApiKey,
  databaseId,
  title,
  status = "To Do",
  dueDate,
  sourceUrl,
  dryRun = false,
}) {
  assertDatabaseId(databaseId, dryRun);
  assertTitle(title);

  const client = new NotionClient({ apiKey: notionApiKey, dryRun });
  const body = {
    parent: {
      database_id: databaseId || "dry-run-weekly-plan-database-id",
    },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Status: { select: { name: normalizeStatus(status) } },
    },
  };

  if (dueDate) {
    body.properties["Due Date"] = { date: { start: dueDate } };
  }

  if (sourceUrl) {
    body.properties.URL = { url: sourceUrl };
  }

  return client.createPage(body);
}

export async function moveWeeklyPlanItem({
  notionApiKey,
  databaseId,
  title,
  toStatus,
  dryRun = false,
}) {
  assertDatabaseId(databaseId, dryRun);
  assertTitle(title);

  if (!toStatus) {
    throw new Error("Missing required --to-status value.");
  }

  const client = new NotionClient({ apiKey: notionApiKey, dryRun });

  if (dryRun) {
    return {
      dryRun: true,
      action: "move",
      title,
      toStatus: normalizeStatus(toStatus),
    };
  }

  const page = await findOneWeeklyPlanPage(client, databaseId, title);
  const updated = await client.request(`/pages/${page.id}`, {
    method: "PATCH",
    body: {
      properties: {
        Status: { select: { name: normalizeStatus(toStatus) } },
      },
    },
  });

  return summarizeWeeklyPlanPage(updated);
}

export async function setWeeklyPlanDueDate({
  notionApiKey,
  databaseId,
  title,
  dueDate,
  dryRun = false,
}) {
  assertDatabaseId(databaseId, dryRun);
  assertTitle(title);

  if (!dueDate) {
    throw new Error("Missing required --due-date value.");
  }

  const client = new NotionClient({ apiKey: notionApiKey, dryRun });

  if (dryRun) {
    return {
      dryRun: true,
      action: "set-due-date",
      title,
      dueDate,
    };
  }

  const page = await findOneWeeklyPlanPage(client, databaseId, title);
  const updated = await client.request(`/pages/${page.id}`, {
    method: "PATCH",
    body: {
      properties: {
        "Due Date": { date: { start: dueDate } },
      },
    },
  });

  return summarizeWeeklyPlanPage(updated);
}

export function formatWeeklyPlan(items, { view = "summary", format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(items, null, 2);
  }

  const groups = groupByStatus(items);
  const sections =
    view === "summary"
      ? [
          ["Doing", "What You Are Working On"],
          ["To Do", "Up Next This Week"],
        ]
      : [[normalizeStatusForView(view), normalizeStatusForView(view)]];

  return sections
    .map(([status, heading]) => formatSection(heading, groups.get(status) || []))
    .join("\n\n");
}

export function summarizeWeeklyPlanPage(page) {
  const properties = page.properties || {};

  return {
    id: page.id,
    name: propertyToPlainText(properties.Name),
    status: propertyToPlainText(properties.Status),
    dueDate: propertyToPlainText(properties["Due Date"]),
    priority: propertyToPlainText(properties.Priority),
    nextAction: propertyToPlainText(properties["Next Action"]),
    effort: propertyToPlainText(properties.Effort),
    type: propertyToPlainText(properties.Type),
    tags: propertyToPlainText(properties.Tags),
    source: propertyToPlainText(properties.Source),
    sourceUrl: propertyToPlainText(properties.URL),
    url: page.url,
  };
}

function statusesForView(view, status) {
  if (status) {
    return [normalizeStatus(status)];
  }

  if (view === "summary") {
    return ["Doing", "To Do"];
  }

  return [normalizeStatusForView(view)];
}

function buildStatusFilter(statuses) {
  if (statuses.length === 1) {
    return {
      property: "Status",
      select: { equals: statuses[0] },
    };
  }

  return {
    or: statuses.map((status) => ({
      property: "Status",
      select: { equals: status },
    })),
  };
}

function normalizeStatusForView(view) {
  return STATUS_BY_VIEW[view.toLowerCase()] || normalizeStatus(view);
}

function normalizeStatus(status) {
  const normalized = STATUS_BY_VIEW[String(status).toLowerCase()];
  return normalized || status;
}

async function findOneWeeklyPlanPage(client, databaseId, title) {
  const response = await client.queryDatabase(databaseId, {
    filter: { property: "Name", title: { equals: title } },
    page_size: 10,
  });

  if (response.results.length !== 1) {
    const names = response.results
      .map((page) => propertyToPlainText(page.properties?.Name))
      .filter(Boolean);
    throw new Error(
      `Expected exactly one Weekly Plan item named "${title}", found ${response.results.length}. Matches: ${names.join(", ")}`,
    );
  }

  return response.results[0];
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

  if (property.type === "date") {
    return property.date?.start || "";
  }

  if (property.type === "url") {
    return property.url || "";
  }

  if (property.type === "people") {
    return property.people
      .map((person) => person.name || person.person?.email || person.id)
      .join(", ");
  }

  return "";
}

function richTextToPlainText(richText = []) {
  return richText.map((text) => text.plain_text || text.text?.content || "").join("");
}

function groupByStatus(items) {
  const groups = new Map();

  for (const item of items) {
    if (!groups.has(item.status)) {
      groups.set(item.status, []);
    }
    groups.get(item.status).push(item);
  }

  return groups;
}

function formatSection(heading, items) {
  if (items.length === 0) {
    return `## ${heading}\n- None`;
  }

  return [
    `## ${heading}`,
    ...items.map((item) => {
      const details = [
        item.dueDate ? `due ${item.dueDate}` : "",
        item.priority ? `priority ${item.priority}` : "",
      ].filter(Boolean);
      return `- ${item.name}${details.length ? ` (${details.join(", ")})` : ""}`;
    }),
  ].join("\n");
}

function assertDatabaseId(databaseId, dryRun) {
  if (!databaseId && !dryRun) {
    throw new Error(
      "Missing NOTION_WEEKLY_PLAN_DATABASE_ID. Add your Weekly Plan database ID to .env.",
    );
  }
}

function assertTitle(title) {
  if (!title) {
    throw new Error("Missing required --title value.");
  }
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
