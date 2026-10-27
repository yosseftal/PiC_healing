import { describe, expect, it } from "vitest";
import {
  approvedGuideIntroduction,
  approvedVideoTitles,
  approvedWelcomeCopy,
  W13_07_COPY_REVISION,
} from "./education-content";

describe("approved W13-07 education copy", () => {
  it("contains only revision r1 welcome and non-procedural guide copy with its real Hebrew locale", () => {
    expect(W13_07_COPY_REVISION).toBe("r1");
    expect(approvedWelcomeCopy.purpose.text).toBe(
      "ברוכה הבאה ל־PIC. כאן תוכלי לרשום את הנושאים שתרצי לעבוד עליהם, לבחור את סדר העדיפויות שלך ולתעד את הדרך שלך, בקצב שלך.",
    );
    expect(approvedWelcomeCopy.background.text).toBe(
      "את שיטת PIC פיתחה סיגל ניצן מתוך מסע אישי של התמודדות וחיפוש. " +
      "באתר השיטה היא משתפת בדרך שהובילה אותה לפיתוח הכלים ולהנגשתם לאחרים.",
    );
    expect(approvedGuideIntroduction.paragraphs).toEqual([
      "מבחן שרירים הוא אחד הכלים המוצגים בשיטת PIC לקבלת תשובות של כן ולא. " +
      "בהדגמה של סיגל ניצן תוכלי להכיר את אופן הביצוע. אפשר לחזור להדרכה בכל שלב וללמוד בקצב שלך.",
    ]);
    expect([
      approvedWelcomeCopy.purpose.locale,
      approvedWelcomeCopy.background.locale,
      approvedGuideIntroduction.locale,
    ]).toEqual(["he", "he", "he"]);
    expect(approvedGuideIntroduction.provenance.timestamps).toEqual([]);
    expect(approvedVideoTitles).toEqual({ he: "הדגמת השיטה", en: "Method demonstration" });
  });
});
