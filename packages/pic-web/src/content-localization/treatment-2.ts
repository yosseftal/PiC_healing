/** Frozen web-owned English source and approved product translation. Never derive from live seed exports. */
import type { ApprovedTreatmentContent } from "./types";
import { PRODUCT_CONTENT_APPROVAL } from "./permission";

const englishUnits = [
  {
    unit_id: "unit-1", unit_order: 1, unit_title: "Feel the Ground",
    unit_content: `Stand or sit with both feet flat on the floor. Notice the points of contact between your feet
and the ground beneath you.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-2", unit_order: 2, unit_title: "Root and Rise",
    unit_content: `Imagine roots extending from your feet into the earth on the inhale, and a gentle lengthening
through your spine on the exhale. Repeat for five full breaths.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-3", unit_order: 3, unit_title: "Return to the Room",
    unit_content: `Open your eyes if they were closed, and take a moment to notice how your body feels now compared
to when you started.

| Before | After |
| --- | --- |
| ~~Unsteady~~ | Grounded |
| Tense | Settled |

- [x] Felt both feet on the floor
- [ ] Noticed the shift in my breath`,
    unit_rationale: null,
  },
];
const hebrewUnits = [
  {
    unit_id: "unit-1", unit_order: 1, unit_title: "לחוש את הקרקע",
    unit_content: `לעמוד או לשבת כששתי כפות הרגליים מונחות במלואן על הרצפה. לשים לב לנקודות המגע בין כפות הרגליים
לקרקע שמתחתיהן.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-2", unit_order: 2, unit_title: "שורשים והתארכות",
    unit_content: `בשאיפה, לדמיין שורשים הנשלחים מכפות הרגליים אל האדמה, ובנשיפה — התארכות עדינה לאורך עמוד השדרה.
לחזור על כך במשך חמש נשימות מלאות.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-3", unit_order: 3, unit_title: "חזרה לחדר",
    unit_content: `אם העיניים היו עצומות, לפתוח אותן ולקחת רגע לשים לב לתחושת הגוף עכשיו לעומת תחושתו בתחילת
התרגול.

| לפני | אחרי |
| --- | --- |
| ~~חוסר יציבות~~ | קרקוע |
| מתח | רוגע |

- [x] הרגשתי את שתי כפות הרגליים על הרצפה
- [ ] שמתי לב לשינוי בנשימה שלי`,
    unit_rationale: null,
  },
];

export const treatment2: ApprovedTreatmentContent = {
  source: {
    id: "c818490b-10ed-46c2-9890-1f35d34f4e25", title: "Grounding Through the Feet", content_format: "structured_markdown",
    structured_markdown: `### Feel the Ground

Stand or sit with both feet flat on the floor. Notice the points of contact between your feet
and the ground beneath you.

### Root and Rise

Imagine roots extending from your feet into the earth on the inhale, and a gentle lengthening
through your spine on the exhale. Repeat for five full breaths.

### Return to the Room

Open your eyes if they were closed, and take a moment to notice how your body feels now compared
to when you started.

| Before | After |
| --- | --- |
| ~~Unsteady~~ | Grounded |
| Tense | Settled |

- [x] Felt both feet on the floor
- [ ] Noticed the shift in my breath`,
  },
  sourceLanguage: "en", revision: "wave-11-2026-10-11-2",
  permission: PRODUCT_CONTENT_APPROVAL,
  provenance: "Product-approved bundled treatment; user authorization 2026-10-11. No website publication claim.",
  units: englishUnits,
  locales: {
    en: {
      approval: PRODUCT_CONTENT_APPROVAL, sourceRevision: "wave-11-2026-10-11-2", locale: "en",
      title: "Grounding Through the Feet", units: englishUnits,
    },
    he: {
      approval: PRODUCT_CONTENT_APPROVAL, sourceRevision: "wave-11-2026-10-11-2", locale: "he",
      title: "קרקוע דרך כפות הרגליים", units: hebrewUnits,
    },
  },
};
