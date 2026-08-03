import { describe, expect, it } from "vitest";
import { extractRelativeModuleSpecifiers, findForbiddenModuleReference, stripComments } from "./isolation-scanner";

/**
 * Proves the Wave 3 audit's "Should-fix" #3 hardening actually closes the two blind spots the old
 * per-line `.startsWith("import ")` filter had (empirically verified by the audit): multi-line/
 * destructured imports, and `export ... from` / `export * from` re-exports. Each `it()` below
 * corresponds to one previously-unhandled case, plus the false-positive guard the isolation tests
 * already relied on (comments never count as imports).
 */
describe("extractRelativeModuleSpecifiers", () => {
  it("detects a single-line import (the case the old filter already handled)", () => {
    const source = `import { Foo } from "../group-engine";\n`;

    expect(extractRelativeModuleSpecifiers(source)).toContain("../group-engine");
  });

  it("detects a multi-line/destructured import's specifier, even though the opening line has no path", () => {
    const source = [
      "import {",
      "  Foo,",
      "  Bar,",
      '} from "../group-engine";',
      "",
    ].join("\n");

    expect(extractRelativeModuleSpecifiers(source)).toContain("../group-engine");
  });

  it('detects an "export * from" re-export', () => {
    const source = `export * from "../group-engine";\n`;

    expect(extractRelativeModuleSpecifiers(source)).toContain("../group-engine");
  });

  it('detects an "export { X } from" re-export, including a multi-line one', () => {
    const singleLine = `export { Foo } from "../group-engine";\n`;
    const multiLine = ["export {", "  Foo,", '} from "../group-engine";', ""].join("\n");

    expect(extractRelativeModuleSpecifiers(singleLine)).toContain("../group-engine");
    expect(extractRelativeModuleSpecifiers(multiLine)).toContain("../group-engine");
  });

  it("detects a dynamic import() call", () => {
    const source = `const mod = await import("../group-engine");\n`;

    expect(extractRelativeModuleSpecifiers(source)).toContain("../group-engine");
  });

  it("never treats a block-comment mention of a forbidden module path as a real import", () => {
    const source = [
      "/**",
      " * See `../group-engine/index.ts` for the sibling module this one must never import.",
      " * Or, phrased with an actual quoted string for good measure: \"../group-engine\".",
      " */",
      'import type { RepositoryPort } from "../repository-port";',
      "",
    ].join("\n");

    expect(extractRelativeModuleSpecifiers(source)).not.toContain("../group-engine");
    expect(extractRelativeModuleSpecifiers(source)).not.toContain("../group-engine/index.ts");
  });

  it("never treats a line-comment mention of a forbidden module path as a real import", () => {
    const source = [
      '// cross-reference: "../group-engine" is intentionally never imported here.',
      'import type { RepositoryPort } from "../repository-port";',
      "",
    ].join("\n");

    expect(extractRelativeModuleSpecifiers(source)).not.toContain("../group-engine");
  });

  it("never treats a bare package specifier (no leading ./ or ../) as a relative module", () => {
    const source = `import { describe } from "vitest";\n`;

    expect(extractRelativeModuleSpecifiers(source)).toEqual([]);
  });
});

describe("stripComments", () => {
  it("extracted for ticket 08's bare-identifier ban - removes block and line comments alike", () => {
    const source = [
      "/** mentions Symptom in a block comment */",
      "// mentions Symptom in a line comment too",
      "const realCode = 1; // Symptom trailing comment",
    ].join("\n");

    const stripped = stripComments(source);

    expect(stripped).not.toContain("Symptom");
    expect(stripped).toContain("const realCode = 1;");
  });
});

describe("findForbiddenModuleReference", () => {
  it("finds a match when a specifier contains the forbidden module name", () => {
    const specifiers = ["../types", "../group-engine/index"];

    expect(findForbiddenModuleReference(specifiers, "group-engine")).toBe("../group-engine/index");
  });

  it("returns undefined when no specifier references the forbidden module", () => {
    const specifiers = ["../types", "../repository-port"];

    expect(findForbiddenModuleReference(specifiers, "group-engine")).toBeUndefined();
  });
});
