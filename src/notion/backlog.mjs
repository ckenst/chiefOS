import { NotionClient } from "./client.mjs";

export function parseArgs(argv) {
  const args = {
    dryRun: false,
    type: "TODO",
    status: undefined,
    source: "chiefOS",
    title: undefined,
    content: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      args[toCamelCase(key)] = value;
      index += 1;
    }
  }

  return args;
}

export async function createBacklogItem({
  notionApiKey,
  databaseId,
  title,
  content = "",
  type = "TODO",
  status,
  source = "chiefOS",
  dryRun = false,
}) {
  if (!databaseId && !dryRun) {
    throw new Error(
      "Missing NOTION_BACKLOG_DATABASE_ID. Add your Backlog database ID to .env.",
    );
  }

  if (!title) {
    throw new Error("Missing required --title value.");
  }

  const client = new NotionClient({ apiKey: notionApiKey, dryRun });
  const database = dryRun
    ? buildDryRunDatabase(databaseId)
    : await client.getDatabase(databaseId);
  const properties = buildBacklogProperties(database, {
    title,
    type,
    status,
    source,
  });
  const children = content ? markdownLinesToBlocks(content) : [];

  const body = {
    parent: {
      database_id: databaseId || "dry-run-backlog-database-id",
    },
    properties,
    children,
  };

  return client.createPage(body);
}

export async function searchBacklogItems({
  notionApiKey,
  databaseId,
  query = "",
  limit = 10,
  dryRun = false,
}) {
  if (!databaseId && !dryRun) {
    throw new Error(
      "Missing NOTION_BACKLOG_DATABASE_ID. Add your Backlog database ID to .env.",
    );
  }

  const client = new NotionClient({ apiKey: notionApiKey, dryRun });
  const body = {
    page_size: Math.min(Number(limit) || 10, 100),
  };

  if (dryRun) {
    return client.queryDatabase(databaseId || "dry-run-backlog-database-id", body);
  }

  const response = await client.queryDatabase(databaseId, body);
  const normalizedQuery = query.trim().toLowerCase();
  const pages = response.results
    .map((page) => summarizePage(page))
    .filter((page) => pageMatchesQuery(page, normalizedQuery))
    .slice(0, Number(limit) || 10);

  return Promise.all(
    pages.map(async (page) => ({
      ...page,
      content: await getPagePlainText(client, page.id),
    })),
  );
}

export function buildBacklogProperties(database, { title, type, status, source }) {
  const properties = {};
  const titleProperty = findPropertyByType(database, "title");

  if (!titleProperty) {
    throw new Error("Backlog database must have a title property.");
  }

  properties[titleProperty.name] = {
    title: [
      {
        text: {
          content: title,
        },
      },
    ],
  };

  addSelectProperty(properties, database, ["Type", "Kind", "Category"], type);
  addSelectProperty(properties, database, ["Status", "State"], status);
  addRichTextProperty(properties, database, ["Source"], source);

  return properties;
}

function addSelectProperty(properties, database, names, value) {
  if (!value) {
    return;
  }

  const property = findPropertyByNamesAndType(database, names, "select");
  if (!property) {
    return;
  }

  properties[property.name] = {
    select: {
      name: value,
    },
  };
}

function addRichTextProperty(properties, database, names, value) {
  if (!value) {
    return;
  }

  const property = findPropertyByNamesAndType(database, names, "rich_text");
  if (!property) {
    return;
  }

  properties[property.name] = {
    rich_text: [
      {
        text: {
          content: value,
        },
      },
    ],
  };
}

function findPropertyByType(database, type) {
  return Object.entries(database.properties || {})
    .map(([name, property]) => ({ name, ...property }))
    .find((property) => property.type === type);
}

function findPropertyByNamesAndType(database, names, type) {
  const propertyMap = database.properties || {};
  const lowerCaseNames = names.map((name) => name.toLowerCase());

  return Object.entries(propertyMap)
    .map(([name, property]) => ({ name, ...property }))
    .find(
      (property) =>
        property.type === type && lowerCaseNames.includes(property.name.toLowerCase()),
    );
}

function markdownLinesToBlocks(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content: line,
            },
          },
        ],
      },
    }));
}

export function summarizePage(page) {
  const properties = page.properties || {};
  const titleProperty = Object.values(properties).find((property) => property.type === "title");
  const title = plainTextFromRichText(titleProperty?.title || []) || "Untitled";

  return {
    id: page.id,
    title,
    url: page.url,
    lastEditedTime: page.last_edited_time,
    properties: Object.fromEntries(
      Object.entries(properties).map(([name, property]) => [
        name,
        propertyToPlainText(property),
      ]),
    ),
  };
}

function propertyToPlainText(property) {
  if (property.type === "title") {
    return plainTextFromRichText(property.title);
  }

  if (property.type === "rich_text") {
    return plainTextFromRichText(property.rich_text);
  }

  if (property.type === "select") {
    return property.select?.name || "";
  }

  if (property.type === "multi_select") {
    return property.multi_select.map((option) => option.name).join(", ");
  }

  if (property.type === "status") {
    return property.status?.name || "";
  }

  if (property.type === "date") {
    return property.date?.start || "";
  }

  if (property.type === "url") {
    return property.url || "";
  }

  if (property.type === "email") {
    return property.email || "";
  }

  if (property.type === "phone_number") {
    return property.phone_number || "";
  }

  if (property.type === "checkbox") {
    return property.checkbox ? "true" : "false";
  }

  return "";
}

function pageMatchesQuery(page, normalizedQuery) {
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    page.title,
    ...Object.values(page.properties),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

async function getPagePlainText(client, pageId) {
  const response = await client.getBlockChildren(pageId);

  return (response.results || [])
    .map(blockToPlainText)
    .filter(Boolean)
    .join("\n");
}

function blockToPlainText(block) {
  const value = block[block.type];
  if (!value) {
    return "";
  }

  if (Array.isArray(value.rich_text)) {
    return plainTextFromRichText(value.rich_text);
  }

  return "";
}

function plainTextFromRichText(richText = []) {
  return richText.map((text) => text.plain_text || text.text?.content || "").join("");
}

function buildDryRunDatabase(databaseId) {
  return {
    id: databaseId || "dry-run-backlog-database-id",
    properties: {
      Name: {
        id: "title",
        type: "title",
      },
      Type: {
        id: "type",
        type: "select",
      },
      Status: {
        id: "status",
        type: "select",
      },
      Source: {
        id: "source",
        type: "rich_text",
      },
    },
  };
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
