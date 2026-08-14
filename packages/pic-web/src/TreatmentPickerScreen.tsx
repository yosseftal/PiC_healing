/**
 * Flat treatment picker (Ticket 08-07): lists treatments via `catalogActions`, starts a player session on
 * selection. Structured Markdown parsing is out of scope — stub unit ids until Ticket 08-08.
 */
import { useEffect, useState } from "react";
import type { TreatmentListItem } from "pic-engine";
import { useCatalogActions } from "./catalog-context";
import { useGroupEngineState } from "./group-engine-context";
import { usePlayerEngineActions } from "./player-engine-context";

/** Pre-parsed Atomic Unit ids for tracer-bullet treatments until content loading lands (ticket 08). */
const TRACER_BULLET_STUB_UNIT_IDS = ["intro", "practice"];

export function TreatmentPickerScreen() {
  const { listTreatments } = useCatalogActions();
  const { startSession } = usePlayerEngineActions();
  const { activeGroupId } = useGroupEngineState();
  const [treatments, setTreatments] = useState<TreatmentListItem[]>([]);
  const [linkToGroup, setLinkToGroup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listTreatments().then((rows) => {
      if (!cancelled) {
        setTreatments(rows);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [listTreatments]);

  async function handleSelect(treatmentId: string): Promise<void> {
    const linkedGroupId = linkToGroup ? activeGroupId : null;
    await startSession(treatmentId, linkedGroupId, TRACER_BULLET_STUB_UNIT_IDS);
  }

  return (
    <section data-testid="guest-flow-pick-treatment">
      <h1>Pick Treatment</h1>
      <label>
        <input
          type="checkbox"
          checked={linkToGroup}
          onChange={(event) => setLinkToGroup(event.target.checked)}
          data-testid="link-to-group-toggle"
        />
        Link to this symptom group
      </label>
      <ul data-testid="treatment-list">
        {treatments.map((treatment) => (
          <li key={treatment.id}>
            <button type="button" data-testid={`pick-treatment-${treatment.id}`} onClick={() => void handleSelect(treatment.id)}>
              {treatment.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
