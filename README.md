# California Assisted Living Waiver MCP server

[![GitMCP](https://img.shields.io/endpoint?url=https://gitmcp.io/badge/asafichaki/california-alw-mcp)](https://gitmcp.io/asafichaki/california-alw-mcp)

A read-only [Model Context Protocol](https://modelcontextprotocol.io/) server for
California Medi-Cal Assisted Living Waiver (ALW) data. It lets AI assistants
query 1,224 public DHCS participating-provider records, compare the 15 counties
where ALW operates, and retrieve statewide enrollment and waitlist figures with
their source and interpretation limits intact.

The server bundles a versioned, CC BY 4.0 data release and makes no network
requests at runtime.

## Why this exists

Administrative ALW data is easy to misstate. In particular:

- DHCS publishes one statewide waitlist, not county waitlists.
- Licensed participant-enrollment-unit capacity is not live vacancy.
- Rows are provider records, not guaranteed unique facility-license records.

The tools and server instructions preserve those distinctions so an assistant
can answer questions without inventing finer-grained availability data.

## Run from GitHub

Node.js 20 or newer is required.

```json
{
  "mcpServers": {
    "california-alw": {
      "command": "npx",
      "args": ["-y", "github:asafichaki/california-alw-mcp"]
    }
  }
}
```

For a zero-install documentation and source-search endpoint, connect an
MCP-compatible assistant to
`https://gitmcp.io/asafichaki/california-alw-mcp`.

For a local checkout:

```bash
npm install
npm start
```

## Tools

| Tool | Purpose |
|---|---|
| `get_program_summary` | Statewide figures, record count, capacity, dates, sources, license, and cautions |
| `list_counties` | All participating counties with provider-record counts and licensed capacity |
| `get_county_summary` | One county's totals, median record capacity, and largest provider records |
| `search_facilities` | Search public DHCS records by name, address, provider number, county, city, or ZIP |
| `get_methodology_and_citation` | Provenance, normalization method, limitations, disclosure, and citation |

The server also exposes `alw://methodology` and `alw://counties` resources plus
a `compare_alw_counties` prompt.

## Example questions

- How many participating ALW provider records are in San Diego County?
- Compare licensed ALW capacity in Orange and Riverside counties.
- Find participating records in ZIP code 95823.
- What does the statewide waitlist number mean, and what does it not mean?
- Give me the methodology and citation for these figures.

## Sources and attribution

The original facility records come from the
[California Department of Health Care Services ALW GIS dataset](https://gis.dhcs.ca.gov/datasets/CADHCS::alw-assisted-living-facilities/about).
Statewide enrollment and waitlist figures come from the DHCS ALW reporting
surface documented in the release metadata.

The prepared release, methodology, direct downloads, and human-readable county
breakdown are published by California Care Compass:

- [California ALW County Availability Tracker 2026](https://californiacarecompass.com/data/california-alw-county-tracker-2026)
- [Versioned open-data repository](https://github.com/asafichaki/california-alw-open-data)

Suggested citation:

> California Care Compass. *California ALW County Availability Tracker 2026*,
> version 2026.1.
> https://californiacarecompass.com/data/california-alw-county-tracker-2026

California Care Compass is a senior-care information and referral service.
Families are not billed directly; a licensed facility may pay a one-time
referral fee, disclosed before any tour.

## Development

```bash
npm install
npm run check
```

The test suite verifies the published dataset invariants and starts a real MCP
client over stdio to discover and call the server tools.

## Licenses

- Server code: [MIT](LICENSE)
- Bundled prepared data: [CC BY 4.0](DATA-LICENSE.md)
