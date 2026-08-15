/**
 * Renders one Atomic Unit at a time (Ticket 08-08). Stub content is the `unit_id` label until Structured
 * Markdown parsing lands. Visibility triggers `advance()` once per `in_view` unit (DEC-015 §2).
 */
import { useEffect, useRef } from "react";
import type { PlayerUnit } from "pic-engine";
import { usePlayerEngineActions } from "./player-engine-context";

export function AtomicUnitView({ sessionId, unit }: { sessionId: string; unit: PlayerUnit }) {
  const { advance } = usePlayerEngineActions();
  const advancedUnitId = useRef<string | null>(null);

  useEffect(() => {
    if (advancedUnitId.current === unit.unit_id) {
      return;
    }
    advancedUnitId.current = unit.unit_id;
    void advance(sessionId);
  }, [advance, sessionId, unit.unit_id]);

  return (
    <article data-testid={`atomic-unit-${unit.unit_id}`}>
      <p>{unit.unit_id}</p>
    </article>
  );
}
