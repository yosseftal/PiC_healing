import { useLocale } from "./i18n/locale-provider";
import { resolveEducationMessage } from "./education-messages";
import type { WelcomeEducationCopy } from "./education-content";
import { CONTROL_FOCUS } from "./control-affordance";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticFrame } from "./therapeutic-frame/TherapeuticFrame";

const PRIMARY_ACTION = [
  "inline-flex min-h-11 w-full items-center justify-center rounded-pic-button border border-pic-sage-700",
  "bg-pic-sage-700 px-4 py-3 font-semibold text-white",
  CONTROL_FOCUS,
].join(" ");
const SECONDARY_ACTION = [
  "inline-flex min-h-11 w-full items-center justify-center rounded-pic-button border border-pic-line",
  "bg-pic-surface px-4 py-3 font-semibold text-pic-ink",
  CONTROL_FOCUS,
].join(" ");

export type WelcomeScreenProps = {
  content: WelcomeEducationCopy;
  onStartQuestionnaire: () => void;
  onLearnMethod: () => void;
};

export function WelcomeScreen({ content, onStartQuestionnaire, onLearnMethod }: WelcomeScreenProps) {
  const { locale } = useLocale();
  const message = (key: "welcomeTitle" | "welcomeStage" | "welcomeStart" | "welcomeLearn") =>
    resolveEducationMessage(locale, key).text;
  return <div className="h-full min-h-0" data-testid="welcome-screen">
    <TherapeuticFrame title={message("welcomeTitle")} stageLabel={message("welcomeStage")}>
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
      <TherapeuticContentCard aria-label={message("welcomeTitle")}>
        <div className="grid gap-4">
          {[content.purpose, content.background].map((paragraph) => <section key={paragraph.provenance.sourceUrl + paragraph.text}
            lang={paragraph.locale} dir={paragraph.locale === "he" ? "rtl" : "ltr"}>
            <p>{paragraph.text}</p>
            <p className="break-all text-sm" dir="ltr">
              {paragraph.provenance.sourceLabel}: {paragraph.provenance.sourceUrl}
            </p>
          </section>)}
        </div>
      </TherapeuticContentCard>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button"
          data-testid="welcome-start" className={PRIMARY_ACTION} onClick={onStartQuestionnaire}>
          {message("welcomeStart")}
        </button>
        <button type="button"
          data-testid="welcome-learn" className={SECONDARY_ACTION} onClick={onLearnMethod}>
          {message("welcomeLearn")}
        </button>
      </div>
    </div>
    </TherapeuticFrame>
  </div>;
}
