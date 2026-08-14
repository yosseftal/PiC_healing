/**
 * Guest flow screens (Ticket 08-04 stubs; Ticket 08-05+ real implementations).
 */
import type { GuestFlowScreen } from "./guest-flow-facts";
import { SymptomGroupCreateScreen } from "./SymptomGroupCreateScreen";
import { TreatmentPickerScreen } from "./TreatmentPickerScreen";

const SCREEN_HEADINGS: Record<Exclude<GuestFlowScreen, "create-group" | "pick-treatment">, string> = {
  "joint-treatment": "Joint Treatment Muscle Test",
  player: "Unified Player",
};

export function GuestFlowScreenStub({ screen }: { screen: GuestFlowScreen }) {
  if (screen === "create-group") {
    return <SymptomGroupCreateScreen />;
  }

  if (screen === "pick-treatment") {
    return <TreatmentPickerScreen />;
  }

  return (
    <section data-testid={`guest-flow-${screen}`}>
      <h1>{SCREEN_HEADINGS[screen]}</h1>
    </section>
  );
}
