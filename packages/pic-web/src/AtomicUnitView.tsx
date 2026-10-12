/**
 * Renders one Atomic Unit at a time (Ticket 08-08 / Wave 9). Resolves Structured Markdown through the
 * composition-root content seam. Unit state transitions are owned by `PlayerEngine.jumpTo` (DEC-015 §7a).
 */
import { createContext, useContext, type ReactNode, type RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PlayerUnit } from "pic-engine";
import { TherapeuticContentCard, TherapeuticTableScroller } from "./therapeutic-frame/TherapeuticFrame";
import { useTreatmentDisplay } from "./content-localization/use-treatment-display";
import type { TreatmentDisplay } from "./content-localization/types";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";

const GuidanceMetadata = createContext<Pick<TreatmentDisplay, "language" | "direction">>({
  language: "", direction: "auto",
});

function GuidanceTable({ children }: { children?: ReactNode }) {
  const { message, locale, direction } = useLocale();
  const content = useContext(GuidanceMetadata);
  return (
    <div lang={locale} dir={direction}>
      <TherapeuticTableScroller aria-label={message("player.guidanceTable").text} dir={content.direction}>
        <table lang={content.language}>{children}</table>
      </TherapeuticTableScroller>
    </div>
  );
}

// Stable component types retain the authored table's reading position during locale selection.
const markdownComponents = { table: GuidanceTable };

export function AtomicUnitView({
  treatmentId,
  unit,
  headingRef,
}: {
  sessionId: string;
  treatmentId: string;
  unit: PlayerUnit;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}) {
  const { message, locale, direction } = useLocale();
  const display = useTreatmentDisplay(treatmentId);
  const unitContent = display.units.find((parsedUnit) => parsedUnit.unit_id === unit.unit_id) ?? null;

  return (
    <article className="pic-player-unit" data-testid={`atomic-unit-${unit.unit_id}`}>
      <TherapeuticContentCard aria-label={message("player.atomicGuidance").text}>
        {unitContent === null ? null : (
          <>
            <h2 ref={headingRef} tabIndex={-1} data-testid="atomic-unit-title"
              lang={display.language} dir={display.direction}>
              {unitContent.unit_id === "unit-0" ? (
                <LocalizedMessage message={message("player.continuousGuidance")} />
              ) : <bdi dir="auto">{unitContent.unit_title}</bdi>}
            </h2>
            <div data-testid="atomic-unit-content" lang={display.language} dir={display.direction}>
              <GuidanceMetadata.Provider value={display}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {unitContent.unit_content}
                </ReactMarkdown>
              </GuidanceMetadata.Provider>
            </div>
            {display.notice === null ? null : (
              <p role="status" data-testid="content-availability-notice" lang={locale} dir={direction}>
                {display.notice}
              </p>
            )}
          </>
        )}
      </TherapeuticContentCard>
    </article>
  );
}
