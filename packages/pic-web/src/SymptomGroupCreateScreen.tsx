/**
 * One-screen group creation flow (Ticket 08-05): name input → confirm, then repeatable symptom add + rate.
 */
import { useState, type FormEvent, type ReactNode } from "react";
import { setGuestFlowSymptomAdditionComplete } from "./guest-flow-facts";
import { useGroupEngineActions, useGroupEngineState } from "./group-engine-context";
import { SymptomAddStep } from "./SymptomAddStep";

export function SymptomGroupCreateScreen(): ReactNode {
  const { activeGroupId } = useGroupEngineState();
  const { createDraftGroup } = useGroupEngineActions();
  const [groupName, setGroupName] = useState("");
  const [symptomCount, setSymptomCount] = useState(0);

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedName = groupName.trim();
    if (trimmedName.length === 0) {
      return;
    }
    await createDraftGroup(trimmedName);
  }

  function finishSymptomAddition(): void {
    setGuestFlowSymptomAdditionComplete(true);
  }

  if (activeGroupId === null) {
    return (
      <section data-testid="guest-flow-create-group">
        <h1>Create Symptom Group</h1>
        <form data-testid="create-group-form" onSubmit={(event) => void handleCreateGroup(event)}>
          <label>
            Group name
            <input
              aria-label="Group name"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
            />
          </label>
          <button type="submit" data-testid="confirm-group-name">
            Confirm group name
          </button>
        </form>
      </section>
    );
  }

  return (
    <section data-testid="guest-flow-create-group">
      <h1>Create Symptom Group</h1>
      <SymptomAddStep groupId={activeGroupId} onSymptomAdded={() => setSymptomCount((count) => count + 1)} />
      {symptomCount > 0 ? (
        <button type="button" data-testid="finish-symptom-addition" onClick={finishSymptomAddition}>
          Done adding symptoms
        </button>
      ) : null}
    </section>
  );
}
