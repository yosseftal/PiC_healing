import { createMessageResolver, type MessageDefinitions, type MessageDictionaries } from "./i18n/messages";

const definitions = {
  welcomeTitle: { params: [] },
  welcomeStage: { params: [] },
  welcomeStart: { params: [] },
  welcomeLearn: { params: [] },
  guideTitle: { params: [] },
  guideStage: { params: [] },
  guideReturn: { params: [] },
  drawerGuide: { params: [] },
  videoActivate: { params: [] },
  videoFallbackAction: { params: [] },
  videoUnavailable: { params: [] },
  videoSource: { params: [] },
} as const satisfies MessageDefinitions;

const dictionaries: MessageDictionaries<typeof definitions> = {
  he: {
    welcomeTitle: "ברוכים הבאים ל־PIC",
    welcomeStage: "היכרות עם PIC",
    welcomeStart: "לתחילת השאלון",
    welcomeLearn: "על השיטה ומבחן השרירים",
    guideTitle: "על השיטה ומבחן השרירים",
    guideStage: "מדריך לשיטה",
    guideReturn: "חזרה",
    drawerGuide: "על השיטה ומבחן השרירים",
    videoActivate: "הפעלת הסרטון",
    videoFallbackAction: "הסרטון לא נטען?",
    videoUnavailable: "הסרטון אינו זמין כרגע. אפשר לקרוא את המדריך או לפתוח את המקור באתר YouTube.",
    videoSource: "פתיחת הסרטון באתר YouTube",
  },
  en: {
    welcomeTitle: "Welcome to PIC",
    welcomeStage: "Introduction to PIC",
    welcomeStart: "Start the questionnaire",
    welcomeLearn: "About the method and muscle testing",
    guideTitle: "About the method and muscle testing",
    guideStage: "Method guide",
    guideReturn: "Return",
    drawerGuide: "About the method and muscle testing",
    videoActivate: "Load video",
    videoFallbackAction: "Video did not load?",
    videoUnavailable: "The video is unavailable right now. You can read the guide or open the source on YouTube.",
    videoSource: "Open video on YouTube",
  },
};

export const resolveEducationMessage = createMessageResolver(
  definitions,
  dictionaries,
  "videoUnavailable",
);

export type EducationMessageKey = keyof typeof definitions;
