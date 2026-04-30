#!/usr/bin/env node

import { parseArgs, searchBacklogItems } from "../src/notion/backlog.mjs";
import { getConfig } from "../src/notion/env.mjs";

try {
  const args = parseArgs(process.argv.slice(2));
  const config = getConfig();
  const result = await searchBacklogItems({
    notionApiKey: config.notionApiKey,
    databaseId: config.backlogDatabaseId,
    query: args.query,
    limit: args.limit,
    dryRun: args.dryRun,
  });

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
