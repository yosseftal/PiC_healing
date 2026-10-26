import type { SymptomGroup } from "./repository-port";
export class InvalidMembershipRevisionError extends Error {
  constructor(message = "The actual joint answer must belong to the current membership.") {
    super(message); this.name = "InvalidMembershipRevisionError";
  }
}
const validCounter = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

/** Validate without adding metadata to legacy objects or frozen promotion snapshots. */
export function membershipState(group: SymptomGroup): { membershipRevision: number; answerMembershipRevision: number | null } {
  const member = group.membership_revision;
  const answer = group.joint_treatment_membership_revision;
  const answered = group.joint_treatment_muscle_test !== null;
  if (member === undefined && answer === undefined) return {
    membershipRevision: 0, answerMembershipRevision: answered ? 0 : null,
  };
  if (!validCounter(member) || !validCounter(answer) || !answered ||
    group.joint_treatment_test_at === null || answer !== member) {
    throw new InvalidMembershipRevisionError();
  }
  return { membershipRevision: member, answerMembershipRevision: answer };
}
