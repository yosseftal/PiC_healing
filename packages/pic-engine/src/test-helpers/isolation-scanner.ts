/**
 * Shared module-isolation source-scan helper (extracted during Wave 3's audit response; previously
 * duplicated verbatim between `library-engine/library-engine.test.ts` and
 * `timeline-engine/timeline-engine.test.ts`).
 *
 * Verifies that a given engine module contains zero import / export-from edges into a set of forbidden
 * sibling modules (e.g. `LibraryEngine` importing `PlayerEngine`). Ticket 04's dependency-cruiser
 * guardrail is explicitly scoped to only the player-engine <-> group-engine pair ("Do not add rules
 * restricting any other module pair... out of scope for this rule"), so every other engine pair
 * (library-engine, timeline-engine, and eventually session-engine per tickets 07-09) is verified this
 * way instead - a lightweight source-scan, not a build-time dependency-graph tool.
 *
 * Hardened per Wave 3's audit "Should-fix" #3: the original per-file implementation filtered lines with
 * `.trim().startsWith("import ")`, which had two blind spots (empirically verified):
 * 1. A multi-line/destructured import's actual module specifier lives on a *different* line than the
 *    one starting with `import` (e.g. the `from "../x"` clause after a multi-line `{ ... }` list), so it
 *    was silently excluded from the per-line filter entirely.
 * 2. `export * from "../x"` / `export { X } from "../x"` re-exports never start with `import` at all, so
 *    they were invisible to the old filter regardless of line count.
 *
 * This version instead strips comments first, then scans the *entire* remaining source for every quoted
 * string shaped like a relative module specifier (`"./x"` / `"../x"`) - the one substring every import,
 * every `export ... from`, every `export * from`, and every dynamic `import(...)` call has in common,
 * regardless of how many lines the surrounding statement spans or which keyword introduces it. Comments
 * are stripped first (not merely relied upon to use backticks) so a doc comment that legitimately
 * cross-references a sibling module in prose - even via an actual quoted string, not just a backticked
 * code span - can never be mistaken for a real import. The acceptance criterion this backs is "never
 * imports," not "never mentions."
 *
 * `stripComments` is exported standalone (extracted during ticket 08) so a module with its own additional
 * "never reference bare identifier X" requirement (e.g. `PlayerEngine`'s "zero import of ... `Symptom`,
 * `Polarity`, or `Intensity` types" - a bare-word ban, not a module-specifier ban, since those are named
 * type exports from `../types`, a module `PlayerEngine` legitimately imports for other reasons) can reuse
 * the identical comment-stripping rule rather than duplicating the two regexes.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT_PATTERN = /\/\/.*$/gm;
const RELATIVE_MODULE_SPECIFIER_PATTERN = /["'](\.\.?\/[^"'\n]*)["']/g;

/** Strips block and line comments from `source`. See this file's header comment for why. */
export function stripComments(source: string): string {
  return source.replace(BLOCK_COMMENT_PATTERN, "").replace(LINE_COMMENT_PATTERN, "");
}

/**
 * Every relative module specifier (`"./x"` / `"../x"`) referenced anywhere in `source`, with block and
 * line comments stripped first. Exported standalone so this extraction logic is directly unit-testable
 * (see `isolation-scanner.test.ts`) independent of any real file on disk.
 */
export function extractRelativeModuleSpecifiers(source: string): string[] {
  const withoutComments = stripComments(source);
  return [...withoutComments.matchAll(RELATIVE_MODULE_SPECIFIER_PATTERN)].map((match) => match[1]);
}

/** Reads the file at `sourceFileUrl` (pass e.g. `new URL("./index.ts", import.meta.url)`) as text. */
export function readSourceFile(sourceFileUrl: string | URL): string {
  const sourcePath = fileURLToPath(sourceFileUrl);
  return readFileSync(sourcePath, "utf8");
}

/**
 * Reads the file at `sourceFileUrl` (pass `import.meta.url` from a co-located test, e.g.
 * `new URL("./index.ts", import.meta.url)`) and returns every relative module specifier it references.
 */
export function getModuleSpecifiersFromFile(sourceFileUrl: string | URL): string[] {
  return extractRelativeModuleSpecifiers(readSourceFile(sourceFileUrl));
}

/**
 * Returns the first specifier in `specifiers` that references `forbiddenModule` (e.g.
 * `findForbiddenModuleReference(specifiers, "group-engine")` matches `"../group-engine"` and
 * `"../group-engine/index"` alike), or `undefined` if none does. Returning the match itself - rather
 * than a bare boolean - lets a failing test's error message show exactly which specifier tripped the
 * check.
 */
export function findForbiddenModuleReference(
  specifiers: string[],
  forbiddenModule: string,
): string | undefined {
  return specifiers.find((specifier) => specifier.includes(forbiddenModule));
}
