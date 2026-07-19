import assert from "node:assert/strict";
import test from "node:test";

import {
  countySummary,
  facilities,
  listCounties,
  programSummary,
  searchFacilities,
} from "../src/data.js";

test("bundled release preserves published invariants", () => {
  const summary = programSummary();
  assert.equal(facilities.length, 1224);
  assert.equal(listCounties().length, 15);
  assert.equal(summary.licensed_capacity_peu, 39065);
  assert.equal(summary.statewide_enrolled, 14847);
  assert.equal(summary.statewide_waitlist, 18365);
});

test("county lookup accepts a County suffix", () => {
  const summary = countySummary("San Diego County");
  assert.equal(summary.county, "San Diego");
  assert.equal(summary.participating_facilities, 89);
  assert.equal(summary.licensed_capacity_peu, 2624);
});

test("facility search applies filters and caps results", () => {
  const records = searchFacilities({ county: "Los Angeles", limit: 500 });
  assert.equal(records.length, 50);
  assert.ok(records.every((record) => record.county === "Los Angeles"));

  const exact = searchFacilities({ query: "1215561444" });
  assert.equal(exact.length, 1);
  assert.equal(exact[0].business_name, "PORTOLA GARDENS LLC");
});
