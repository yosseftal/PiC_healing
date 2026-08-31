/**
 * Pure Structured Markdown → Atomic Unit content parser (DEC-015 §9). Zero dependency on RepositoryPort,
 * adapters, or PlayerEngine — Path B keeps content parsing outside the state machine.
 */

export type AtomicUnitContent = {
  unit_id: string;
  unit_order: number;
  unit_title: string;
  unit_content: string;
  unit_rationale: string | null;
};

const H3_HEADER_PATTERN = /^###\s+(.*)$/;

/**
 * Bilingual canonical title (הנחיה רציפה) for Continuous Guidance units, including DEC-015 §9's
 * Zero-H3 Heuristic Fallback.
 */
const CONTINUOUS_GUIDANCE_TITLE = "Continuous Guidance";

/** Converts raw Structured Markdown into ordered Atomic Unit content records. Never throws. */
export function parseStructuredMarkdown(markdown: string): AtomicUnitContent[] {
  const lines = markdown.split("\n");
  const firstHeaderIndex = lines.findIndex((line) => H3_HEADER_PATTERN.test(line));
  const preambleContent =
    firstHeaderIndex > 0 ? lines.slice(0, firstHeaderIndex).join("\n").trim() : "";
  const units: AtomicUnitContent[] = [];
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

  if (units.length === 0) {
    const trimmedInput = markdown.trim();
    if (trimmedInput === "") {
      return [];
    }

    return [
      {
        unit_id: "unit-0",
        unit_order: 0,
        unit_title: CONTINUOUS_GUIDANCE_TITLE,
        unit_content: trimmedInput,
        unit_rationale: null,
      },
    ];
  }

  if (preambleContent !== "") {
    units.unshift({
      unit_id: "unit-0",
      unit_order: 0,
      unit_title: CONTINUOUS_GUIDANCE_TITLE,
      unit_content: preambleContent,
      unit_rationale: null,
    });
  }

  return units;
}
