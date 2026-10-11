/**
 * Renders one Atomic Unit at a time (Ticket 08-08 / Wave 9). Resolves Structured Markdown through the
 * composition-root content seam. Unit state transitions are owned by `PlayerEngine.jumpTo` (DEC-015 §7a).
 */
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AtomicUnitContent, PlayerUnit } from "pic-engine";
import { TherapeuticContentCard, TherapeuticTableScroller } from "./therapeutic-frame/TherapeuticFrame";
import { useTreatmentContentActions } from "./treatment-content-context";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";

function GuidanceTable({ children }: { children?: ReactNode }) {
  const { message, locale, direction } = useLocale();
  return (
    <div lang={locale} dir={direction}>
      <TherapeuticTableScroller aria-label={message("player.guidanceTable").text} dir="auto">
        <table lang="">{children}</table>
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
  const { message } = useLocale();
  const { getParsedTreatmentContent } = useTreatmentContentActions();
  const [unitContent, setUnitContent] = useState<AtomicUnitContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getParsedTreatmentContent(treatmentId).then((units) => {
      if (cancelled) {
        return;
      }
      setUnitContent(units.find((parsedUnit) => parsedUnit.unit_id === unit.unit_id) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [getParsedTreatmentContent, treatmentId, unit.unit_id]);

  return (
    <article className="pic-player-unit" data-testid={`atomic-unit-${unit.unit_id}`}>
      <TherapeuticContentCard aria-label={message("player.atomicGuidance").text}>
        {unitContent === null ? null : (
          <>
            <h2 ref={headingRef} tabIndex={-1} data-testid="atomic-unit-title" lang="" dir="auto">
              {unitContent.unit_id === "unit-0" ? (
                <LocalizedMessage message={message("player.continuousGuidance")} />
              ) : <bdi dir="auto">{unitContent.unit_title}</bdi>}
            </h2>
            <div data-testid="atomic-unit-content" lang="" dir="auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {unitContent.unit_content}
              </ReactMarkdown>
            </div>
          </>
        )}
      </TherapeuticContentCard>
    </article>
  );
}
