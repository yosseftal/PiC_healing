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
import { useAsyncAction } from "./use-async-action";
import { ZERO_H3_GUARD_MESSAGE } from "./zero-h3-guard-message";
import { CONTROL_FOCUS, UTILITY_CONTROL } from "./control-affordance";

export function TreatmentPickerScreen() {
  const { listTreatments } = useCatalogActions();
  const { getParsedTreatmentContent } = useTreatmentContentActions();
  const { startSession } = usePlayerEngineActions();
  const { activeGroupId } = useGroupEngineState();
  const [treatments, setTreatments] = useState<TreatmentListItem[]>([]);
  const [linkToGroup, setLinkToGroup] = useState(false);
  const [zeroH3GuardTreatmentId, setZeroH3GuardTreatmentId] = useState<string | null>(null);
  const {
    status: listStatus,
    run: loadTreatments,
    retry: retryLoadTreatments,
  } = useAsyncAction(async (isCancelled: () => boolean) => {
    const rows = await listTreatments();
    if (!isCancelled()) {
      setTreatments(rows);
    }
  });
  const {
    status: selectStatus,
    run: selectTreatment,
    retry: retrySelectTreatment,
  } = useAsyncAction(async (treatmentId: string) => {
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
  });

  useEffect(() => {
    let cancelled = false;
    void loadTreatments(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [listTreatments, loadTreatments]);

  return (
    <section data-testid="guest-flow-pick-treatment">
      <h1>Pick Treatment</h1>
      {listStatus === "recovery" ? (
        <div role="status">
          <p>The treatment list is ready to reconnect.</p>
          <button className={UTILITY_CONTROL} type="button" onClick={() => void retryLoadTreatments()}>
            Try loading treatments again
          </button>
        </div>
      ) : null}
      <label className="inline-flex min-h-11 min-w-11 items-center gap-3 rounded-pic-button px-3 py-2">
        <input
          className={`size-5 shrink-0 accent-pic-sage-700 ${CONTROL_FOCUS}`}
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
            <button
              className={UTILITY_CONTROL}
              type="button"
              data-testid={`pick-treatment-${treatment.id}`}
              onClick={() => void selectTreatment(treatment.id)}
            >
              {treatment.title}
            </button>
            {zeroH3GuardTreatmentId === treatment.id ? (
              <p data-testid={`zero-h3-guard-${treatment.id}`}>{ZERO_H3_GUARD_MESSAGE}</p>
            ) : null}
          </li>
        ))}
      </ul>
      {selectStatus === "recovery" ? (
        <div role="status">
          <p>This treatment is ready when you are.</p>
          <button className={UTILITY_CONTROL} type="button" onClick={() => void retrySelectTreatment()}>
            Try opening treatment again
          </button>
        </div>
      ) : null}
    </section>
  );
}
