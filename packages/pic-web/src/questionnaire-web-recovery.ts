import type { TopicDraft } from "./questionnaire-draft";
import type { QuestionnaireLocation } from "./questionnaire-navigation";

const KEY = "pic-web.questionnaire.v1";
const MAX_CHARACTERS = 262_144;
let writeSafe = true;
export interface QuestionnaireWebRecovery {
  schemaVersion: 1;
  generation: number;
  owner: string | null;
  groupId: string | null;
  fields: { title: string; rows: TopicDraft[]; revising: boolean; attempted: boolean } | null;
  location: QuestionnaireLocation | null;
  returnLocation: QuestionnaireLocation;
  focus: string | null;
  advisory: boolean;
  advisoryDismissed: boolean;
  returnAdvisory: boolean;
}
const locations = ["create-group", "joint-treatment", "group-summary", "pick-treatment", "preparation"];
const location = (value: unknown) => typeof value === "string" && locations.includes(value);
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object";
const shortText = (value: unknown): value is string => typeof value === "string" && value.length <= 16_384;
const id = (value: unknown) => typeof value === "string" && value.length > 0 && value.length <= 256;
function valid(value: unknown): value is QuestionnaireWebRecovery {
  if (!record(value) || value.schemaVersion !== 1 || !Number.isSafeInteger(value.generation) ||
    Number(value.generation) < 0 || value.owner !== null && !id(value.owner) ||
    value.groupId !== null && !id(value.groupId) ||
    value.location !== null && !location(value.location) ||
    !location(value.returnLocation) || value.focus !== null && !shortText(value.focus) ||
    typeof value.advisory !== "boolean" || typeof value.advisoryDismissed !== "boolean" ||
    typeof value.returnAdvisory !== "boolean") return false;
  if (value.groupId === null && (value.location !== null &&
    value.location !== "preparation" && value.location !== "create-group" ||
    value.returnLocation !== "preparation" && value.returnLocation !== "create-group" ||
    value.advisory || value.returnAdvisory)) return false;
  if (value.fields === null) return true;
  const fields = value.fields;
  if (!record(fields) || !shortText(fields.title) || typeof fields.revising !== "boolean" ||
    typeof fields.attempted !== "boolean" || !Array.isArray(fields.rows) ||
    fields.rows.length === 0 || fields.rows.length > 200) return false;
  if (value.groupId === null && fields.revising ||
    value.groupId !== null && !fields.revising && !fields.attempted) return false;
  const ids = new Set();
  return fields.rows.every((row) => {
    if (!record(row) || !id(row.id) || ids.has(row.id) || !shortText(row.name) ||
      row.polarity !== "positive" && row.polarity !== "negative" || row.intensity !== null &&
      (!Number.isInteger(row.intensity) || Number(row.intensity) < 0 || Number(row.intensity) > 10)) return false;
    ids.add(row.id); return true;
  });
}
export function readQuestionnaireWebRecovery(): QuestionnaireWebRecovery | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw === null || raw.length > MAX_CHARACTERS) return null;
    const value: unknown = JSON.parse(raw);
    if (!valid(value)) return null;
    return {
      schemaVersion: 1, generation: value.generation, owner: value.owner, groupId: value.groupId,
      fields: value.fields === null ? null : {
        title: value.fields.title, revising: value.fields.revising, attempted: value.fields.attempted,
        rows: value.fields.rows.map(({ id, name, polarity, intensity }) => ({ id, name, polarity, intensity })),
      },
      location: value.location, returnLocation: value.returnLocation, focus: value.focus,
      advisory: value.advisory, advisoryDismissed: value.advisoryDismissed, returnAdvisory: value.returnAdvisory,
    };
  } catch { return null; }
}
/** Failure never discards the in-memory draft or grants retry authority to a serialized request. */
export function saveQuestionnaireWebRecovery(value: QuestionnaireWebRecovery): boolean {
  try {
    const raw = JSON.stringify(value);
    if (raw.length > MAX_CHARACTERS || !valid(value)) throw new Error("The retained draft exceeds its web contract");
    sessionStorage.setItem(KEY, raw); writeSafe = true; return true;
  } catch {
    try { clearQuestionnaireWebRecovery(); } catch { writeSafe = false; }
    return false;
  }
}
export function clearQuestionnaireWebRecovery(): void {
  try {
    sessionStorage.removeItem(KEY);
    if (sessionStorage.getItem(KEY) !== null) throw new Error("The previous retained draft was not invalidated");
    writeSafe = true;
  } catch (error) { writeSafe = false; throw error; }
}
/** Never leave an old editable envelope behind an uncertain therapeutic write. */
export function assertQuestionnaireWebWriteSafe(): void {
  if (!writeSafe) throw new Error("The previous editable draft needs storage recovery before saving");
}
