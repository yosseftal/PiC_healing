import type { MembershipRevisionInput, SymptomGroup } from "./repository-port";
import type { FinalizedSymptomGroup } from "./types";
import { GroupRevisionConflictError, InvalidSymptomOrderError, normalizeGroupRevision } from "./group-revision";
import { membershipState, InvalidMembershipRevisionError } from "./membership-state";
export { membershipState, InvalidMembershipRevisionError } from "./membership-state";

export class MembershipRevisionIdentityMismatchError extends Error {
  constructor() {
    super("This membership operation was already used with a different group or request.");
    this.name = "MembershipRevisionIdentityMismatchError";
  }
}
const validCounter = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export function validateMembershipRevisionInput(input: MembershipRevisionInput): void {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!input || !uuid.test(input.operationId) || !uuid.test(input.groupId) ||
    !validCounter(input.expectedRevision) || !validCounter(input.expectedMembershipRevision) ||
    !["together", "split_suggested"].includes(input.answer) ||
    typeof input.answeredAt !== "string" || !Number.isFinite(Date.parse(input.answeredAt)) ||
    !Array.isArray(input.additions) || input.additions.length === 0 ||
    !Array.isArray(input.orderedSymptomIds)) throw new InvalidMembershipRevisionError("Invalid frozen membership request.");
  for (const row of input.additions) {
    if (!row || !uuid.test(row.id) || typeof row.name !== "string" || !row.name.trim() ||
      !["positive", "negative"].includes(row.polarity) || !Number.isInteger(row.intensity) ||
      row.intensity < 1 || row.intensity > 10) {
      throw new InvalidMembershipRevisionError("New topics require a name and explicit initial rating from 1 to 10.");
    }
  }
  if (input.orderedSymptomIds.some((id) => typeof id !== "string" || !uuid.test(id))) throw new InvalidSymptomOrderError();
}

/** Fixed tuples ignore JavaScript property insertion order; arrays retain intentional priority. */
export function membershipRevisionFingerprint(input: MembershipRevisionInput): string {
  validateMembershipRevisionInput(input);
  return JSON.stringify([input.operationId, input.groupId, input.expectedRevision, input.expectedMembershipRevision,
    input.additions.map((s) => [s.id, s.name, s.polarity, s.intensity]),
    [...input.orderedSymptomIds], input.answer, input.answeredAt]);
}

/** Pure append-and-answer preparation. The adapter calls this inside its write lock after receipt lookup. */
export function prepareMembershipRevision(current: SymptomGroup, input: MembershipRevisionInput): FinalizedSymptomGroup {
  validateMembershipRevisionInput(input);
  const stored = normalizeGroupRevision(current);
  const state = membershipState(stored);
  if (current.id !== input.groupId || stored.revision !== input.expectedRevision ||
    state.membershipRevision !== input.expectedMembershipRevision || stored.revision === Number.MAX_SAFE_INTEGER ||
    state.membershipRevision === Number.MAX_SAFE_INTEGER) throw new GroupRevisionConflictError(input.groupId);
  if (state.answerMembershipRevision === null) {
    throw new InvalidMembershipRevisionError("Answer the initial list before revising answered membership.");
  }
  const members = new Map(stored.symptoms.map((s) => [s.id, { ...s }]));
  for (const row of input.additions) {
    if (members.has(row.id)) throw new InvalidSymptomOrderError("Added topics must have distinct new IDs.");
    members.set(row.id, { ...row, rated_at: input.answeredAt });
  }
  if (members.size !== stored.symptoms.length + input.additions.length ||
    input.orderedSymptomIds.length !== members.size || new Set(input.orderedSymptomIds).size !== members.size ||
    input.orderedSymptomIds.some((id) => !members.has(id))) throw new InvalidSymptomOrderError();
  return { ...stored, revision: stored.revision! + 1, membership_revision: state.membershipRevision + 1,
    joint_treatment_membership_revision: state.membershipRevision + 1,
    symptoms: input.orderedSymptomIds.map((id) => members.get(id)!),
    joint_treatment_muscle_test: input.answer, joint_treatment_test_at: input.answeredAt };
}
