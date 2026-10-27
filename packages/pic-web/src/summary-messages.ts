import { createMessageResolver, type MessageDictionaries } from "./i18n/messages";

export const summaryDefinitions = {
  unavailable: { params: [] },
  intensity: { params: ["intensity", "maximum"] },
  view: { params: [] },
  manual: { params: [] },
  polarity: { params: [] },
  negative: { params: [] },
  positive: { params: [] },
  unrated: { params: [] },
  rerate: { params: [] },
  save: { params: [] },
  cancel: { params: [] },
  pending: { params: [] },
  choose: { params: [] },
} as const;

export const summaryDictionaries: MessageDictionaries<typeof summaryDefinitions> = {
  en: {
    unavailable: "This information is currently unavailable.", intensity: "Intensity {intensity}/{maximum}",
    view: "Summary view", manual: "Manual priority", polarity: "By polarity",
    negative: "Negative", positive: "Positive", unrated: "Unrated", rerate: "Rate this topic again",
    save: "Save current rating", cancel: "Return to summary", pending: "Your current rating is retained. Try saving again.",
    choose: "Choose current intensity",
  },
  he: {
    unavailable: "המידע אינו זמין כרגע.", intensity: "עוצמה {intensity}/{maximum}",
    view: "תצוגת הרשימה", manual: "סדר עדיפות ידני", polarity: "לפי קוטביות",
    negative: "שלילית", positive: "חיובית", unrated: "ללא דירוג", rerate: "דירוג הנושא מחדש",
    save: "שמירת הדירוג הנוכחי", cancel: "חזרה לסיכום", pending: "הדירוג הנוכחי שמור כאן. אפשר לנסות לשמור שוב.",
    choose: "בחירת העוצמה הנוכחית",
  },
};

export const summaryMessage = createMessageResolver(summaryDefinitions, summaryDictionaries, "unavailable");
