/**
 * Guest flow screen switcher (Ticket 08-04 router; Tickets 08-05–08 real screen implementations).
 */
import type { GuestFlowScreen } from "./guest-flow-facts";
import { GroupSummaryFlow } from "./group-summary-flow";
import { JointTreatmentFlow } from "./joint-treatment-flow";
import { SymptomGroupCreateScreen } from "./SymptomGroupCreateScreen";
import { TreatmentPickerScreen } from "./TreatmentPickerScreen";
import { UnifiedPlayerScreen } from "./UnifiedPlayerScreen";

export function GuestFlowScreenView({ screen }: { screen: GuestFlowScreen }) {
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
