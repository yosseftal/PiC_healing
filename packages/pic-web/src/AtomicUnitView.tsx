/**
 * Renders one Atomic Unit at a time (Ticket 08-08 / Wave 9). Resolves Structured Markdown through the
 * composition-root content seam. Unit state transitions are owned by `PlayerEngine.jumpTo` (DEC-015 §7a).
 */
import { useEffect, useState, type RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AtomicUnitContent, PlayerUnit } from "pic-engine";
import { TherapeuticContentCard, TherapeuticTableScroller } from "./therapeutic-frame/TherapeuticFrame";
import { useTreatmentContentActions } from "./treatment-content-context";

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
      <TherapeuticContentCard aria-label="Atomic Unit guidance">
        {unitContent === null ? null : (
          <>
            <h2 ref={headingRef} tabIndex={-1} data-testid="atomic-unit-title">{unitContent.unit_title}</h2>
            <div data-testid="atomic-unit-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <TherapeuticTableScroller aria-label="Guidance table">
                      <table>{children}</table>
                    </TherapeuticTableScroller>
                  ),
                }}
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
