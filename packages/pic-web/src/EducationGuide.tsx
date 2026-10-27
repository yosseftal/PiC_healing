import { useLocale } from "./i18n/locale-provider";
import { resolveEducationMessage } from "./education-messages";
import type { EducationSection } from "./education-content";
import { UTILITY_CONTROL } from "./control-affordance";
import { OfficialVideo } from "./OfficialVideo";
import { TherapeuticContentCard, TherapeuticFrame } from "./therapeutic-frame/TherapeuticFrame";

export type EducationGuideProps = {
  sections: readonly EducationSection[];
  videoTitle: string;
  onReturn: () => void;
};

export function EducationGuide({ sections, videoTitle, onReturn }: EducationGuideProps) {
  const { locale } = useLocale();
  const message = (key: "guideTitle" | "guideStage" | "guideReturn") => resolveEducationMessage(locale, key).text;
  return <div className="h-full min-h-0" data-testid="education-guide">
    <TherapeuticFrame title={message("guideTitle")} stageLabel={message("guideStage")}>
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
      <TherapeuticContentCard aria-label={message("guideTitle")}>
        <div className="grid gap-6">
          {sections.map((section) => <section key={section.id} id={section.id} lang={section.locale}
            dir={section.locale === "he" ? "rtl" : "ltr"} aria-labelledby={`${section.id}-heading`}>
            <h2 id={`${section.id}-heading`} className="text-xl font-semibold">{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => <p key={`${section.id}-${index}`} className="mt-3">{paragraph}</p>)}
            <a href={section.provenance.sourceUrl} target="_blank" rel="noreferrer"
              className={UTILITY_CONTROL + " mt-3 w-fit underline"}>
              {section.provenance.sourceLabel}
            </a>
            {section.provenance.timestamps.length > 0 ?
              <p className="mt-1 text-sm" dir="ltr">{section.provenance.timestamps.join(" · ")}</p> : null}
          </section>)}
          <OfficialVideo title={videoTitle} />
        </div>
      </TherapeuticContentCard>
      <button type="button" className={UTILITY_CONTROL} onClick={onReturn}>
        {message("guideReturn")}
      </button>
    </div>
    </TherapeuticFrame>
  </div>;
}
