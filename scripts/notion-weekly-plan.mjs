#!/usr/bin/env node

import { getConfig } from "../src/notion/env.mjs";
import {
  createWeeklyPlanItem,
  formatWeeklyPlan,
  listWeeklyPlan,
  moveWeeklyPlanItem,
  parseWeeklyPlanArgs,
  setWeeklyPlanDueDate,
} from "../src/notion/weekly-plan.mjs";

try {
  const args = parseWeeklyPlanArgs(process.argv.slice(2));
  const config = getConfig();
  const common = {
    notionApiKey: config.notionApiKey,
    databaseId: config.weeklyPlanDatabaseId,
    dryRun: args.dryRun,
  };

  if (args.action === "add") {
    const result = await createWeeklyPlanItem({
      ...common,
      title: args.title,
      status: args.status,
      dueDate: args.dueDate,
      sourceUrl: args.sourceUrl,
    });
    console.log(JSON.stringify(result, null, 2));
  } else if (args.action === "move") {
    const result = await moveWeeklyPlanItem({
      ...common,
      title: args.title,
      toStatus: args.toStatus,
    });
    console.log(JSON.stringify(result, null, 2));
  } else if (args.action === "set-due-date") {
    const result = await setWeeklyPlanDueDate({
      ...common,
      title: args.title,
      dueDate: args.dueDate,
    });
    console.log(JSON.stringify(result, null, 2));
  } else {
    const items = await listWeeklyPlan({
      ...common,
      view: args.view,
      status: args.status,
    });
    if (args.dryRun) {
      console.log(JSON.stringify(items, null, 2));
    } else {
      console.log(formatWeeklyPlan(items, { view: args.view, format: args.format }));
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
