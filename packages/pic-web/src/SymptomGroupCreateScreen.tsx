import { useEffect, type ReactNode } from "react";
import { useGroupEngineState, useQuestionnaire } from "./group-engine-context";
import { SymptomAddStep } from "./SymptomAddStep";

export function SymptomGroupCreateScreen(): ReactNode {
  const { activeGroupId } = useGroupEngineState();
  const { actions } = useQuestionnaire();
  useEffect(() => { void actions.load(); }, [activeGroupId, actions]);
  return <section data-testid="guest-flow-create-group"><SymptomAddStep /></section>;
}
