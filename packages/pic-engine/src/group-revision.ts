import type { SymptomGroup } from "./repository-port";

export class GroupRevisionConflictError extends Error {
  constructor(groupId: string) {
    super(`Symptom group "${groupId}" changed. Refresh before retrying the requested change.`);
    this.name = "GroupRevisionConflictError";
  }
}

export class InvalidSymptomOrderError extends Error {
  constructor(message = "Symptom order must contain every group member exactly once.") {
    super(message);
    this.name = "InvalidSymptomOrderError";
  }
}

function validRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function nextRevision(group: SymptomGroup): number {
  const next = group.revision! + 1;
  if (!validRevision(next)) throw new GroupRevisionConflictError(group.id);
  return next;
}

/** Legacy mutable reads normalize the token; frozen promotion payloads must not use this helper. */
export function normalizeGroupRevision(group: SymptomGroup): SymptomGroup {
  const revision = group.revision === undefined ? 0 : group.revision;
  if (!validRevision(revision)) throw new GroupRevisionConflictError(group.id);
  return { ...group, revision, symptoms: group.symptoms.map((symptom) => ({ ...symptom })) };
}

function content(group: SymptomGroup): string {
  return JSON.stringify([
    group.id, group.name, group.created_at, group.joint_treatment_muscle_test, group.joint_treatment_test_at,
    group.symptoms.map((s) => [s.id, s.name, s.polarity, s.intensity, s.rated_at]),
  ]);
}

/** Prepare an append-only aggregate CAS under the repository's write lock. */
export function prepareGroupSave(current: SymptomGroup | null, incoming: SymptomGroup): SymptomGroup {
  const next = normalizeGroupRevision(incoming);
  if (new Set(next.symptoms.map((s) => s.id)).size !== next.symptoms.length) {
    throw new InvalidSymptomOrderError();
  }
  if (current === null) return next;
  const stored = normalizeGroupRevision(current);
  if (content(stored) === content(next)) return stored;
  if (!validRevision(incoming.revision) || incoming.revision !== stored.revision) {
    throw new GroupRevisionConflictError(incoming.id);
  }
  if (stored.id !== next.id || stored.symptoms.some((s, index) => next.symptoms[index]?.id !== s.id)) {
    throw new InvalidSymptomOrderError("Saving a group must retain all existing members in order; new members append.");
  }
  return { ...next, revision: nextRevision(stored) };
}

/** Prepare a pure permutation under the repository's write lock. */
export function prepareSymptomReorder(
  group: SymptomGroup, orderedIDs: readonly string[], expectedRevision: number,
): SymptomGroup {
  const stored = normalizeGroupRevision(group);
  if (!validRevision(expectedRevision) || expectedRevision !== stored.revision) {
    throw new GroupRevisionConflictError(group.id);
  }
  const members = new Map(stored.symptoms.map((s) => [s.id, s]));
  if (members.size !== stored.symptoms.length || orderedIDs.length !== members.size ||
      new Set(orderedIDs).size !== members.size ||
      orderedIDs.some((id) => !members.has(id))) {
    throw new InvalidSymptomOrderError();
  }
  if (orderedIDs.every((id, index) => stored.symptoms[index]?.id === id)) return stored;
  return { ...stored, symptoms: orderedIDs.map((id) => members.get(id)!), revision: nextRevision(stored) };
}
