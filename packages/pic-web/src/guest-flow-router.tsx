/**
 * Guest happy-path flow router (Ticket 08-04): mounts one screen at a time from derived facts only.
 */
import { useGuestFlowScreen } from "./guest-flow-context";
import { GuestFlowScreenView } from "./guest-flow-screens";

export function GuestFlowRouter() {
  const screen = useGuestFlowScreen();
  return <GuestFlowScreenView screen={screen} />;
}
