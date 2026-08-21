/**
 * Flat treatment picker (Ticket 08-07 / Wave 9): lists treatments via `catalogActions`, resolves real
 * parsed unit ids through the content seam, and starts a player session on selection.
 */
import { useEffect, useState } from "react";
import type { TreatmentListItem } from "pic-engine";
import { useCatalogActions } from "./catalog-context";
import { useGroupEngineState } from "./group-engine-context";
import { usePlayerEngineActions } from "./player-engine-context";
import { useTreatmentContentActions } from "./treatment-content-context";
import { ZERO_H3_GUARD_MESSAGE } from "./zero-h3-guard-message";

export function TreatmentPickerScreen() {
  const { listTreatments } = useCatalogActions();
  const { getParsedTreatmentContent } = useTreatmentContentActions();
  const { startSession } = usePlayerEngineActions();
  const { activeGroupId } = useGroupEngineState();
  const [treatments, setTreatments] = useState<TreatmentListItem[]>([]);
  const [linkToGroup, setLinkToGroup] = useState(false);
  const [zeroH3GuardTreatmentId, setZeroH3GuardTreatmentId] = useState<string | null>(null);

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
    setZeroH3GuardTreatmentId(null);
    const parsedUnits = await getParsedTreatmentContent(treatmentId);
    if (parsedUnits.length === 0) {
      setZeroH3GuardTreatmentId(treatmentId);
      return;
    }
    const linkedGroupId = linkToGroup ? activeGroupId : null;
    await startSession(
      treatmentId,
      linkedGroupId,
      parsedUnits.map((unit) => unit.unit_id),
    );
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
            {zeroH3GuardTreatmentId === treatment.id ? (
              <p data-testid={`zero-h3-guard-${treatment.id}`}>{ZERO_H3_GUARD_MESSAGE}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
