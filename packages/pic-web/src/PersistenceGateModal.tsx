import { useSessionEngineState } from "./session-engine-context";

/**
 * Stub mount point (ticket 14) - ticket 15 fills in the real auth UI and retry affordance. Already wired
 * to live `SessionEngine` state via the Dumb Reflection hook, so ticket 15 only has to add markup, never
 * plumbing. Renders nothing while `gateTriggered` is `false`, which happens to already satisfy ticket 15's
 * own first acceptance criterion - but this file's purpose here is only to prove the subscription wiring
 * end-to-end, not to build the modal's contents.
 */
export function PersistenceGateModal() {
  const { gateTriggered } = useSessionEngineState();

  if (!gateTriggered) {
    return null;
  }

  // TODO(ticket 15): render Social Auth / Magic Link options while promotionStatus is 'idle'/'pending',
  // and a retry affordance while it is 'failed' - never a "partially saved" message (DEC-017).
  return null;
}
