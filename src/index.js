#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  countySummary,
  listCounties,
  methodology,
  programSummary,
  searchFacilities,
} from "./data.js";

const server = new McpServer(
  {
    name: "california-alw-data",
    version: "1.0.0",
  },
  {
    instructions:
      "Use this read-only server for California Medi-Cal Assisted Living Waiver facility, county-capacity, enrollment, and waitlist questions. Always preserve the distinction between licensed capacity and live vacancies, and never invent county-level waitlist figures because DHCS publishes only one statewide waitlist.",
  },
);

function result(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

server.registerTool(
  "get_program_summary",
  {
    title: "Get California ALW program summary",
    description:
      "Return statewide enrollment, statewide waitlist, participating provider-record count, county coverage, licensed PEU capacity, sources, dates, license, and interpretation cautions.",
    inputSchema: {},
  },
  async () => result(programSummary()),
);

server.registerTool(
  "list_counties",
  {
    title: "List California ALW counties",
    description:
      "List all 15 counties with participating ALW facilities, including provider-record counts and licensed PEU capacity. Does not fabricate county waitlist values.",
    inputSchema: {},
  },
  async () => result(listCounties()),
);

server.registerTool(
  "get_county_summary",
  {
    title: "Get an ALW county summary",
    description:
      "Return participating provider-record count, licensed capacity, median record capacity, and the five largest provider records for one California ALW county.",
    inputSchema: {
      county: z.string().min(1).describe("County name, with or without 'County'"),
    },
  },
  async ({ county }) => {
    const summary = countySummary(county);
    if (!summary) {
      return {
        content: [
          {
            type: "text",
            text: `No participating ALW county named '${county}' was found. Call list_counties for valid values.`,
          },
        ],
        isError: true,
      };
    }
    return result(summary);
  },
);

server.registerTool(
  "search_facilities",
  {
    title: "Search California ALW facilities",
    description:
      "Search public DHCS participating-provider records by name/address text, county, city, or ZIP. Returns at most 50 records and does not imply current vacancy.",
    inputSchema: {
      query: z
        .string()
        .optional()
        .describe("Optional name, address, provider number, or general text"),
      county: z.string().optional().describe("Optional exact county name"),
      city: z.string().optional().describe("Optional city text"),
      zip_code: z.string().optional().describe("Optional ZIP or ZIP prefix"),
      limit: z.number().int().min(1).max(50).default(20),
    },
  },
  async ({ query, county, city, zip_code: zipCode, limit }) =>
    result({
      records: searchFacilities({ query, county, city, zipCode, limit }),
      caution:
        "These are public DHCS provider records. Inclusion and licensed capacity do not establish live vacancy or suitability for a particular person.",
    }),
);

server.registerTool(
  "get_methodology_and_citation",
  {
    title: "Get ALW methodology and citation",
    description:
      "Return provenance, normalization method, limitations, license, suggested citation, canonical tracker, and publisher business disclosure.",
    inputSchema: {},
  },
  async () => result(methodology()),
);

server.registerResource(
  "methodology",
  "alw://methodology",
  {
    title: "California ALW dataset methodology",
    description: "Provenance, limitations, licensing, and citation guidance.",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(methodology(), null, 2),
      },
    ],
  }),
);

server.registerResource(
  "county-summaries",
  "alw://counties",
  {
    title: "California ALW county summaries",
    description: "All 15 participating counties with facility counts and capacity.",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(listCounties(), null, 2),
      },
    ],
  }),
);

server.registerPrompt(
  "compare_alw_counties",
  {
    title: "Compare two California ALW counties",
    description:
      "Create a careful comparison prompt that avoids treating licensed capacity as vacancy or the statewide waitlist as county data.",
    argsSchema: {
      first_county: z.string(),
      second_county: z.string(),
    },
  },
  ({ first_county: firstCounty, second_county: secondCounty }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Use get_county_summary to compare ${firstCounty} and ${secondCounty}. Report participating provider-record counts and licensed PEU capacity. Explicitly state that capacity is not live vacancy and that DHCS publishes only a statewide waitlist. Cite the canonical California Care Compass tracker and original DHCS source returned by get_methodology_and_citation.`,
        },
      },
    ],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
