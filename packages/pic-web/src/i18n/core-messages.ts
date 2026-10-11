import { createMessageResolver, type MessageTemplate } from "./messages";

export const messageDefinitions = {
  "system.unavailable": { params: [] },
  "language.label": { params: [] },
  "language.changed": { params: [] },
  "utilities.playerTitle": { params: [] },
  "utilities.playerDescription": { params: [] },
  "utilities.openPlayer": { params: [] },
  "utilities.trigger": { params: [] },
  "utilities.closePlayer": { params: [] },
  "utilities.playerContent": { params: [] },
  "utilities.sessionTitle": { params: [] },
  "utilities.openSession": { params: [] },
  "utilities.closeSession": { params: [] },
  "utilities.sessionContent": { params: [] },
} as const;

// Newly authored UI copy is product-approved for Wave 11 (2026-10-11), not a website quotation.
export const dictionaries = {
  he: {
    "system.unavailable": "הטקסט אינו זמין כרגע.",
    "language.label": "שפה",
    "language.changed": "השפה הוחלפה לעברית.",
    "utilities.playerTitle": "כלי הנגן",
    "utilities.playerDescription": "אפשר לבחור שלב או לסיים כשמתאים לך.",
    "utilities.openPlayer": "פתיחת כלי הנגן",
    "utilities.trigger": "כלים",
    "utilities.closePlayer": "סגירת כלי הנגן",
    "utilities.playerContent": "תוכן כלי הנגן",
    "utilities.sessionTitle": "כלים למרחב העבודה",
    "utilities.openSession": "פתיחת הכלים",
    "utilities.closeSession": "סגירת הכלים",
    "utilities.sessionContent": "תוכן הכלים",
  },
  en: {
    "system.unavailable": "Text is currently unavailable.",
    "language.label": "Language",
    "language.changed": "Language changed to English.",
    "utilities.playerTitle": "Player utilities",
    "utilities.playerDescription": "Choose a step or finish when you are ready.",
    "utilities.openPlayer": "Open Player utilities",
    "utilities.trigger": "Utilities",
    "utilities.closePlayer": "Close player utilities",
    "utilities.playerContent": "Player utilities content",
    "utilities.sessionTitle": "Session utilities",
    "utilities.openSession": "Open utilities",
    "utilities.closeSession": "Close utilities",
    "utilities.sessionContent": "Utilities content",
  },
} satisfies Record<"he" | "en", Record<keyof typeof messageDefinitions, MessageTemplate>>;

export const resolveMessage = createMessageResolver(
  messageDefinitions, dictionaries, "system.unavailable",
  (defect) => {
    if (import.meta.env.DEV) console.error(`UI message resolution: ${defect}`);
  },
);
