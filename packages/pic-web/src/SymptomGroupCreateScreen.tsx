import { useEffect, type ReactNode } from "react";
import { useGroupEngineState, useQuestionnaire } from "./group-engine-context";
import { SymptomAddStep } from "./SymptomAddStep";
import { useQuestionnaireNavigation } from "./questionnaire-navigation-context";

export function SymptomGroupCreateScreen(): ReactNode {
  const { activeGroupId } = useGroupEngineState();
  const { actions } = useQuestionnaire();
  const { state } = useQuestionnaireNavigation();
  useEffect(() => {
    if (activeGroupId && state.location === "create-group") void actions.beginEdit();
    else void actions.load();
  }, [activeGroupId, actions, state.location]);
  return <section data-testid="guest-flow-create-group"><SymptomAddStep /></section>;
}
