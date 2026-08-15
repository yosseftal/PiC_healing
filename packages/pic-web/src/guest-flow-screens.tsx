/**
 * Guest flow screens (Ticket 08-04 stubs; Ticket 08-05+ real implementations).
 */
import type { GuestFlowScreen } from "./guest-flow-facts";
import { GroupSummaryFlow } from "./group-summary-flow";
import { JointTreatmentFlow } from "./joint-treatment-flow";
import { SymptomGroupCreateScreen } from "./SymptomGroupCreateScreen";
import { TreatmentPickerScreen } from "./TreatmentPickerScreen";
import { UnifiedPlayerScreen } from "./UnifiedPlayerScreen";

export function GuestFlowScreenStub({ screen }: { screen: GuestFlowScreen }) {
  if (screen === "create-group") {
    return <SymptomGroupCreateScreen />;
  }

  if (screen === "joint-treatment") {
    return <JointTreatmentFlow />;
  }

  if (screen === "group-summary") {
    return <GroupSummaryFlow />;
  }

  if (screen === "pick-treatment") {
    return <TreatmentPickerScreen />;
  }

  return <UnifiedPlayerScreen />;
}
