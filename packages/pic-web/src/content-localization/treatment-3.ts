/** Frozen web-owned English source and approved product translation. Never derive from live seed exports. */
import type { ApprovedTreatmentContent } from "./types";
import { PRODUCT_CONTENT_APPROVAL } from "./permission";

const englishUnits = [
  {
    unit_id: "unit-1", unit_order: 1, unit_title: "Notice the Holding Pattern",
    unit_content: `Bring gentle awareness to your shoulders and neck. Notice where you may be holding tension
without realizing it.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-2", unit_order: 2, unit_title: "Slow Rolls",
    unit_content: `Slowly roll your shoulders backward five times, then forward five times, keeping the movement
slow and unforced.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-3", unit_order: 3, unit_title: "Soften the Neck",
    unit_content: `Gently tilt your head toward one shoulder, hold for three breaths, then repeat on the other
side. Let your neck feel a little longer with each breath.`,
    unit_rationale: null,
  },
];
const hebrewUnits = [
  {
    unit_id: "unit-1", unit_order: 1, unit_title: "לשים לב לדפוס ההחזקה",
    unit_content: `להפנות מודעות עדינה לכתפיים ולצוואר. לשים לב היכן ייתכן שיש מתח שמוחזק בלי ששמת לב אליו.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-2", unit_order: 2, unit_title: "סיבובים איטיים",
    unit_content: `לסובב את הכתפיים באיטיות לאחור חמש פעמים, ואז קדימה חמש פעמים, בתנועה איטית ובלי לאלץ אותה.`,
    unit_rationale: null,
  },
  {
    unit_id: "unit-3", unit_order: 3, unit_title: "הרפיית הצוואר",
    unit_content: `להטות בעדינות את הראש לכיוון כתף אחת, להישאר כך במשך שלוש נשימות, ואז לחזור על כך בצד השני.
לאפשר לצוואר להרגיש מעט ארוך יותר עם כל נשימה.`,
    unit_rationale: null,
  },
];

export const treatment3: ApprovedTreatmentContent = {
  source: {
    id: "92be9fb3-7092-4a78-9fa2-4aee9ba34bc6", title: "Loosening the Shoulders and Neck", content_format: "structured_markdown",
    structured_markdown: `### Notice the Holding Pattern

Bring gentle awareness to your shoulders and neck. Notice where you may be holding tension
without realizing it.

### Slow Rolls

Slowly roll your shoulders backward five times, then forward five times, keeping the movement
slow and unforced.

### Soften the Neck

Gently tilt your head toward one shoulder, hold for three breaths, then repeat on the other
side. Let your neck feel a little longer with each breath.`,
  },
  sourceLanguage: "en", revision: "wave-11-2026-10-11-3",
  permission: PRODUCT_CONTENT_APPROVAL,
  provenance: "Product-approved bundled treatment; user authorization 2026-10-11. No website publication claim.",
  units: englishUnits,
  locales: {
    en: {
      approval: PRODUCT_CONTENT_APPROVAL, sourceRevision: "wave-11-2026-10-11-3", locale: "en",
      title: "Loosening the Shoulders and Neck", units: englishUnits,
    },
    he: {
      approval: PRODUCT_CONTENT_APPROVAL, sourceRevision: "wave-11-2026-10-11-3", locale: "he",
      title: "שחרור הכתפיים והצוואר", units: hebrewUnits,
    },
  },
};
