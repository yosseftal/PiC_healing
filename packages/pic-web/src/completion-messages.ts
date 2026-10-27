import { createMessageResolver, type MessageDefinitions, type MessageDictionaries } from "./i18n/messages";
import type { Locale } from "./i18n/locale";

const definitions = {
  title: { params: [] },
  checking: { params: [] },
  recovery: { params: [] },
  retry: { params: [] },
  body: { params: [] },
  returnToGroup: { params: [] },
  startQuestionnaire: { params: [] },
  chooseTreatment: { params: [] },
} satisfies MessageDefinitions;

const dictionaries: MessageDictionaries<typeof definitions> = {
  he: {
    title: "הטיפול הסתיים",
    checking: "בודקים את מצב הסיום",
    recovery: "נבדוק את מצב הסיום לפני שנמשיך.",
    retry: "בדיקה נוספת",
    body: "אפשר לחזור לשאלון או לבחור טיפול נוסף מהקטלוג המשותף.",
    returnToGroup: "חזרה לסיכום השאלון",
    startQuestionnaire: "התחלת שאלון חדש",
    chooseTreatment: "בחירת טיפול נוסף מהקטלוג",
  },
  en: {
    title: "Treatment finished",
    checking: "Checking completion",
    recovery: "We need to check completion before continuing.",
    retry: "Check again",
    body: "Return to the questionnaire or choose another treatment from the shared catalog.",
    returnToGroup: "Return to questionnaire summary",
    startQuestionnaire: "Start a new questionnaire",
    chooseTreatment: "Choose another treatment from the shared catalog",
  },
};

const resolve = createMessageResolver(definitions, dictionaries, "title");

export type CompletionMessageKey = keyof typeof definitions;

export function completionMessage(locale: Locale, key: CompletionMessageKey) {
  return resolve(locale, key);
}
