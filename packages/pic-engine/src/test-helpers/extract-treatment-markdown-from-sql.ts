/**
 * Test-only reader for Wave 9.1 Decision C (Bootstrap Data Integrity). Scans SQL migration files
 * for every `structured_markdown` value actually written by INSERT or UPDATE, handling the two
 * quoting shapes this repo uses today: single-quoted literals (`''` unescapes to `'`) and
 * untagged dollar-quoted `$$...$$` blocks (taken literally). Not part of pic-engine's public barrel.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

export type TreatmentMarkdownWrite = {
  sourceFileName: string;
  title: string | null;
  id: string | null;
  structuredMarkdown: string;
};

const TAGGED_DOLLAR_QUOTE_PATTERN = /^\$[A-Za-z_][A-Za-z0-9_]*\$/;
const WHERE_ID_PATTERN = /\bid\s*=\s*'((?:[^']|'')*)'/i;

type ParsedSqlValue =
  | { kind: "null" }
  | { kind: "boolean"; value: boolean }
  | { kind: "number"; value: string }
  | { kind: "string"; value: string };

function isIdentChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_]/.test(ch);
}

function unsupportedQuoting(sourceFileName: string, detail: string): never {
  throw new Error(`${sourceFileName}: ${detail}`);
}

function matchWord(sql: string, i: number, word: string): boolean {
  if (sql.slice(i, i + word.length).toLowerCase() !== word) {
    return false;
  }
  if (i > 0 && isIdentChar(sql[i - 1])) {
    return false;
  }
  if (isIdentChar(sql[i + word.length])) {
    return false;
  }
  return true;
}

function skipTrivia(sql: string, start: number): number {
  let i = start;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i += 1;
      continue;
    }
    if (ch === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") {
        i += 1;
      }
      continue;
    }
    if (ch === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      if (end === -1) {
        return sql.length;
      }
      i = end + 2;
      continue;
    }
    break;
  }
  return i;
}

function taggedDollarQuoteAt(sql: string, i: number): string | null {
  const match = TAGGED_DOLLAR_QUOTE_PATTERN.exec(sql.slice(i));
  return match ? match[0] : null;
}

function skipSingleQuoted(sql: string, start: number, sourceFileName: string): number {
  let i = start + 1;
  while (i < sql.length) {
    if (sql[i] === "'") {
      if (sql[i + 1] === "'") {
        i += 2;
        continue;
      }
      return i + 1;
    }
    i += 1;
  }
  unsupportedQuoting(sourceFileName, "unclosed single-quoted string literal");
}

function readSingleQuoted(
  sql: string,
  start: number,
  sourceFileName: string,
): { value: string; nextIndex: number } {
  let i = start + 1;
  let value = "";
  while (i < sql.length) {
    if (sql[i] === "'") {
      if (sql[i + 1] === "'") {
        value += "'";
        i += 2;
        continue;
      }
      return { value, nextIndex: i + 1 };
    }
    value += sql[i];
    i += 1;
  }
  unsupportedQuoting(sourceFileName, "unclosed single-quoted string literal");
}

function readUntaggedDollarQuoted(
  sql: string,
  start: number,
  sourceFileName: string,
): { value: string; nextIndex: number } {
  const close = sql.indexOf("$$", start + 2);
  if (close === -1) {
    unsupportedQuoting(sourceFileName, "unclosed untagged dollar-quoted block");
  }
  return { value: sql.slice(start + 2, close), nextIndex: close + 2 };
}

function skipDollarQuoted(sql: string, start: number, sourceFileName: string): number {
  const tagged = taggedDollarQuoteAt(sql, start);
  if (tagged !== null) {
    const close = sql.indexOf(tagged, start + tagged.length);
    if (close === -1) {
      unsupportedQuoting(sourceFileName, `unclosed tagged dollar-quoted block ${tagged}`);
    }
    return close + tagged.length;
  }
  if (sql.startsWith("$$", start)) {
    return readUntaggedDollarQuoted(sql, start, sourceFileName).nextIndex;
  }
  return start;
}

function skipToSemicolon(sql: string, start: number, sourceFileName: string): number {
  let i = start;
  while (i < sql.length) {
    i = skipTrivia(sql, i);
    if (i >= sql.length) {
      return i;
    }
    if (sql[i] === "'") {
      i = skipSingleQuoted(sql, i, sourceFileName);
      continue;
    }
    if (sql[i] === "$") {
      const afterQuote = skipDollarQuoted(sql, i, sourceFileName);
      if (afterQuote !== i) {
        i = afterQuote;
        continue;
      }
    }
    if (sql[i] === ";") {
      return i + 1;
    }
    i += 1;
  }
  return i;
}

function readIdentifier(sql: string, start: number, sourceFileName: string): { name: string; nextIndex: number } {
  let i = skipTrivia(sql, start);
  if (sql[i] === '"') {
    let name = "";
    i += 1;
    while (i < sql.length) {
      if (sql[i] === '"') {
        if (sql[i + 1] === '"') {
          name += '"';
          i += 2;
          continue;
        }
        return { name, nextIndex: i + 1 };
      }
      name += sql[i];
      i += 1;
    }
    unsupportedQuoting(sourceFileName, "unclosed quoted identifier");
  }
  if (!sql[i] || !/[A-Za-z_]/.test(sql[i])) {
    unsupportedQuoting(sourceFileName, `expected identifier, found ${JSON.stringify(sql[i])}`);
  }
  const from = i;
  i += 1;
  while (i < sql.length && isIdentChar(sql[i])) {
    i += 1;
  }
  return { name: sql.slice(from, i).toLowerCase(), nextIndex: i };
}

function readIdentifierPath(sql: string, start: number, sourceFileName: string): { nextIndex: number } {
  let i = start;
  while (true) {
    const ident = readIdentifier(sql, i, sourceFileName);
    i = skipTrivia(sql, ident.nextIndex);
    if (sql[i] === ".") {
      i += 1;
      continue;
    }
    return { nextIndex: ident.nextIndex };
  }
}

function parseSqlValue(sql: string, start: number, sourceFileName: string): { value: ParsedSqlValue; nextIndex: number } {
  const i = skipTrivia(sql, start);
  if (matchWord(sql, i, "null")) {
    return { value: { kind: "null" }, nextIndex: i + 4 };
  }
  if (matchWord(sql, i, "true")) {
    return { value: { kind: "boolean", value: true }, nextIndex: i + 4 };
  }
  if (matchWord(sql, i, "false")) {
    return { value: { kind: "boolean", value: false }, nextIndex: i + 5 };
  }
  if (sql[i] === "'") {
    const quoted = readSingleQuoted(sql, i, sourceFileName);
    return { value: { kind: "string", value: quoted.value }, nextIndex: quoted.nextIndex };
  }
  const tagged = taggedDollarQuoteAt(sql, i);
  if (tagged !== null) {
    unsupportedQuoting(
      sourceFileName,
      `tagged dollar quotes (${tagged}) are not a supported structured_markdown quoting shape`,
    );
  }
  if (sql.startsWith("$$", i)) {
    const quoted = readUntaggedDollarQuoted(sql, i, sourceFileName);
    return { value: { kind: "string", value: quoted.value }, nextIndex: quoted.nextIndex };
  }
  if (sql[i] === "E" || sql[i] === "e") {
    const next = skipTrivia(sql, i + 1);
    if (sql[next] === "'") {
      unsupportedQuoting(sourceFileName, "C-style E'...' string literals are not a supported quoting shape");
    }
  }
  if (sql[i] === "-" || (sql[i] !== undefined && /[0-9]/.test(sql[i]))) {
    let j = i;
    if (sql[j] === "-") {
      j += 1;
    }
    const numStart = j;
    while (j < sql.length && /[0-9.]/.test(sql[j]!)) {
      j += 1;
    }
    if (j > numStart) {
      return { value: { kind: "number", value: sql.slice(i, j) }, nextIndex: j };
    }
  }
  unsupportedQuoting(
    sourceFileName,
    `unsupported SQL value starting at index ${i}: ${JSON.stringify(sql.slice(i, i + 24))}`,
  );
}

function parseParenthesizedIdentifierList(
  sql: string,
  start: number,
  sourceFileName: string,
): { names: string[]; nextIndex: number } {
  let i = skipTrivia(sql, start);
  if (sql[i] !== "(") {
    unsupportedQuoting(sourceFileName, "expected '(' beginning a column list");
  }
  i += 1;
  const names: string[] = [];
  i = skipTrivia(sql, i);
  if (sql[i] === ")") {
    return { names, nextIndex: i + 1 };
  }
  while (true) {
    const ident = readIdentifier(sql, i, sourceFileName);
    names.push(ident.name);
    i = skipTrivia(sql, ident.nextIndex);
    if (sql[i] === ",") {
      i += 1;
      continue;
    }
    if (sql[i] === ")") {
      return { names, nextIndex: i + 1 };
    }
    unsupportedQuoting(sourceFileName, "expected ',' or ')' in column list");
  }
}

function parseParenthesizedValueList(
  sql: string,
  start: number,
  sourceFileName: string,
): { values: ParsedSqlValue[]; nextIndex: number } {
  let i = skipTrivia(sql, start);
  if (sql[i] !== "(") {
    unsupportedQuoting(sourceFileName, "expected '(' beginning a VALUES tuple");
  }
  i += 1;
  const values: ParsedSqlValue[] = [];
  i = skipTrivia(sql, i);
  if (sql[i] === ")") {
    return { values, nextIndex: i + 1 };
  }
  while (true) {
    const parsed = parseSqlValue(sql, i, sourceFileName);
    values.push(parsed.value);
    i = skipTrivia(sql, parsed.nextIndex);
    if (sql[i] === ",") {
      i += 1;
      continue;
    }
    if (sql[i] === ")") {
      return { values, nextIndex: i + 1 };
    }
    unsupportedQuoting(sourceFileName, "expected ',' or ')' in VALUES tuple");
  }
}

function stringFromAssignment(value: ParsedSqlValue | undefined): string | null {
  if (value === undefined || value.kind !== "string") {
    return null;
  }
  return value.value;
}

function parseInsert(
  sql: string,
  start: number,
  sourceFileName: string,
): { rows: TreatmentMarkdownWrite[]; nextIndex: number } {
  let i = skipTrivia(sql, start + "insert".length);
  if (!matchWord(sql, i, "into")) {
    return { rows: [], nextIndex: skipToSemicolon(sql, i, sourceFileName) };
  }
  i = skipTrivia(sql, i + "into".length);
  const table = readIdentifierPath(sql, i, sourceFileName);
  i = skipTrivia(sql, table.nextIndex);
  if (sql[i] !== "(") {
    return { rows: [], nextIndex: skipToSemicolon(sql, i, sourceFileName) };
  }
  const columns = parseParenthesizedIdentifierList(sql, i, sourceFileName);
  i = skipTrivia(sql, columns.nextIndex);
  const markdownIndex = columns.names.indexOf("structured_markdown");
  if (markdownIndex === -1) {
    return { rows: [], nextIndex: skipToSemicolon(sql, i, sourceFileName) };
  }
  if (!matchWord(sql, i, "values")) {
    unsupportedQuoting(
      sourceFileName,
      "INSERT writes structured_markdown without a VALUES clause (SELECT or DEFAULT VALUES)",
    );
  }
  i = skipTrivia(sql, i + "values".length);
  const tuples: ParsedSqlValue[][] = [];
  while (true) {
    const tuple = parseParenthesizedValueList(sql, i, sourceFileName);
    tuples.push(tuple.values);
    i = skipTrivia(sql, tuple.nextIndex);
    if (sql[i] === ",") {
      i += 1;
      continue;
    }
    break;
  }
  const nextIndex = skipToSemicolon(sql, i, sourceFileName);
  const titleIndex = columns.names.indexOf("title");
  const idIndex = columns.names.indexOf("id");
  const rows: TreatmentMarkdownWrite[] = [];
  for (const values of tuples) {
    const markdownValue = values[markdownIndex];
    if (markdownValue === undefined || markdownValue.kind !== "string") {
      unsupportedQuoting(
        sourceFileName,
        "INSERT structured_markdown is not a string literal (null or non-literal expression)",
      );
    }
    rows.push({
      sourceFileName,
      title: stringFromAssignment(titleIndex === -1 ? undefined : values[titleIndex]),
      id: stringFromAssignment(idIndex === -1 ? undefined : values[idIndex]),
      structuredMarkdown: markdownValue.value,
    });
  }
  return { rows, nextIndex };
}

function skipExpression(sql: string, start: number, sourceFileName: string): number {
  let i = start;
  let depth = 0;
  while (i < sql.length) {
    i = skipTrivia(sql, i);
    if (i >= sql.length) {
      return i;
    }
    if (sql[i] === "'") {
      i = skipSingleQuoted(sql, i, sourceFileName);
      continue;
    }
    if (sql[i] === "$") {
      const afterQuote = skipDollarQuoted(sql, i, sourceFileName);
      if (afterQuote !== i) {
        i = afterQuote;
        continue;
      }
    }
    if (sql[i] === "(" || sql[i] === "[") {
      depth += 1;
      i += 1;
      continue;
    }
    if (sql[i] === ")" || sql[i] === "]") {
      if (depth === 0) {
        return i;
      }
      depth -= 1;
      i += 1;
      continue;
    }
    if (depth === 0 && (sql[i] === "," || sql[i] === ";")) {
      return i;
    }
    if (depth === 0 && (matchWord(sql, i, "where") || matchWord(sql, i, "from"))) {
      return i;
    }
    i += 1;
  }
  return i;
}

function parseUpdateAssignments(
  sql: string,
  start: number,
  sourceFileName: string,
): { assignments: Map<string, ParsedSqlValue>; nextIndex: number } {
  const assignments = new Map<string, ParsedSqlValue>();
  let i = start;
  while (true) {
    const ident = readIdentifier(sql, i, sourceFileName);
    i = skipTrivia(sql, ident.nextIndex);
    if (sql[i] !== "=") {
      unsupportedQuoting(sourceFileName, "expected '=' in UPDATE SET assignment");
    }
    i += 1;
    if (ident.name === "structured_markdown" || ident.name === "title") {
      const parsed = parseSqlValue(sql, i, sourceFileName);
      assignments.set(ident.name, parsed.value);
      i = skipTrivia(sql, parsed.nextIndex);
    } else {
      i = skipTrivia(sql, skipExpression(sql, i, sourceFileName));
    }
    if (sql[i] === ",") {
      i += 1;
      continue;
    }
    return { assignments, nextIndex: i };
  }
}

function parseUpdate(
  sql: string,
  start: number,
  sourceFileName: string,
): { rows: TreatmentMarkdownWrite[]; nextIndex: number } {
  let i = skipTrivia(sql, start + "update".length);
  const table = readIdentifierPath(sql, i, sourceFileName);
  i = skipTrivia(sql, table.nextIndex);
  if (!matchWord(sql, i, "set")) {
    return { rows: [], nextIndex: skipToSemicolon(sql, i, sourceFileName) };
  }
  i = skipTrivia(sql, i + "set".length);
  const { assignments, nextIndex: afterSet } = parseUpdateAssignments(sql, i, sourceFileName);
  i = afterSet;
  let id: string | null = null;
  if (matchWord(sql, i, "where")) {
    const whereStart = i + "where".length;
    const afterWhere = skipToSemicolon(sql, whereStart, sourceFileName);
    const whereClause = sql.slice(whereStart, afterWhere);
    const idMatch = WHERE_ID_PATTERN.exec(whereClause);
    if (idMatch) {
      id = idMatch[1].replaceAll("''", "'");
    }
    i = afterWhere;
  } else {
    i = skipToSemicolon(sql, i, sourceFileName);
  }
  const markdownValue = assignments.get("structured_markdown");
  if (markdownValue === undefined) {
    return { rows: [], nextIndex: i };
  }
  if (markdownValue.kind !== "string") {
    unsupportedQuoting(
      sourceFileName,
      "UPDATE structured_markdown is not a string literal (null or non-literal expression)",
    );
  }
  return {
    rows: [
      {
        sourceFileName,
        title: stringFromAssignment(assignments.get("title")),
        id,
        structuredMarkdown: markdownValue.value,
      },
    ],
    nextIndex: i,
  };
}

/**
 * Extracts every `structured_markdown` value written by INSERT or UPDATE in `sql`.
 * Tagged dollar quotes used as a markdown value, C-style `E'...'` literals, and INSERT...SELECT
 * writes of that column raise rather than skip, so an unhandled quoting shape cannot pass silently.
 */
export function extractTreatmentMarkdownFromSql(
  sql: string,
  sourceFileName: string,
): TreatmentMarkdownWrite[] {
  const rows: TreatmentMarkdownWrite[] = [];
  let i = 0;
  while (i < sql.length) {
    i = skipTrivia(sql, i);
    if (i >= sql.length) {
      break;
    }
    if (matchWord(sql, i, "insert")) {
      const parsed = parseInsert(sql, i, sourceFileName);
      rows.push(...parsed.rows);
      i = parsed.nextIndex;
      continue;
    }
    if (matchWord(sql, i, "update")) {
      const parsed = parseUpdate(sql, i, sourceFileName);
      rows.push(...parsed.rows);
      i = parsed.nextIndex;
      continue;
    }
    if (sql.startsWith("$$", i)) {
      const quoted = readUntaggedDollarQuoted(sql, i, sourceFileName);
      rows.push(...extractTreatmentMarkdownFromSql(quoted.value, sourceFileName));
      i = quoted.nextIndex;
      continue;
    }
    const tagged = taggedDollarQuoteAt(sql, i);
    if (tagged !== null) {
      i = skipDollarQuoted(sql, i, sourceFileName);
      continue;
    }
    if (sql[i] === "'") {
      i = skipSingleQuoted(sql, i, sourceFileName);
      continue;
    }
    i += 1;
  }
  return rows;
}

function listSqlFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSqlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".sql")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

/** Globs every `*.sql` file under `migrationsDirectory` (including nested dirs) and extracts writes. */
export function readTreatmentMarkdownWritesFromMigrations(
  migrationsDirectory: string,
): TreatmentMarkdownWrite[] {
  const writes: TreatmentMarkdownWrite[] = [];
  for (const filePath of listSqlFiles(migrationsDirectory)) {
    const sourceFileName = relative(migrationsDirectory, filePath).split("\\").join("/");
    writes.push(...extractTreatmentMarkdownFromSql(readFileSync(filePath, "utf8"), sourceFileName));
  }
  return writes;
}
