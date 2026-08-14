/**
 * Guest happy-path flow router (Ticket 08-04): mounts one stub screen at a time from derived facts only.
 */
import { useGuestFlowScreen } from "./guest-flow-context";
import { GuestFlowScreenStub } from "./guest-flow-screens";

export function GuestFlowRouter() {
  const screen = useGuestFlowScreen();
  return <GuestFlowScreenStub screen={screen} />;
}
