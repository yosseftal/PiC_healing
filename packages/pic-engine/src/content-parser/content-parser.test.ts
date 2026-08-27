import { describe, expect, it } from "vitest";
import { findForbiddenModuleReference, getModuleSpecifiersFromFile } from "../test-helpers/isolation-scanner";
// Test-only cross-module read (Wave 9.1 amendment glossary): production code in content-parser must
// never import player-engine; this constant is read here only to assert the fallback unit_id never
// collides with it.
import { TERMINAL_NEMAR_UNIT_ID } from "../player-engine/index";
import { parseStructuredMarkdown } from "./index";

/**
 * Wave 9 ticket 01 — Content Parser acceptance criteria. Each `it()` below maps to a checkbox in
 * `.scratch/md_content_integration/issues/01-content-parser.md`.
 */
describe("parseStructuredMarkdown", () => {
  it("returns an empty array for an empty string without throwing", () => {
    expect(parseStructuredMarkdown("")).toEqual([]);
  });

  it("returns an empty array for whitespace-only input, distinct from non-empty zero-H3 prose", () => {
    expect(parseStructuredMarkdown("   \n\t ")).toEqual([]);
  });

  it("wraps non-empty zero-H3 prose into a single Continuous Guidance fallback unit", () => {
    expect(parseStructuredMarkdown("Just some prose without any headers.")).toEqual([
      {
        unit_id: "unit-0",
        unit_order: 0,
        unit_title: "Continuous Guidance",
        unit_content: "Just some prose without any headers.",
        unit_rationale: null,
      },
    ]);
  });

  it("trims surrounding whitespace from the fallback unit's unit_content", () => {
    const [unit] = parseStructuredMarkdown("\n\n  Prose with padding around it.  \n\n");

    expect(unit.unit_content).toBe("Prose with padding around it.");
  });

  it("never lets the zero-H3 fallback unit_id 'unit-0' collide with H3-based ids or the Terminal NEMAR id", () => {
    const [fallbackUnit] = parseStructuredMarkdown("Prose with no headers at all.");
    const [h3Unit] = parseStructuredMarkdown("### A Real Header\n\nSome content.");

    expect(fallbackUnit.unit_id).toBe("unit-0");
    expect(h3Unit.unit_id).not.toBe("unit-0");
    expect(fallbackUnit.unit_id).not.toBe(TERMINAL_NEMAR_UNIT_ID);
  });

  it("leaves a leading preamble before a document's first H3 unaffected (only all-prose input gets the fallback)", () => {
    const markdown = `Some leading preamble text before any header.

### First Step

Body for step one.`;

    expect(parseStructuredMarkdown(markdown)).toEqual([
      {
        unit_id: "unit-1",
        unit_order: 1,
        unit_title: "First Step",
        unit_content: "Body for step one.",
        unit_rationale: null,
      },
    ]);
  });

  it("starts a new unit at every H3 header with title and content up to the next H3", () => {
    const markdown = `### First Step

Body for step one.

### Second Step

Body for step two.`;

    expect(parseStructuredMarkdown(markdown)).toEqual([
      {
        unit_id: "unit-1",
        unit_order: 1,
        unit_title: "First Step",
        unit_content: "Body for step one.",
        unit_rationale: null,
      },
      {
        unit_id: "unit-2",
        unit_order: 2,
        unit_title: "Second Step",
        unit_content: "Body for step two.",
        unit_rationale: null,
      },
    ]);
  });

  it("uses order-based unit_id values, never derived from header text", () => {
    const markdown = `### Renamed Title Later

Content.`;

    const [unit] = parseStructuredMarkdown(markdown);

    expect(unit.unit_id).toBe("unit-1");
    expect(unit.unit_title).toBe("Renamed Title Later");
  });

  it("extracts a blockquote immediately after an H3 as unit_rationale, separate from unit_content", () => {
    const markdown = `### Step 1: Feel Your Breath
> This step activates parasympathetic nervous system awareness, allowing the body to recognize safety signals naturally.

Take three slow breaths and notice where you feel the air moving in your body.`;

    expect(parseStructuredMarkdown(markdown)).toEqual([
      {
        unit_id: "unit-1",
        unit_order: 1,
        unit_title: "Step 1: Feel Your Breath",
        unit_rationale:
          "This step activates parasympathetic nervous system awareness, allowing the body to " +
          "recognize safety signals naturally.",
        unit_content: "Take three slow breaths and notice where you feel the air moving in your body.",
      },
    ]);
  });

  it("sets unit_rationale to null when no blockquote immediately follows the H3", () => {
    const markdown = `### No Rationale Here

Plain content only.`;

    const [unit] = parseStructuredMarkdown(markdown);

    expect(unit.unit_rationale).toBeNull();
    expect(unit.unit_content).toBe("Plain content only.");
  });

  describe("tracer bullet seed treatments (verbatim from 20260730194911_tracer_bullet_schema.sql)", () => {
    const SETTLING_THE_NERVOUS_SYSTEM = `### Settle Into Stillness

Find a comfortable seated or lying position. Take three slow breaths, letting your shoulders
drop a little further with each exhale.

### Scan the Sensation

Bring your attention to the area you chose to focus on today. Notice temperature, tension, and
any subtle pulsing, without trying to change anything yet.

### Release on the Exhale

With each exhale, imagine the tension softening by ten percent. Continue for about a minute,
then gently let your attention return to the room around you.`;

    const GROUNDING_THROUGH_THE_FEET = `### Feel the Ground

Stand or sit with both feet flat on the floor. Notice the points of contact between your feet
and the ground beneath you.

### Root and Rise

Imagine roots extending from your feet into the earth on the inhale, and a gentle lengthening
through your spine on the exhale. Repeat for five full breaths.

### Return to the Room

Open your eyes if they were closed, and take a moment to notice how your body feels now compared
to when you started.`;

    const LOOSENING_THE_SHOULDERS_AND_NECK = `### Notice the Holding Pattern

Bring gentle awareness to your shoulders and neck. Notice where you may be holding tension
without realizing it.

### Slow Rolls

Slowly roll your shoulders backward five times, then forward five times, keeping the movement
slow and unforced.

### Soften the Neck

Gently tilt your head toward one shoulder, hold for three breaths, then repeat on the other
side. Let your neck feel a little longer with each breath.`;

    it("parses Settling the Nervous System into three ordered units with exact titles and content", () => {
      const units = parseStructuredMarkdown(SETTLING_THE_NERVOUS_SYSTEM);

      expect(units).toHaveLength(3);
      expect(units.map((unit) => unit.unit_id)).toEqual(["unit-1", "unit-2", "unit-3"]);
      expect(units.map((unit) => unit.unit_title)).toEqual([
        "Settle Into Stillness",
        "Scan the Sensation",
        "Release on the Exhale",
      ]);
      expect(units[0]).toMatchObject({
        unit_order: 1,
        unit_rationale: null,
        unit_content:
          "Find a comfortable seated or lying position. Take three slow breaths, letting your shoulders\n" +
          "drop a little further with each exhale.",
      });
      expect(units[1]).toMatchObject({
        unit_order: 2,
        unit_rationale: null,
        unit_content:
          "Bring your attention to the area you chose to focus on today. Notice temperature, tension, and\n" +
          "any subtle pulsing, without trying to change anything yet.",
      });
      expect(units[2]).toMatchObject({
        unit_order: 3,
        unit_rationale: null,
        unit_content:
          "With each exhale, imagine the tension softening by ten percent. Continue for about a minute,\n" +
          "then gently let your attention return to the room around you.",
      });
    });

    it("parses Grounding Through the Feet into three ordered units with exact titles and content", () => {
      const units = parseStructuredMarkdown(GROUNDING_THROUGH_THE_FEET);

      expect(units).toHaveLength(3);
      expect(units.map((unit) => unit.unit_id)).toEqual(["unit-1", "unit-2", "unit-3"]);
      expect(units.map((unit) => unit.unit_title)).toEqual([
        "Feel the Ground",
        "Root and Rise",
        "Return to the Room",
      ]);
      expect(units[0]).toMatchObject({
        unit_order: 1,
        unit_rationale: null,
        unit_content:
          "Stand or sit with both feet flat on the floor. Notice the points of contact between your feet\n" +
          "and the ground beneath you.",
      });
      expect(units[1]).toMatchObject({
        unit_order: 2,
        unit_rationale: null,
        unit_content:
          "Imagine roots extending from your feet into the earth on the inhale, and a gentle lengthening\n" +
          "through your spine on the exhale. Repeat for five full breaths.",
      });
      expect(units[2]).toMatchObject({
        unit_order: 3,
        unit_rationale: null,
        unit_content:
          "Open your eyes if they were closed, and take a moment to notice how your body feels now compared\n" +
          "to when you started.",
      });
    });

    it("parses Loosening the Shoulders and Neck into three ordered units with exact titles and content", () => {
      const units = parseStructuredMarkdown(LOOSENING_THE_SHOULDERS_AND_NECK);

      expect(units).toHaveLength(3);
      expect(units.map((unit) => unit.unit_id)).toEqual(["unit-1", "unit-2", "unit-3"]);
      expect(units.map((unit) => unit.unit_title)).toEqual([
        "Notice the Holding Pattern",
        "Slow Rolls",
        "Soften the Neck",
      ]);
      expect(units[0]).toMatchObject({
        unit_order: 1,
        unit_rationale: null,
        unit_content:
          "Bring gentle awareness to your shoulders and neck. Notice where you may be holding tension\n" +
          "without realizing it.",
      });
      expect(units[1]).toMatchObject({
        unit_order: 2,
        unit_rationale: null,
        unit_content:
          "Slowly roll your shoulders backward five times, then forward five times, keeping the movement\n" +
          "slow and unforced.",
      });
      expect(units[2]).toMatchObject({
        unit_order: 3,
        unit_rationale: null,
        unit_content:
          "Gently tilt your head toward one shoulder, hold for three breaths, then repeat on the other\n" +
          "side. Let your neck feel a little longer with each breath.",
      });
    });
  });

  describe("module isolation", () => {
    it("player-engine never imports content-parser (Path B structural guard)", () => {
      const specifiers = getModuleSpecifiersFromFile(new URL("../player-engine/index.ts", import.meta.url));

      expect(findForbiddenModuleReference(specifiers, "content-parser")).toBeUndefined();
    });
  });
});
