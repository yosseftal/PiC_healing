import type { Locale } from "./i18n/locale";

export const W13_07_COPY_REVISION = "r1" as const;

export type EducationProvenance = {
  sourceUrl: string;
  sourceLabel: string;
  timestamps: readonly string[];
  approvalRevision: string;
};

export type EducationCopyParagraph = {
  text: string;
  locale: Locale;
  provenance: EducationProvenance;
};

export type EducationSection = {
  id: string;
  locale: Locale;
  heading: string;
  paragraphs: readonly string[];
  provenance: EducationProvenance;
};

export type WelcomeEducationCopy = {
  purpose: EducationCopyParagraph;
  background: EducationCopyParagraph;
};

const homePage: EducationProvenance = {
  sourceUrl: "https://pic-healing.com/",
  sourceLabel: "האתר הרשמי של PIC",
  timestamps: [],
  approvalRevision: W13_07_COPY_REVISION,
};
const methodPage: EducationProvenance = {
  sourceUrl: "https://pic-healing.com/שיטת-pic/",
  sourceLabel: "עמוד השיטה באתר PIC",
  timestamps: [],
  approvalRevision: W13_07_COPY_REVISION,
};

export const approvedWelcomeCopy: WelcomeEducationCopy = {
  purpose: {
    text: "ברוכה הבאה ל־PIC. כאן תוכלי לרשום את הנושאים שתרצי לעבוד עליהם, לבחור את סדר העדיפויות שלך " +
      "ולתעד את הדרך שלך, בקצב שלך.",
    locale: "he",
    provenance: homePage,
  },
  background: {
    text: "את שיטת PIC פיתחה סיגל ניצן מתוך מסע אישי של התמודדות וחיפוש. " +
      "באתר השיטה היא משתפת בדרך שהובילה אותה לפיתוח הכלים ולהנגשתם לאחרים.",
    locale: "he",
    provenance: methodPage,
  },
};

export const approvedGuideIntroduction: EducationSection = {
  id: "w13-07-method-introduction-r1",
  locale: "he",
  heading: "על השיטה ומבחן השרירים",
  paragraphs: [
    "מבחן שרירים הוא אחד הכלים המוצגים בשיטת PIC לקבלת תשובות של כן ולא. " +
      "בהדגמה של סיגל ניצן תוכלי להכיר את אופן הביצוע. אפשר לחזור להדרכה בכל שלב וללמוד בקצב שלך.",
  ],
  provenance: methodPage,
};

export const approvedVideoTitles: Record<Locale, string> = {
  he: "הדגמת השיטה",
  en: "Method demonstration",
};
