import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseStructuredMarkdown } from "./content-parser/index";
import {
  readTreatmentMarkdownWritesFromMigrations,
  type TreatmentMarkdownWrite,
} from "./test-helpers/extract-treatment-markdown-from-sql";
import { TRACER_BULLET_SEED_TREATMENT_ROWS } from "./tracer-bullet-seed-treatments";

const MIGRATIONS_DIRECTORY = fileURLToPath(new URL("../../../supabase/migrations", import.meta.url));
const TS_SEED_SOURCE = "TRACER_BULLET_SEED_TREATMENT_ROWS";

type IntegrityCase = {
  source: string;
  identity: string;
  structuredMarkdown: string;
};

function identityForSqlWrite(row: TreatmentMarkdownWrite): string {
  const parts: string[] = [];
  if (row.title !== null) {
    parts.push(row.title);
  }
  if (row.id !== null) {
    parts.push(row.id);
  }
  return parts.length > 0 ? parts.join(" · ") : "unlabeled structured_markdown write";
}

function casesFromSqlWrites(writes: TreatmentMarkdownWrite[]): IntegrityCase[] {
  return writes.map((row) => ({
    source: row.sourceFileName,
    identity: identityForSqlWrite(row),
    structuredMarkdown: row.structuredMarkdown,
  }));
}

function casesFromTsSeed(): IntegrityCase[] {
  return TRACER_BULLET_SEED_TREATMENT_ROWS.map((row) => ({
    source: TS_SEED_SOURCE,
    identity: `${row.title} · ${row.id}`,
    structuredMarkdown: row.structured_markdown,
  }));
}

const sqlWrites = readTreatmentMarkdownWritesFromMigrations(MIGRATIONS_DIRECTORY);
const sqlCases = casesFromSqlWrites(sqlWrites);
const tsCases = casesFromTsSeed();
const allCases = [...sqlCases, ...tsCases];

/** Hypothetical seed row: non-empty prose, zero H3. Not a real treatment id; never written to production. */
const HYPOTHETICAL_ZERO_H3_PROSE =
  "Sit with both feet on the floor and notice the breath moving in and out. Stay with that sensation.";

const H3_HEADER_PATTERN = /^###\s+(.*)$/;

/**
 * Local replica of Wave 9 core's H3-only walk: start a unit only at `###`, return whatever was
 * collected, with no post-loop fallback for the zero-unit case. Throwaway — never called from
 * production. Do not import or copy this into `content-parser/index.ts`.
 */
function parseWithWave9CoreH3OnlyWalk(markdown: string): ReturnType<typeof parseStructuredMarkdown> {
  const lines = markdown.split("\n");
  const units: ReturnType<typeof parseStructuredMarkdown> = [];
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const headerMatch = lines[lineIndex].match(H3_HEADER_PATTERN);
    if (!headerMatch) {
      lineIndex += 1;
      continue;
    }

    const unitTitle = headerMatch[1].trim();
    lineIndex += 1;

    let unitRationale: string | null = null;
    if (lineIndex < lines.length && lines[lineIndex].startsWith(">")) {
      const rationaleLines: string[] = [];
      while (lineIndex < lines.length && lines[lineIndex].startsWith(">")) {
        rationaleLines.push(lines[lineIndex].replace(/^>\s?/, ""));
        lineIndex += 1;
      }
      unitRationale = rationaleLines.join("\n").trim();
    }

    const contentLines: string[] = [];
    while (lineIndex < lines.length && !H3_HEADER_PATTERN.test(lines[lineIndex])) {
      contentLines.push(lines[lineIndex]);
      lineIndex += 1;
    }

    const unitOrder = units.length + 1;
    units.push({
      unit_id: `unit-${unitOrder}`,
      unit_order: unitOrder,
      unit_title: unitTitle,
      unit_content: contentLines.join("\n").trim(),
      unit_rationale: unitRationale,
    });
  }

  return units;
}

describe("bootstrap content integrity (Wave 9.1 Decision C)", () => {
  it("finds structured_markdown writes in migrations rather than scanning an empty catalog", () => {
    expect(sqlWrites.length).toBeGreaterThanOrEqual(TRACER_BULLET_SEED_TREATMENT_ROWS.length);
  });

  it("table-drives every Guest seed row rather than skipping the TypeScript catalog", () => {
    expect(tsCases.length).toBe(TRACER_BULLET_SEED_TREATMENT_ROWS.length);
    expect(tsCases.length).toBeGreaterThanOrEqual(1);
  });

  it.each(allCases)(
    "parses at least one Atomic Unit from $source ($identity)",
    ({ source, identity, structuredMarkdown }) => {
      const units = parseStructuredMarkdown(structuredMarkdown);
      expect(
        units.length,
        `${source} (${identity}) resolved to zero Atomic Units`,
      ).toBeGreaterThanOrEqual(1);
    },
  );

  it("wraps hypothetical non-empty zero-H3 prose into at least one Atomic Unit via Heuristic Fallback", () => {
    expect(HYPOTHETICAL_ZERO_H3_PROSE.includes("###")).toBe(false);
    expect(HYPOTHETICAL_ZERO_H3_PROSE.trim().length).toBeGreaterThan(0);
    expect(parseStructuredMarkdown(HYPOTHETICAL_ZERO_H3_PROSE).length).toBeGreaterThanOrEqual(1);
  });

  it("would have returned an empty array under Wave 9 core's old semantics", () => {
    expect(parseWithWave9CoreH3OnlyWalk(HYPOTHETICAL_ZERO_H3_PROSE)).toEqual([]);
  });
});
