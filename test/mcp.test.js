import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(currentDirectory, "../src/index.js");

test("MCP client discovers and calls the read-only tools", async () => {
  const client = new Client({ name: "california-alw-test", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
  });

  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.deepEqual(
      tools.tools.map((tool) => tool.name).sort(),
      [
        "get_county_summary",
        "get_methodology_and_citation",
        "get_program_summary",
        "list_counties",
        "search_facilities",
      ],
    );

    const response = await client.callTool({
      name: "get_county_summary",
      arguments: { county: "Orange" },
    });
    assert.equal(response.structuredContent.county, "Orange");
    assert.equal(response.structuredContent.participating_facilities, 215);

    const resources = await client.listResources();
    assert.deepEqual(
      resources.resources.map((resource) => resource.uri).sort(),
      ["alw://counties", "alw://methodology"],
    );
  } finally {
    await client.close();
  }
});
