/**
 * One-screen group creation flow (Ticket 08-05): name input → confirm, then repeatable symptom add + rate.
 * Symptom count is derived from `getGroup` — never mirrored in local state (DEC-015 dumb reflection).
 */
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { SymptomGroup } from "pic-engine";
import { setGuestFlowSymptomAdditionComplete } from "./guest-flow-facts";
import { useGroupEngineActions, useGroupEngineState } from "./group-engine-context";
import { SymptomAddStep } from "./SymptomAddStep";
import { useAsyncAction } from "./use-async-action";
import { INPUT_CONTROL, UTILITY_CONTROL } from "./control-affordance";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";
import "./symptom-creation.css";

export function SymptomGroupCreateScreen(): ReactNode {
  const { message } = useLocale();
  const { activeGroupId } = useGroupEngineState();
  const { createDraftGroup, getGroup } = useGroupEngineActions();
  const [groupName, setGroupName] = useState("");
  const [group, setGroup] = useState<SymptomGroup | null>(null);
  const {
    status: loadStatus,
    run: loadGroup,
    retry: retryLoadGroup,
  } = useAsyncAction(async (groupId: string) => {
    setGroup(await getGroup(groupId));
  });
  const {
    status: createStatus,
    run: createGroup,
    retry: retryCreateGroup,
  } = useAsyncAction(createDraftGroup);

  const reloadGroup = useCallback(() => {
    if (activeGroupId === null) {
      setGroup(null);
      return;
    }
    void loadGroup(activeGroupId);
  }, [activeGroupId, getGroup, loadGroup]);

  useEffect(() => {
    reloadGroup();
  }, [reloadGroup]);

  const symptomCount = group?.symptoms.length ?? 0;

  function handleCreateGroup(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmedName = groupName.trim();
    if (trimmedName.length === 0) {
      return;
    }
    void createGroup(trimmedName);
  }

  function finishSymptomAddition(): void {
    setGuestFlowSymptomAdditionComplete(true);
  }

  if (activeGroupId === null) {
    return (
      <section data-testid="guest-flow-create-group">
        <TherapeuticScreenFrame title={message("group.title").text} stageLabel={message("group.stage").text}>
          <TherapeuticContentCard aria-label={message("group.card").text}>
            <form className="pic-symptom-form" data-testid="create-group-form" onSubmit={handleCreateGroup}>
              <label>
                <LocalizedMessage message={message("group.name")} />
                <input
                  className={INPUT_CONTROL}
                  aria-label={message("group.name").text}
                  placeholder={message("group.placeholder").text}
                  dir="auto" lang=""
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                />
              </label>
              <button className={UTILITY_CONTROL} type="submit" data-testid="confirm-group-name">
                <LocalizedMessage message={message("group.confirm")} />
              </button>
              {createStatus === "recovery" ? (
                <div role="status">
                  <p><LocalizedMessage message={message("group.createRecovery")} /></p>
                  <button className={UTILITY_CONTROL} type="button" onClick={() => void retryCreateGroup()}>
                    <LocalizedMessage message={message("group.retryCreate")} />
                  </button>
                </div>
              ) : null}
            </form>
          </TherapeuticContentCard>
        </TherapeuticScreenFrame>
      </section>
    );
  }

  return (
    <section data-testid="guest-flow-create-group">
      <SymptomAddStep
        groupId={activeGroupId} onSymptomAdded={reloadGroup}
        symptomCount={symptomCount} groupName={group?.name} onDone={finishSymptomAddition}
        utilities={loadStatus === "recovery" ? (
          <div role="status">
            <p><LocalizedMessage message={message("group.loadRecovery")} /></p>
            <button className={UTILITY_CONTROL} type="button" onClick={() => void retryLoadGroup()}>
              <LocalizedMessage message={message("group.retryLoad")} />
            </button>
          </div>
        ) : null}
        recoveryStatus={loadStatus === "recovery" ? message("group.loadRecovery").text : undefined}
      />
    </section>
  );
}
