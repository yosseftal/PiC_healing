/**
 * Stub guest flow screens (Ticket 08-04). Real implementations land in Tickets 08-05–08.
 */
import type { GuestFlowScreen } from "./guest-flow-facts";

const SCREEN_HEADINGS: Record<GuestFlowScreen, string> = {
  "create-group": "Create Symptom Group",
  "joint-treatment": "Joint Treatment Muscle Test",
  "pick-treatment": "Pick Treatment",
  player: "Unified Player",
};

export function GuestFlowScreenStub({ screen }: { screen: GuestFlowScreen }) {
  return (
    <section data-testid={`guest-flow-${screen}`}>
      <h1>{SCREEN_HEADINGS[screen]}</h1>
    </section>
  );
}
