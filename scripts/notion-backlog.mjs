#!/usr/bin/env node

import { createBacklogItem, parseArgs } from "../src/notion/backlog.mjs";
import { getConfig } from "../src/notion/env.mjs";

try {
  const args = parseArgs(process.argv.slice(2));
  const config = getConfig();
  const result = await createBacklogItem({
    notionApiKey: config.notionApiKey,
    databaseId: config.backlogDatabaseId,
    title: args.title,
    content: args.content,
    type: args.type,
    status: args.status,
    source: args.source,
    dryRun: args.dryRun,
  });

  if (args.dryRun) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Created Notion backlog item: ${result.url}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
