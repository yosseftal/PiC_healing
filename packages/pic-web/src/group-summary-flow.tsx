/**
 * Group-summary screen shell (Ticket 08-06): read-only confirmation before treatment pick.
 */
import type { ReactNode } from "react";
import { SymptomGroupSummaryScreen } from "./SymptomGroupSummaryScreen";
import { useGroupEngineState } from "./group-engine-context";

export function GroupSummaryFlow(): ReactNode {
  const { activeGroupId } = useGroupEngineState();
  if (activeGroupId === null) {
    return null;
  }
  return <SymptomGroupSummaryScreen groupId={activeGroupId} />;
}
