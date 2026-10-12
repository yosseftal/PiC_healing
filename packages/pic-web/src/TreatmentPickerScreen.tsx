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
import { CONTROL_FOCUS, UTILITY_CONTROL } from "./control-affordance";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";
import { TreatmentPickerTitle } from "./content-localization/TreatmentPickerTitle";

export function TreatmentPickerScreen() {
  const { message } = useLocale();
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
      <TherapeuticScreenFrame title={message("picker.title").text} stageLabel={message("picker.title").text}
        utilities={<div className="grid min-w-0 gap-4">
          <label className="inline-flex min-h-11 min-w-11 items-center gap-3 rounded-pic-button px-3 py-2">
            <input
              className={`size-5 shrink-0 accent-pic-sage-700 ${CONTROL_FOCUS}`}
              type="checkbox"
              checked={linkToGroup}
              onChange={(event) => setLinkToGroup(event.target.checked)}
              data-testid="link-to-group-toggle"
            />
            <LocalizedMessage message={message("picker.link")} />
          </label>
          <ul className="grid min-w-0 gap-3 p-0 list-none" aria-label={message("picker.catalog").text}
            data-testid="treatment-list">
            {treatments.map((treatment) => (
              <li key={treatment.id}>
                <button
                  className={`${UTILITY_CONTROL} w-full min-w-0 [overflow-wrap:anywhere]`}
                  type="button"
                  data-testid={`pick-treatment-${treatment.id}`}
                  onClick={() => void selectTreatment(treatment.id)}
                >
                  <TreatmentPickerTitle treatmentId={treatment.id} title={treatment.title} />
                </button>
                {zeroH3GuardTreatmentId === treatment.id ? (
                  <p role="status" data-testid={`zero-h3-guard-${treatment.id}`}>
                    <LocalizedMessage message={message("player.sourceGuard")} />
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          {listStatus === "recovery" ? (
            <div role="status">
              <p><LocalizedMessage message={message("picker.listRecovery")} /></p>
              <button className={UTILITY_CONTROL} type="button" onClick={() => void retryLoadTreatments()}>
                <LocalizedMessage message={message("picker.retryList")} />
              </button>
            </div>
          ) : null}
          {selectStatus === "recovery" ? (
            <div role="status">
              <p><LocalizedMessage message={message("picker.selectRecovery")} /></p>
              <button className={UTILITY_CONTROL} type="button" onClick={() => void retrySelectTreatment()}>
                <LocalizedMessage message={message("picker.retrySelect")} />
              </button>
            </div>
          ) : null}
        </div>}>
        <TherapeuticContentCard aria-label={message("picker.title").text}>
          <p><LocalizedMessage message={message("picker.prompt")} /></p>
          {listStatus === "recovery" ? <p role="status">
            <LocalizedMessage message={message("picker.listRecovery")} />
          </p> : null}
          {selectStatus === "recovery" ? <p role="status">
            <LocalizedMessage message={message("picker.selectRecovery")} />
          </p> : null}
          {zeroH3GuardTreatmentId === null ? null : <p role="status">
            <LocalizedMessage message={message("player.sourceGuard")} />
          </p>}
        </TherapeuticContentCard>
      </TherapeuticScreenFrame>
    </section>
  );
}
