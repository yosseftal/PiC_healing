/**
 * `pic-engine`'s public barrel (package.json `"main": "src/index.ts"`). This is the **only** file any
 * cross-package consumer (`pic-adapter-local-guest`, `pic-adapter-supabase`, `pic-web`) should import from
 * - e.g. `import type { RepositoryPort } from "pic-engine"` - rather than reaching into a sibling package's
 * `src/*` internals via a deep relative path.
 */
export type {
  FinalizedSymptomGroup,
  Intensity,
  IntegratingReason,
  JointTreatmentMuscleTestResult,
  LibraryRow,
  LibraryRowProvenance,
  PlayerSession,
  PlayerUnit,
  PlayerUnitState,
  Polarity,
  Symptom,
  SymptomGroupDraft,
  TimelineEvent,
  Timestamp,
} from "./types";

export type {
  PromoteGuestToAccountInput,
  PromoteGuestToAccountResult,
  RepositoryPort,
  SymptomGroup,
  GuestSessionGateState,
  TreatmentListItem,
} from "./repository-port";
export { TRACER_BULLET_SEED_TREATMENTS } from "./tracer-bullet-seed-treatments";
export {
  DEFAULT_GUEST_SESSION_GATE_STATE,
  PromoteGuestToAccountIdentityMismatchError,
} from "./repository-port";

export { DelegatingRepositoryPort } from "./delegating-repository-port";

export {
  EmptyRatingUpdateError,
  GroupEngine,
  GroupNotFoundError,
  InvalidIntensityError,
  JointTreatmentMuscleTestNotSetError,
  UnknownSymptomError,
} from "./group-engine/index";

export { LibraryEngine } from "./library-engine/index";

export type { RecordExecutionInput } from "./timeline-engine/index";
export { TimelineEngine } from "./timeline-engine/index";

export {
  PlayerEngine,
  PlayerSessionNotFoundError,
  TERMINAL_NEMAR_UNIT_ID,
  TerminalNemarNotYesError,
  UnknownPlayerUnitError,
} from "./player-engine/index";

export type { GuestSnapshot, PromotionStatus, SessionEngineOptions, SessionMode, SessionState } from "./session-engine/index";
export { SessionEngine } from "./session-engine/index";

export { normalizeInViewUnit } from "./normalize-in-view-unit";
