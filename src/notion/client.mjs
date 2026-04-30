const NOTION_VERSION = "2022-06-28";

export class NotionClient {
  constructor({ apiKey, dryRun = false } = {}) {
    this.apiKey = apiKey;
    this.dryRun = dryRun;
  }

  async request(path, { method = "GET", body } = {}) {
    if (!this.apiKey && !this.dryRun) {
      throw new Error("Missing NOTION_API. Add it to .env or export it in your shell.");
    }

    if (this.dryRun) {
      return {
        dryRun: true,
        method,
        path,
        body,
      };
    }

    const response = await fetch(`https://api.notion.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const message = data.message || response.statusText;
      throw new Error(`Notion API ${response.status}: ${message}`);
    }

    return data;
  }

  async getDatabase(databaseId) {
    return this.request(`/databases/${databaseId}`);
  }

  async createPage(body) {
    return this.request("/pages", {
      method: "POST",
      body,
    });
  }

  async queryDatabase(databaseId, body = {}) {
    return this.request(`/databases/${databaseId}/query`, {
      method: "POST",
      body,
    });
  }

  async getBlockChildren(blockId) {
    return this.request(`/blocks/${blockId}/children`);
  }
}
