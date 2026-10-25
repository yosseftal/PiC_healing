import { describe, expect, it } from "vitest";
import { extractTreatmentMarkdownFromSql } from "./extract-treatment-markdown-from-sql";

describe("migration content scan with row locks", () => {
  it.each(["FOR UPDATE", "FOR /* owner lock */ UPDATE", "FOR NO KEY UPDATE"])(
    "retains actual content writes after %s",
    (clause) => {
      const sql = `do $$ begin
        select * from public.symptom_groups where id = v_id ${clause};
        update public.treatments set structured_markdown = '### Actual content' where id = 'fixture';
      end; $$;`;
      expect(extractTreatmentMarkdownFromSql(sql, "fixture.sql")).toEqual([{
        sourceFileName: "fixture.sql", title: null, id: "fixture", structuredMarkdown: "### Actual content",
      }]);
    },
  );
});
