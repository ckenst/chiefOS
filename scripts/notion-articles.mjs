#!/usr/bin/env node

import { getConfig } from "../src/notion/env.mjs";
import {
  auditArticleTracking,
  formatArticleTrackingAudit,
  listArticles,
  parseArticleArgs,
} from "../src/notion/articles.mjs";

try {
  const args = parseArticleArgs(process.argv.slice(2));
  const config = getConfig();
  const common = {
    notionApiKey: config.notionApiKey,
    writingDatabaseId: config.writingDatabaseId,
    weeklyPlanDatabaseId: config.weeklyPlanDatabaseId,
    backlogDatabaseId: config.backlogDatabaseId,
    limit: args.limit,
    dryRun: args.dryRun,
  };

  if (args.view === "list") {
    const articles = await listArticles(common);
    console.log(JSON.stringify(articles, null, 2));
  } else {
    const audit = await auditArticleTracking(common);
    if (args.dryRun) {
      console.log(JSON.stringify(audit, null, 2));
    } else {
      console.log(formatArticleTrackingAudit(audit, { format: args.format }));
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
