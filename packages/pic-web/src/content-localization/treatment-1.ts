/** Frozen web-owned English source and approved product translation. Never derive from live seed exports. */
import type { ApprovedTreatmentContent } from "./types";
import { PRODUCT_CONTENT_APPROVAL } from "./permission";

const englishUnits = [
  {
    unit_id: "unit-1", unit_order: 1, unit_title: "Settle Into Stillness",
    unit_content: `Find a comfortable seated or lying position. Take three slow breaths, letting your shoulders
drop a little further with each exhale.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-2", unit_order: 2, unit_title: "Scan the Sensation",
    unit_content: `Bring your attention to the area you chose to focus on today. Notice temperature, tension, and
any subtle pulsing, without trying to change anything yet.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-3", unit_order: 3, unit_title: "Release on the Exhale",
    unit_content: `With each exhale, imagine the tension softening by ten percent. Continue for about a minute,
then gently let your attention return to the room around you.`,
    unit_rationale: null,
  },
];
const hebrewUnits = [
  {
    unit_id: "unit-1", unit_order: 1, unit_title: "התמקמות בשקט",
    unit_content: `להתמקם בתנוחת ישיבה או שכיבה נוחה. לקחת שלוש נשימות איטיות, ולאפשר לכתפיים לרדת מעט יותר בכל
נשיפה.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-2", unit_order: 2, unit_title: "סריקת התחושה",
    unit_content: `להפנות את תשומת הלב לאזור שבחרת להתמקד בו היום. לשים לב לטמפרטורה, למתח ולפעימות עדינות, בלי
לנסות לשנות דבר בשלב זה.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-3", unit_order: 3, unit_title: "שחרור בנשיפה",
    unit_content: `בכל נשיפה, לדמיין שהמתח מתרכך בעשרה אחוזים. להמשיך במשך כדקה, ואז לאפשר לתשומת הלב לחזור
בעדינות לחדר סביבך.`,
    unit_rationale: null,
  },
];

export const treatment1: ApprovedTreatmentContent = {
  source: {
    id: "2c6e77bd-61db-4898-8612-84e976587ff7", title: "Settling the Nervous System", content_format: "structured_markdown",
    structured_markdown: `### Settle Into Stillness

Find a comfortable seated or lying position. Take three slow breaths, letting your shoulders
drop a little further with each exhale.

### Scan the Sensation

Bring your attention to the area you chose to focus on today. Notice temperature, tension, and
any subtle pulsing, without trying to change anything yet.

### Release on the Exhale

With each exhale, imagine the tension softening by ten percent. Continue for about a minute,
then gently let your attention return to the room around you.`,
  },
  sourceLanguage: "en", revision: "wave-11-2026-10-11-1",
  permission: PRODUCT_CONTENT_APPROVAL,
  provenance: "Product-approved bundled treatment; user authorization 2026-10-11. No website publication claim.",
  units: englishUnits,
  locales: {
    en: {
      approval: PRODUCT_CONTENT_APPROVAL, sourceRevision: "wave-11-2026-10-11-1", locale: "en",
      title: "Settling the Nervous System", units: englishUnits,
    },
    he: {
      approval: PRODUCT_CONTENT_APPROVAL, sourceRevision: "wave-11-2026-10-11-1", locale: "he",
      title: "הרגעת מערכת העצבים", units: hebrewUnits,
    },
  },
};
