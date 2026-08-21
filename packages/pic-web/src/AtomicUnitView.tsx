/**
 * Renders one Atomic Unit at a time (Ticket 08-08 / Wave 9). Resolves Structured Markdown through the
 * composition-root content seam. Visibility triggers `advance()` once per `in_view` unit (DEC-015 §2).
 */
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AtomicUnitContent, PlayerUnit } from "pic-engine";
import { usePlayerEngineActions } from "./player-engine-context";
import { useTreatmentContentActions } from "./treatment-content-context";

export function AtomicUnitView({
  sessionId,
  treatmentId,
  unit,
}: {
  sessionId: string;
  treatmentId: string;
  unit: PlayerUnit;
}) {
  const { advance } = usePlayerEngineActions();
  const { getParsedTreatmentContent } = useTreatmentContentActions();
  const advancedUnitId = useRef<string | null>(null);
  const [unitContent, setUnitContent] = useState<AtomicUnitContent | null>(null);

  useEffect(() => {
    if (advancedUnitId.current === unit.unit_id) {
      return;
    }
    advancedUnitId.current = unit.unit_id;
    void advance(sessionId);
  }, [advance, sessionId, unit.unit_id]);

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
    <article data-testid={`atomic-unit-${unit.unit_id}`}>
      {unitContent === null ? null : (
        <>
          <h2 data-testid="atomic-unit-title">{unitContent.unit_title}</h2>
          <div data-testid="atomic-unit-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{unitContent.unit_content}</ReactMarkdown>
          </div>
        </>
      )}
    </article>
  );
}
