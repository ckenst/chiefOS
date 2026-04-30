import fs from "node:fs";

export function loadEnvFile(filePath = ".env") {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

export function getConfig() {
  const fileEnv = loadEnvFile();

  return {
    notionApiKey:
      process.env.NOTION_ACCESS_TOKEN ||
      fileEnv.NOTION_ACCESS_TOKEN ||
      process.env.NOTION_API ||
      fileEnv.NOTION_API,
    backlogDatabaseId:
      process.env.NOTION_BACKLOG_DATABASE_ID || fileEnv.NOTION_BACKLOG_DATABASE_ID,
    weeklyPlanDatabaseId:
      process.env.NOTION_WEEKLY_PLAN_DATABASE_ID ||
      fileEnv.NOTION_WEEKLY_PLAN_DATABASE_ID,
    writingDatabaseId:
      process.env.NOTION_WRITING_DATABASE_ID || fileEnv.NOTION_WRITING_DATABASE_ID,
  };
}
