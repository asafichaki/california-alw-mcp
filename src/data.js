import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "csv-parse/sync";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(currentDirectory, "../data");

const facilitiesCsv = fs.readFileSync(
  path.join(dataDirectory, "california-alw-facilities-2026.csv"),
  "utf8",
);

export const metadata = JSON.parse(
  fs.readFileSync(
    path.join(dataDirectory, "california-alw-county-tracker-2026.json"),
    "utf8",
  ),
);

export const facilities = parse(facilitiesCsv, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
}).map((row) => ({
  ...row,
  capacity_per_peu: Number(row.capacity_per_peu),
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
}));

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("en-US");
}

function matches(value, query) {
  return normalize(value).includes(normalize(query));
}

export function listCounties() {
  return metadata.counties.map((county) => ({ ...county }));
}

export function findCounty(countyName) {
  const normalized = normalize(countyName).replace(/\s+county$/, "");
  return metadata.counties.find(
    (county) => normalize(county.county) === normalized,
  );
}

export function countySummary(countyName) {
  const county = findCounty(countyName);
  if (!county) return undefined;

  const countyFacilities = facilities.filter(
    (facility) => normalize(facility.county) === normalize(county.county),
  );

  const capacities = countyFacilities
    .map((facility) => facility.capacity_per_peu)
    .sort((a, b) => a - b);

  const median = capacities.length
    ? capacities.length % 2
      ? capacities[(capacities.length - 1) / 2]
      : (capacities[capacities.length / 2 - 1] +
          capacities[capacities.length / 2]) /
        2
    : 0;

  return {
    ...county,
    median_capacity_per_provider_record: median,
    largest_provider_records: countyFacilities
      .toSorted((a, b) => b.capacity_per_peu - a.capacity_per_peu)
      .slice(0, 5)
      .map(publicFacility),
    caution:
      "Licensed PEU capacity is not a live vacancy count. DHCS publishes one statewide waitlist, not county-level waitlists.",
  };
}

export function searchFacilities({
  query,
  county,
  city,
  zipCode,
  limit = 20,
} = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

  return facilities
    .filter((facility) => {
      if (
        county &&
        normalize(facility.county) !==
          normalize(county).replace(/\s+county$/, "")
      ) {
        return false;
      }
      if (city && !matches(facility.city, city)) return false;
      if (zipCode && !normalize(facility.zip_code).startsWith(normalize(zipCode))) {
        return false;
      }
      if (
        query &&
        ![
          facility.business_name,
          facility.legal_name,
          facility.address,
          facility.city,
          facility.county,
          facility.zip_code,
          facility.provider_number,
        ].some((value) => matches(value, query))
      ) {
        return false;
      }
      return true;
    })
    .slice(0, safeLimit)
    .map(publicFacility);
}

export function programSummary() {
  return {
    program: "California Medi-Cal Assisted Living Waiver (ALW)",
    dataset_version: metadata.version,
    participating_provider_records: facilities.length,
    counties_with_participating_facilities: metadata.counties_with_alw,
    california_counties_total: metadata.counties_total_california,
    licensed_capacity_peu: metadata.counties.reduce(
      (sum, county) => sum + county.licensed_capacity_peu,
      0,
    ),
    statewide_enrolled: metadata.statewide.enrolled,
    statewide_waitlist: metadata.statewide.waitlist,
    statewide_figures_as_of: metadata.statewide.as_of,
    facility_source_access_date: facilities[0]?.source_access_date,
    tracker_source_access_date: metadata.source_access_date,
    canonical_tracker:
      "https://californiacarecompass.com/data/california-alw-county-tracker-2026",
    original_sources: metadata.sources,
    license: metadata.license,
    cautions: [
      "The waitlist and enrollment values are statewide; DHCS does not publish county-level waitlist counts.",
      "Licensed PEU capacity is an approved ceiling, not a live vacancy count.",
      "Rows are provider-enrollment-unit records and should not be treated as unique facility-license identifiers without entity resolution.",
    ],
  };
}

export function methodology() {
  return {
    publisher: "California Care Compass",
    original_publisher: "California Department of Health Care Services",
    method:
      "The facility file is fetched from the DHCS ALW ArcGIS layer and normalized with a reproducible standard-library Python script. The GIS-derived county field is used because 11 source records conflict with the free-text county field; this reproduces the published 15-county aggregate.",
    scope:
      "Participating ALW provider records and licensed participant-enrollment-unit capacity in the 15 California counties where the waiver operates, plus statewide DHCS enrollment and waitlist figures.",
    limitations: programSummary().cautions,
    business_disclosure:
      "California Care Compass is a senior-care information and referral service. Families are not billed directly; a licensed facility may pay a one-time referral fee, disclosed before any tour.",
    reproducible_release:
      "https://github.com/asafichaki/california-alw-open-data",
    canonical_tracker:
      "https://californiacarecompass.com/data/california-alw-county-tracker-2026",
    license: metadata.license,
    suggested_citation:
      "California Care Compass. California ALW County Availability Tracker 2026, version 2026.1. https://californiacarecompass.com/data/california-alw-county-tracker-2026",
  };
}

function publicFacility(facility) {
  return {
    provider_number: facility.provider_number,
    legal_name: facility.legal_name,
    business_name: facility.business_name,
    capacity_per_peu: facility.capacity_per_peu,
    address: facility.address,
    address_2: facility.address_2 || undefined,
    city: facility.city,
    county: facility.county,
    zip_code: facility.zip_code,
    phone_number: facility.phone_number,
    latitude: facility.latitude,
    longitude: facility.longitude,
    source_access_date: facility.source_access_date,
  };
}
