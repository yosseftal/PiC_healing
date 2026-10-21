# Wave 12 boundary audit preparation

Inspected at W12-06 review, base e88f19e4cd3dcc716195a26b61cf88a725fbee13.
This is interim evidence; repeat the final changed-path audit at W12-09.

- `git diff --name-only 772df65..HEAD` contains web implementation/tests and approved wave documentation only.
- The active06 worktree also contains web paths only; final closure must recheck staged paths.
- Read-only normalization review: `pic-engine/src/normalize-in-view-unit.ts` owns persistence normalization
  and rehydration. SessionEngine and both adapters import the shared implementation.
- Read-only port-shaping review: Supabase row mapping and RPC shaping remain in the Supabase adapter;
  SessionEngine owns promotion normalization and the stable group/session key. Web calls these contracts.
- Active06 retains exact snapshot bytes/intent and retries the public promotion operation; it does not copy
  SQL fingerprints, normalization, Timeline creation, or Library use-increment rules into web code.
- No cross-boundary consolidation was needed or attempted. Backend/engine/adapters remain read-only.

No final release result is implied. Subsequent07/08/09 changes and final dependency checks remain outstanding.

## W12-08 interim read-only review

- Baseline remains772df65; committed01-07 paths are web implementation/tests and approved wave documentation only.
- Inspected public GroupEngine draft/answer contracts and JointTreatmentMuscleTestResult without editing them.
  The canonical answers are together/split_suggested. Web recovery validation must preserve both real answers.
- Auth admission and new unanswered-group staging belong to web composition; neither replaces server RLS,
  public GroupEngine decisions, adapter row mapping, promotion normalization, or Timeline/use-count ownership.
- The inherited shared normalize-in-view-unit implementation remains the sole normalization owner across engines
  and adapters. New web owner/generation envelopes retain public objects rather than copy that normalization.
- Direct authenticated unanswered creation has a verified live23502 limitation. The Event Manager approved local
  owner-bound staging until the actual answer; no fake answer or backend/schema consolidation is authorized.
- Full reload cannot hydrate GroupEngine's symptom index or authenticated SessionEngine mode through public APIs.
  Exact retained envelopes stay owner-verified/read-only; general authenticated workspace hydration is excluded.
- Final08 freeze/reviews and09 whole-wave changed-path/dependency audits remain required. This is not a gate pass.

## W12-09 preflight at verified08 bf1ecf2

- Complete path audit against772df65 found76webpaths,11approved documentation paths,zero forbidden paths after08.
- Added diff scan found zero skip/todo/only declarations, retry-policy changes or added test.setTimeout lines.
- Three intentional renamed/replaced test declarations were inspected: disabled Auth stubs become real credential
  form assertions; immediate decline becomes confirmation/cancel/Escape; provider-swap promotion expands into
  verified Auth/profile and linked/unlinked actual promotion. Their scenarios are retained under approved behavior.
- Read-only shared-normalization inspection verified SupabaseRepository's shared helper imports/use in
  supabase-repository.ts, in addition to SessionEngine and LocalGuestRepository. New web Auth/draft/recovery modules
  do not duplicate those normalizers or RPC fingerprint/row-shaping rules. No cross-boundary edits/consolidation.
- Final09 additions, full all-workspace dependency gate and final path/line audit still pending. No final release claim.

## Final W12-09 audit — 2026-10-18

- Baseline772df65 through restored final09 diff:80webpaths,11approveddocs,zero forbidden paths before closure docs.
- Final09 six-file digest stayed9458BF3A52956126897A6E92E0F71B337C8769492916FBB5209AB531FEE85D6E.
- git diff --check passed. No added skip/todo/only, retries or test-timeout changes; no scenario removed.
- Read-only whole-packages search confirmed sole helper owner pic-engine/src/normalize-in-view-unit.ts.
  SessionEngine, LocalGuestRepository and SupabaseRepository retain shared imports and normalization/rehydration.
- No competing production web normalizer, RPC fingerprint, SQL row mapping or clinical-rule ownership introduced.
  No consolidation across the forbidden seam was needed or attempted.
- Full Chromium179/179 passed4.5m; root typecheck/lint and web depcruise/build passed on the frozen six files.
- Web depcruise766modules/1670dependencies,zero violations. Root unit/all-workspace dependency gate in progress.
- Final tracked closure docs and staged-path audit must retain only the approved ticket/handoff exceptions.

Final closure:80webpaths/13approveddocs/0forbidden. Ticket09:f8887fa;handoff:00eef19. All gates passed;tree clean.
