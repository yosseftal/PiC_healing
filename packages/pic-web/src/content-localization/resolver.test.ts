import { describe, expect, it } from "vitest";
import { parseStructuredMarkdown, TRACER_BULLET_SEED_TREATMENT_ROWS } from "pic-engine";
import { approvedContent } from "./approved-content";
import { createTreatmentDisplayResolver, resolveTreatmentDisplay } from "./resolver";
import type { ApprovedTreatmentContent } from "./types";

describe("approved treatment display", () => {
  it("shows approved Hebrew guidance for the actual bundled source without changing canonical units", () => {
    const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
    const units = parseStructuredMarkdown(source.structured_markdown);
    const before = structuredClone(units);
    const display = resolveTreatmentDisplay({ treatmentId: source.id, source, units, locale: "he" });
    expect(display.title).toBe("הרגעת מערכת העצבים");
    expect(display.units[0]?.unit_title).toBe("התמקמות בשקט");
    expect(display.units[0]?.unit_content).toContain("שלוש נשימות");
    expect(display.language).toBe("he");
    expect(display.direction).toBe("rtl");
    expect(display.notice).toBeNull();
    expect(units).toEqual(before);
    expect(display.units.map((unit) => unit.unit_id)).toEqual(["unit-1", "unit-2", "unit-3"]);
    expect(approvedContent).toHaveLength(3);
  });
});

it("rejects a translation approved against an older source revision", () => {
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  const units = parseStructuredMarkdown(source.structured_markdown);
  const asset = structuredClone(approvedContent[0]);
  asset.revision = "new-revision";
  const display = resolveTreatmentDisplay({ treatmentId: source.id, source, units, locale: "he", catalog: [asset] });
  expect(display.units).toBe(units);
  expect(display.notice).toContain("תרגום מאושר אינו זמין");
});

it.each([
  ["changed body", (units: ReturnType<typeof parseStructuredMarkdown>) => { units[0].unit_content += " Edited."; }],
  ["changed unit title", (units: ReturnType<typeof parseStructuredMarkdown>) => { units[0].unit_title = "Renamed"; }],
  ["changed rationale", (units: ReturnType<typeof parseStructuredMarkdown>) => { units[0].unit_rationale = "New"; }],
  ["reordered units", (units: ReturnType<typeof parseStructuredMarkdown>) => { units.reverse(); }],
  ["changed order", (units: ReturnType<typeof parseStructuredMarkdown>) => { units[0].unit_order = 2; }],
  ["removed unit", (units: ReturnType<typeof parseStructuredMarkdown>) => { units.pop(); }],
  ["empty units", (units: ReturnType<typeof parseStructuredMarkdown>) => { units.length = 0; }],
] as const)("rejects %s even under the real seed ID and raw source", (_name, mutate) => {
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  const units = parseStructuredMarkdown(source.structured_markdown);
  mutate(units);
  const display = resolveTreatmentDisplay({ treatmentId: source.id, source, units, locale: "he" });
  expect(display.units).toBe(units);
  expect(display.language).toBe("");
  expect(display.direction).toBe("auto");
  expect(display.revision).toBeNull();
});

it("revalidates actual input before using a previously approved display cache hit", () => {
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  const units = parseStructuredMarkdown(source.structured_markdown);
  const resolve = createTreatmentDisplayResolver();
  const input = { treatmentId: source.id, source, units, locale: "he" as const };
  const approved = resolve(input);
  expect(resolve(input)).toBe(approved);
  units[0].unit_content = "My personally edited guidance";
  expect(resolve(input).units).toBe(units);
  expect(resolve(input).revision).toBeNull();
});

it.each(TRACER_BULLET_SEED_TREATMENT_ROWS)("covers every unit of $title in both approved locales", (source) => {
  const units = parseStructuredMarkdown(source.structured_markdown);
  const asset = approvedContent.find((candidate) => candidate.source.id === source.id)!;
  expect(asset.source).toEqual(source);
  expect(asset.units).toEqual(units);
  for (const locale of ["en", "he"] as const) {
    const display = resolveTreatmentDisplay({ treatmentId: source.id, source, units, locale });
    expect(display.notice).toBeNull();
    expect(display.title.trim().length).toBeGreaterThan(0);
    expect(display.language).toBe(locale);
    if (locale === "en") expect(display.units).toEqual(units);
    for (const unit of display.units) {
      for (const text of [unit.unit_title, unit.unit_content, unit.unit_rationale ?? "authored rationale absent"]) {
        expect(text.trim().length).toBeGreaterThan(0);
        expect(text).not.toMatch(/\bpending\b|\btodo\b|\btbd\b/i);
      }
    }
    expect(display.units).toHaveLength(3);
    expect(display.units.map((unit) => [unit.unit_id, unit.unit_order, unit.unit_rationale]))
      .toEqual([["unit-1", 1, null], ["unit-2", 2, null], ["unit-3", 3, null]]);
  }
});

it.each([
  ["partial locale", (asset: ApprovedTreatmentContent) => { asset.locales.he!.units = asset.locales.he!.units.slice(1); }],
  ["reordered locale", (asset: ApprovedTreatmentContent) => {
    asset.locales.he!.units = [...asset.locales.he!.units].reverse();
  }],
  ["unapproved locale", (asset: ApprovedTreatmentContent) => { asset.locales.he!.approval = "pending"; }],
  ["unapproved source", (asset: ApprovedTreatmentContent) => { asset.permission = "pending"; }],
  ["missing locale", (asset: ApprovedTreatmentContent) => { delete asset.locales.he; }],
  ["wrong locale", (asset: ApprovedTreatmentContent) => { asset.locales.he!.locale = "en"; }],
  ["missing provenance", (asset: ApprovedTreatmentContent) => { asset.provenance = ""; }],
] as const)("rejects %s coherently with validated English metadata", (_name, mutate) => {
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  const units = parseStructuredMarkdown(source.structured_markdown);
  const asset = structuredClone(approvedContent[0]);
  mutate(asset);
  const display = resolveTreatmentDisplay({ treatmentId: source.id, source, units, locale: "he", catalog: [asset] });
  expect(display.units).toBe(units);
  expect(display.title).toBe("Settling the Nervous System");
  expect(display.language).toBe("en");
  expect(display.direction).toBe("ltr");
  expect(display.notice).toContain("תרגום מאושר אינו זמין");
});

it.each(["body", "title", "format", "catalog title", "personal ID"] as const)(
  "retains source wording and unknown metadata for %s changes", (change) => {
    const source = { ...TRACER_BULLET_SEED_TREATMENT_ROWS[0]! };
    const units = parseStructuredMarkdown(source.structured_markdown);
    let catalogTitle = source.title;
    if (change === "body") source.structured_markdown += "\nEdited";
    if (change === "title") source.title = "My title";
    if (change === "format") source.content_format = "html";
    if (change === "catalog title") catalogTitle = "Renamed row";
    if (change === "personal ID") source.id = "personal";
    const display = resolveTreatmentDisplay({ treatmentId: source.id, source, units, locale: "he", catalogTitle });
    expect(display.units).toBe(units);
    expect(display.title).toBe(catalogTitle);
    expect(display.language).toBe("");
    expect(display.direction).toBe("auto");
    expect(display.revision).toBeNull();
  });

it("keeps nonempty Continuous Guidance and empty canonical content unchanged", () => {
  const source = { ...TRACER_BULLET_SEED_TREATMENT_ROWS[0]!, structured_markdown: "My personal prose" };
  const units = parseStructuredMarkdown(source.structured_markdown);
  const display = resolveTreatmentDisplay({ treatmentId: source.id, source, units, locale: "he" });
  expect(display.units).toBe(units);
  expect(display.units[0]).toEqual({
    unit_id: "unit-0", unit_order: 0, unit_title: "Continuous Guidance",
    unit_content: "My personal prose", unit_rationale: null,
  });
  expect(resolveTreatmentDisplay({ treatmentId: source.id, source, units: [], locale: "he" }).units).toEqual([]);
});

it("separates cached treatment, validated revision and locale", () => {
  const resolve = createTreatmentDisplayResolver();
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  const units = parseStructuredMarkdown(source.structured_markdown);
  const input = { treatmentId: source.id, source, units, locale: "he" as const };
  const he = resolve(input);
  expect(resolve({ ...input, locale: "en" }).language).toBe("en");
  const revised = structuredClone(approvedContent[0]);
  revised.revision = "reapproved";
  revised.locales.he!.sourceRevision = "reapproved";
  expect(resolve({ ...input, catalog: [revised] })).not.toBe(he);
  const other = TRACER_BULLET_SEED_TREATMENT_ROWS[1]!;
  expect(resolve({ treatmentId: other.id, source: other,
    units: parseStructuredMarkdown(other.structured_markdown), locale: "he" }).title).toBe("קרקוע דרך כפות הרגליים");
});
