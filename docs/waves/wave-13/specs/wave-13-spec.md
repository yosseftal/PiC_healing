# Wave 13 Specification & Architectural Charter

**Theme:** Onboarding, self-diagnosis questionnaire, dynamic priority, identity, and content hygiene.

**Date:** 2026-10-20, Asia/Jerusalem.

**Status:** APPROVED specification (2026-10-20); generated tickets await human review before implementation.

**Repository baseline inspected:** `853a696` — Gate development artifacts from production web builds.

**Predecessor:** Wave 12 is closed. Its handoff records 560 root tests and 179 Chromium cases passing.
Those results are historical evidence, not tests rerun for this specification. Its physical-device and
native Hebrew screen-reader checks remain Pending Manual QA Verification.

## Problem Statement

The Event Manager currently encounters a required group-name submission before entering a first topic.
The experience exposes storage terminology, adds and rates topics individually without showing an editable
priority list, and displays total counters. Forward routing does not provide a coherent questionnaire Back action.

People need an approachable introduction to PIC, an optional name, clear preparation instructions, and a
list whose order represents their own priorities. Priority and intensity must remain visibly distinct.
They also need a truthful greeting and identity status, and an understandable destination after treatment.
Unexpected catalog content must be investigated without destroying treatment material or personal history.

## Solution

Present a Hebrew-first **שאלון אבחון עצמי**. Show the supplied preparation text, then an optional title and
the first topic input immediately beneath it. Grow an ordered list with an inline next-topic input and exactly
two primary actions: **הוספת נושא נוסף** and **סיום והמשך**. Support keyboard-accessible move controls;
dragging is optional enhancement. Keep a separate, non-destructive Back control in the screen chrome.

On the recommended path, collect topics, refine priority, rate one topic at a time, and continue to the joint
treatment question. The Event Manager can revisit earlier questionnaire work without resetting it.
The introduction and muscle-testing guide remain freely accessible and skippable.

The user-facing questionnaire is a presentation/workflow name. It does not introduce a second persistent
container alongside Symptom Group / Work Session. The application organizes the Event Manager's own input;
it does not infer urgency, diagnose a condition, assign polarity, or select treatment on their behalf.

### Decisions explicitly confirmed by the user

| ID | Confirmed decision | Boundary |
| --- | --- | --- |
| W13-D1 | Persist manual priority through a bounded engine, adapter, and schema extension. | Not a general core rewrite. |
| W13-D2 | Initial questionnaire intensity is 1–10. | Re-rating, history, and existing 0–10 data remain unchanged. |
| W13-D3 | Manual order is default; optional polarity view is available. | Polarity view is summary-only, never blind input. |
| W13-D4 | Adding a topic after a joint answer requires a fresh answer for the full updated list. | Never reuse the old answer. |
| W13-D5 | Propose a text adaptation of the official demonstration for approval. | Source resolved; actual copy needs review. |
| W13-D6 | Include the official YouTube video container in W13-07. | Online, click-to-load; no autoplay or offline video. |

The applicable AGENTS instruction restricts earlier UI-wave changes to the web package.
W13-D1 explicitly authorizes proposing the named cross-package order extension for this wave.
W13-D4 also requires a bounded public contract to associate the actual joint answer with the revised membership.
These decisions do not authorize implementation now, unrelated core changes, migrations against a live database,
or any content/database deletion.

## User Stories

1. As an Event Manager, I want an introduction to PIC, so that I understand the purpose of the app.
2. As an Event Manager, I want to learn about Sigal Nitzan, so that I know the method's origin.
3. As an Event Manager, I want free access to the method guide, so that learning does not require an account.
4. As an Event Manager, I want to skip or revisit the introduction, so that I control my own pace.
5. As an Event Manager, I want clear Hebrew muscle-testing guidance, so that I understand the next inquiry.
6. As an Event Manager, I want a questionnaire rather than a database form, so that entering topics feels natural.
7. As an Event Manager, I want the preparation instructions visible, so that I can follow the supplied methodology.
8. As an Event Manager, I want to leave the list title empty, so that naming does not delay my first topic.
9. As an Event Manager, I want a first topic input immediately below the optional title, so that I can begin directly.
10. As an Event Manager, I want to add topics progressively, so that I can keep thinking without leaving the screen.
11. As an Event Manager, I want my pending last topic included on continuation, so that it is not silently lost.
12. As an Event Manager, I want to see my topic list, so that I can reflect on what I have entered.
13. As an Event Manager, I want to change list order, so that it reflects what feels most urgent to me.
14. As a keyboard user, I want move-up/down controls, so that ordering does not depend on dragging.
15. As a touch user, I want large accessible controls, so that ordering works on a small screen.
16. As an Event Manager, I want priority numbers distinct from scores, so that urgency and intensity are not confused.
17. As an Event Manager, I want initial scores of 1–10, so that I can use the supplied interference scale.
18. As an Event Manager, I want independent polarity, so that changing framing does not change priority or intensity.
19. As an Event Manager, I want to rate one topic at a time, so that I can focus on my present experience.
20. As an Event Manager, I want previous ratings hidden during re-rating, so that they do not anchor my response.
21. As an Event Manager, I want an explicit reveal control, so that I can consult my history when I choose.
22. As an Event Manager, I want existing zero ratings preserved, so that this wave does not rewrite my history.
23. As an Event Manager, I want to move backward without loss, so that I am not trapped in a wizard.
24. As an Event Manager, I want Back distinguished from starting over, so that revisiting does not discard my work.
25. As an Event Manager, I want a failed save to retain my draft, so that retry does not require re-entry.
26. As an Event Manager, I want my chosen order retained after persistence, so that it does not silently change.
27. As a Guest, I want the same order after account promotion, so that saving preserves my choices.
28. As an Event Manager, I want to answer the joint-treatment question myself, so that the system never invents an answer.
29. As an Event Manager, I want a way forward after answering No, so that guidance respects my sovereignty.
30. As an Event Manager, I want a clean summary without totals, so that I can focus on the actual topics.
31. As an Event Manager, I want an optional polarity view, so that I can review framing without losing manual priority.
32. As an Event Manager, I want a greeting using my available name, so that the drawer feels personal.
33. As an Event Manager, I want accurate Guest/account status, so that I understand my current identity.
34. As an Event Manager, I want identity distinguished from save status, so that signing in is not mistaken for saving.
35. As an Event Manager, I want Hebrew and English layouts to preserve my draft, so that changing language is harmless.
36. As an Event Manager, I want treatment completion to have a clear destination, so that catalog entries are not confusing.
37. As a content owner, I want candidate junk identified with evidence, so that removal decisions are informed.
38. As a content owner, I want explicit approval before any deletion, so that legitimate material is protected.
39. As a returning Event Manager, I want my own name and work isolated from other accounts, so that identity stays correct.
40. As an Event Manager, I want accessible long guidance and input controls, so that zoom and small screens remain usable.

## Implementation Decisions

### 1. Ownership and module impact

| Package / module | Proposed responsibility | Explicit limit |
| --- | --- | --- |
| pic-web: questionnaire screens | Entry, list, current input, initial ratings. | No domain persistence in JSX. |
| pic-web: flow facts and router | Reversible questionnaire navigation and draft lifetime. | No copied Player state machine. |
| pic-web: inquiry lifecycle | Serialize actions; preserve owner/generation/reset guarantees. | Back never invokes reset. |
| pic-web: composition and contexts | Call public group actions; expose identity and content views. | Adapter access stays here. |
| pic-web: shared Frame / Sheet | Back chrome, identity header, introduction/help entry. | Preserve focus and dialog lifecycle. |
| pic-web: locale provider | Typed Hebrew/English messages and literal personal text. | No runtime machine translation. |
| pic-web: catalog/content seams | Audit source identity and post-Finish destination. | No deletion or title-based filtering. |
| pic-engine: GroupEngine | Validate and apply an explicit priority permutation. | No UI concepts or polarity sorting. |
| pic-engine: GroupEngine | Bind renewed joint answers to revised membership. | No fabricated answer or forced Yes. |
| pic-engine: domain/RepositoryPort | Durable group order and concurrency contract. | Ratings remain independent. |
| pic-adapter-local-guest | Round-trip order and legacy local data. | No new anonymous server persistence. |
| pic-adapter-supabase | Durable order read/write and promotion compatibility. | No client-side delete/reinsert reorder. |
| Supabase schema / promotion RPC | Order, ownership, atomic writes and compatibility. | Additive; no content cleanup. |
| PlayerEngine / LibraryEngine | Existing navigation, completion, Pointer/Hard Copy rules. | No planned behavioral change. |

Use the existing App → contexts/composition → GroupEngine → RepositoryPort seam as the principal behavior boundary.
Do not create a parallel questionnaire engine, a second auth client, or a second content parser.
Pure presentation draft state is allowed; authoritative ratings, finalization, saved order, and completion remain
owned by the existing domain modules. A drag preview is not a committed domain mutation.

### 2. Questionnaire layout and authored preparation

Screen order inside the existing content card:

1. Questionnaire heading and preparation guidance, expanded on first presentation.
2. Optional title labeled **שם לרשימה (לא חובה)**.
3. Added topics in manual priority order, when any exist.
4. Inline next-topic input. With an empty list this sits immediately below the optional title.
5. The two primary actions. Back and service access belong to screen chrome.

Keep the guidance within the screen's scrollable content region, not in a compulsory modal or hidden in the drawer.
The heading and beginning of the instructions are prominent; the Event Manager may collapse guidance after seeing it.
No timer, forced reading confirmation, or completion gate. Use the existing 100dvh frame and internal scrolling.

**Exact preparation copy supplied by the user** (line wrapping is editorial only):

> **שאלון הכנה לתהליך ריפוי עצמי בשיטת PIC:**
>
> 🌸 הכיני לך רשימה של כל הסימפטומים שתרצי לרפא, כל הבעיות, הקשיים והאתגרים שאיתם את מתמודדת בחייך.
>
> 🌸 התבונני ברשימה ובחרי מה הדבר הראשון שהכי הכי חשוב ודחוף לך לרפא, לפתור, לאזן.
> רשמי מצד ימין שלו את המספר 1. אח"כ בסדר יורד, מספרי מצד ימין את כל שאר הנושאים
> לפי סדר העדיפות שלהם בתהליך הריפוי האישי שלך.
>
> 🌸 לאחר שהרשימה תהיה ממוספרת עפ"י סדר עדיפות - רשמי מצד שמאל של כל נושא מספר מ-1 עד 10
> שמייצג עד כמה הנושא הזה מפריע לך (1 - כמעט לא מפריע 🙂, 10 - לא יכולה לחיות עם זה 😝😭).

Preserve this supplied feminine Hebrew voice and emoji. Accessible labels also spell out the numerical endpoints;
meaning must not depend on emoji. English uses separately authored dictionary text with the same meaning.

Titles are optional data, not a required first step. Initially retain the existing string contract: whitespace-only
title becomes an empty string, not a fabricated title or a new nullable schema requirement. Readers render an untitled
list without an empty heading; navigation may use a localized generic label without writing it as the person's title.
The repository schema permits a non-null string; explicit contract tests must cover empty title in promotion too.

Create no empty group merely for visiting the questionnaire. Materialize the draft through GroupEngine on the first
successful topic submission, or commit a staged topic batch on continuation. Choose one approach in W13-01 and keep
its operation ledger stable across retries; it must not duplicate IDs. Optional title editing after materialization
requires a public group command if included; direct repository patching from a component is prohibited.
Later group-management/rename functionality is not a prerequisite for optional initial naming.

### 3. Progressive input, priority, and initial rating

The recommended preparation sequence is **list → prioritize → rate**. Do not require a score before a topic can be
added. Topic rows may initially be unrated. A single active row opens the cohesive polarity/intensity control.
All rows must not expose simultaneous sliders. Topic entry remains usable while the list is being refined.

| Action / condition | Observable result |
| --- | --- |
| Add another topic, nonblank input | Append once at the end; clear only after acceptance; focus the next-topic input. |
| Add another topic, blank input | No record; focus the input with a localized validation message. |
| Finish & Continue, pending nonblank topic | Accept that topic once before continuing; never silently drop it. |
| Finish & Continue, empty list | Stay at input; explain that a topic is needed for this symptom-led questionnaire. |
| Finish & Continue, unrated topics | Enter the one-topic initial rating pass in manual order. |
| Finish & Continue, all topics rated | Show the joint-treatment question. |
| Initial rating pass completes | Show the joint-treatment question; do not ask the person to repeat Finish. |
| Duplicate topic text | Preserve separate IDs; do not infer that the Event Manager meant the same topic. |
| Write fails / double click | Keep input, IDs, score drafts and pending intent; retry only the unfinished operation. |

Thus Finish & Continue has one destination: the joint-treatment question, with the necessary initial rating pass
inside the same questionnaire when ratings are missing. This resolves the supplied preparation order without
quietly assigning scores or inserting an unrelated wizard.

Manual priority is an explicit ordered sequence of topic IDs. Its displayed number is **סדר עדיפות**, not a score.
In Hebrew, priority belongs at the right/start side of a row; the intensity value belongs at the left/end side
when the summary is showing ratings. In English, logical layout mirrors naturally. Use distinct text labels,
spacing and accessible names rather than color alone.

Initial rating:

- Label the magnitude **עוצמת הפרעה / סבל** for negative framing, with the supplied 1 and 10 endpoints.
- Keep Polarity independently editable. Positive framing uses strength-of-positive-experience wording, not
  “10 = intolerable”; it retains a 1–10 magnitude for initial entry and requires editorial review in W13-01.
- Require an explicit current response; do not silently accept a default slider midpoint as an entered rating.
- Preserve the existing unrated signal. A placeholder zero with no rating timestamp is not a historical zero rating.
- Generic re-rating remains 0–10. Do not clamp an existing zero to one, rescale records, or rewrite timestamps.
- Re-entering an already rated topic for a fresh rating uses the blind re-rating flow, not the initial-input shortcut.
- Hide previous polarity and intensity, including badges, sort groups, accessible names, and adjacent summary content.
  Explicit Reveal retains existing behavior. Reordering never calls Reveal.

Move-up/down controls are the baseline deliverable and satisfy the charter's alternative to dragging.
They retain focus on the moved topic, announce its new priority, and disable the impossible boundary move.
No total count is needed in the announcement. If dragging is added, it must use the same action, support touch
and cancellation, and remain supplementary to keyboard buttons. Prefer existing dependencies.

### 4. Durable priority contract — approved cross-package scope

**Evidence:** Current GroupEngine appends symptoms and has no reorder action. Guest storage retains an array;
Supabase reads symptom rows without an order clause and stores no priority field. Changing React array order
alone cannot fulfill W13-D1.

Proposed domain contract:

- Add a public group-level reorder command accepting a complete ordered ID sequence for that group's current members.
- Reject duplicates, unknown IDs, omissions, and IDs belonging to another group. Empty/single-item reorder is a no-op.
- Change only priority. Preserve topic IDs, names, polarity, intensity, rating timestamps, joint answer, and history.
- Return or refresh the committed group projection; UI reflects that result. Pending UI is clearly not “saved”.
- Keep an explicit concurrency precondition. A stale reorder must fail without overwriting newer membership or ratings.
- The command crosses the existing RepositoryPort; do not bypass GroupEngine through generic component save calls.

Recommended storage representation: a per-symptom integer priority position plus a group order revision.
Read into the existing ordered group symptom array; persist zero-based positions and show one-based priority numbers.
The exact field names are for W13-02, not an instruction to add a second independent array in every layer.

Supabase ordering must be atomic and owner-checked. Prefer a bounded group-order RPC which locks the owning group,
checks revision and exact membership, updates positions, and advances revision. All writers that change membership
must participate in the same locking/revision discipline. Reordering must not use full-replacement delete semantics.
Appending assigns the next position within that contract. Ordinary rating writes must not reset positions or revisions.
If implementation reveals that the current save contract cannot preserve this safely, resolve that contract before UI dispatch.

Migration and compatibility:

1. Add ordering metadata without changing treatment content or removing rows.
2. Backfill legacy groups deterministically using available creation timestamp and ID as tie-breaker.
   Where prior manual order was never stored, state that it cannot be reconstructed.
3. Read old Guest snapshots in their existing array order; version new local envelopes without dropping pending work.
4. Carry order through Guest promotion, RPC payload validation, returned hydration, and retry receipts.
5. Preserve old pending-promotion wire shapes and fingerprints. Never enrich an already frozen retry payload
   and reuse its idempotency key. New payload behavior must be distinguishable and legacy replay still supported.
6. Exercise missing metadata, no topics, one topic, and many topics. A missing legacy position must not crash a read.
7. Rollback removes no records; retain ordering metadata if reverting presentation. Run migrations only in the
   later authorized implementation/deployment process.

Durable round-trip is required even though general authenticated workspace hydration remains a Wave 12 limitation.
Verify repository and promotion round-trips; do not claim this wave implements reopening every historical group.
Do not bypass GroupEngine's existing symptom-index limitation by casting or hydrating private fields.

### 5. Reversible navigation and draft lifetime

Own the questionnaire draft above individual screen mounts in the existing inquiry lifecycle. Key it by
inquiry generation and verified owner/Guest context. Retain optional title, pending topic text, topic IDs,
manual order, current rating input, and the return location. Clear only through the established explicit reset/discard
path, successful disposition of the draft, or an identity transition handled by the owner-isolation policy.

| Location | Back destination | Data effect |
| --- | --- | --- |
| Introduction or help opened during work | Exact invoking screen | No therapeutic mutation. |
| Questionnaire entry | Introduction / prior app entry | Draft retained. |
| Initial rating pass | Previous questionnaire step or previous topic | Input retained; no rating inferred. |
| Joint-treatment question | Questionnaire list | Topics and unsubmitted input retained. |
| No-answer advisory | Joint question, then questionnaire | Answer is not fabricated or erased by navigation. |
| Summary | Joint question / list review | No unfinalize side effect merely for viewing. |
| Treatment selection | Questionnaire summary | No Player session created. |
| Unified Player | Existing Navigation Tree and approved exit flow | Do not add manual Player Back buttons. |

Back is navigation, not undo, reset, archival, finalization, or Finish. It must not remove anchored data or increment use count.
Retain the Wave 12 operation queue and stale-callback protection. If an action is settling, keep the draft and announce
the wait; navigate after settlement or expose recovery, rather than losing the screen state.
Avoid relying on browser-history entries for clinical/domain progress. Browser navigation within the questionnaire
must use the same transition owner if supported; leaving the application is not a guarantee of cross-device recovery.

Full page reload is a separate contract. Guest saved records and durable order use existing recovery; retain only
appropriately versioned web draft fields. Authenticated retained drafts remain verified, same-owner read-only recovery
where Wave 12 lacks a public engine-resume contract. Do not advertise editable authenticated reload recovery.

**Resolved Q1 / W13-D4:** the user requires a fresh joint-treatment answer after adding a topic.
The current engine does not associate an answer with a membership revision, and the server requires an answer.
Retain additions as a pending questionnaire revision, preserve the existing committed version, and ask about the
entire updated list again after any new topics receive their initial ratings. The old answer must not finalize
or authorize continuation with the expanded list. Back retains the pending revision; it does not drop the new topic.

Proposed technical realization: a public GroupEngine action commits revised membership and the fresh actual answer
atomically, with owner/revision checks and stable IDs. Include the matching RepositoryPort/adapter contract in
W13-03 rather than implementing component-owned database writes. A save failure retains the pending revision and
answer for exact retry; a stale revision requires reconciliation rather than overwriting the saved list.
This implements the confirmed behavior; exact method names and schema details remain ticket design work.

Both Yes and No are legitimate fresh answers. No retains the existing split advisory and sovereign continuation;
“confirm again” does not mean force a positive answer. A pure reorder changes priority, not membership, and does
not require repeating the question. Repeated additions before answering require one fresh answer covering the
latest full membership. Historical answers must not be presented as answers to a later version.

### 6. Joint-treatment question and summary

Use the exact default Hebrew question **האם נכון ומדויק לטפל בכל הרשימה ביחד?**
through the existing terminology-aware dictionary. The custom terminology alias continues to be literal user text.
Domain values remain `together` and `split_suggested`; canonical NEMAR identifiers do not change.

Yes follows existing finalization. No offers the existing non-blocking advisory and a sovereign way forward.
Do not auto-split, create multiple groups, or force deletion/re-entry. Full split management is out of scope.
The current finalize-with-answer contract remains in place; DEC-014's voluntary scope-inquiry language is not
permission to fake a yes/no or invent a bypass value in this wave.

The clean summary contains a title only when provided, each topic, its manual priority, and allowed rating details.
Remove total-item counters from entry, header/progress, summary, and redundant live messages.
Do not remove priority numerals or the intensity scale maximum; these are meaningful values, not list counters.
Library use count is a separate domain concept and is not removed by this requirement.

Manual order is the default summary view. An optional utility selects a polarity view with sections labeled
Negative and Positive, plus Unrated when applicable. Preserve manual order inside each section and retain each
topic's original priority number. Section order is a presentation convention, not inferred healing urgency.
Switching view performs no persistence write, changes no rating, and never changes the canonical order.
Return to manual order before offering reorder controls. Keep this view out of all blind rating surfaces.

### 7. Drawer identity

Add a compact identity header to the service drawer in the shared Frame/Sheet composition, not to the
generic accessible Sheet primitive's domain logic.

- Verified account with a usable name: **שלום {name}**, with literal bidi-isolated text and no decorative quote marks.
- No available name: **שלום**. Never display the literal placeholder “השם שלך”.
- Guest status: **מצב אורח**.
- Verified status: **מחוברת לחשבון**.
- Checking, reauthentication and uncertainty have their own truthful localized statuses; they are not
  flattened into either “Guest” or “saved”.

Read the existing own-profile name after verified identity through the web composition boundary. The verified
auth user's supplied full name may be a display fallback. Do not expose an email address as a name by default.
Profile fetch failure falls back gracefully without changing authentication or overwriting profile data.
Clear/cancel name reads when owner or identity revision changes, including sign-out, expiry and account switches.

Use the existing auth lifecycle store, not SessionEngine mode alone: restored authentication and active therapeutic
persistence are intentionally separate. Keep unsaved local-work status independent of account status.
Signup email verification pending is not authenticated. Reuse current auth actions and focus handoffs.

### 8. Introduction, brand voice, and muscle-testing guidance

The initial surface explains three things: what PIC is, what this application lets the Event Manager do,
and where the method comes from. Two primary actions: **לתחילת השאלון** and **על השיטה ומבחן השרירים**.
Existing active work and pending authentication/recovery take precedence over a welcome screen.
The drawer provides a stable way to revisit the introduction without replacing current work.
No compulsory walkthrough, login gate, or therapeutic completion record for reading educational content.

Copy provenance distinguishes user-supplied verbatim text, short official quotations, and proposed product copy.
Use the official site's first-person, encouraging voice, with short Hebrew sentences and explicit user agency.
Do not import testimonials or website claims of guaranteed outcomes as application assertions.

Proposed product copy, adapted rather than presented as a quotation:

> ברוכה הבאה ל־PIC. כאן תוכלי לרשום את הנושאים שתרצי לעבוד עליהם, לבחור את סדר העדיפויות שלך
> ולתעד את הדרך שלך, בקצב שלך.

Proposed background copy:

> את שיטת PIC פיתחה סיגל ניצן מתוך מסע אישי של התמודדות וחיפוש.
> באתר השיטה היא משתפת בדרך שהובילה אותה לפיתוח הכלים ולהנגשתם לאחרים.

The official homepage identifies Sigal as the method's developer; its About page describes her personal
journey and development over many years. Avoid brittle claims about a precise current number of years.
The official method page introduces self-muscle-testing and links a video demonstration.
These observations support attribution and navigation, not a claim that a complete text procedure was retrieved.

**Resolved source choice Q2 / W13-D5; editorial dependency remains:** the user selected a proposed text adaptation
of the official demonstration, to be reviewed before product integration. The method page links to
[איך להתחבר למאגר המידע האישי דרך מבחן שרירים](https://www.youtube.com/watch?v=txSeLG4kJ6Y).
The official-page link and the YouTube title were verified on 2026-10-20. Transcript export returned no available
transcript. The procedure has not been transcribed or verified in this specification task.
W13-07 must produce a faithful, source-checked draft with timestamp references for the physical steps and obtain
approval before inclusion. Do not invent finger positions, calibration, force instructions or medical interpretation.
A generic link alone does not satisfy the practical text-guide requirement; W13-07 cannot close without approved text.

Proposed introductory adaptation, pending editorial approval (not a transcript or physical procedure):

> מבחן שרירים הוא אחד הכלים המוצגים בשיטת PIC לקבלת תשובות של כן ולא.
> בהדגמה של סיגל ניצן תוכלי להכיר את אופן הביצוע. אפשר לחזור להדרכה בכל שלב וללמוד בקצב שלך.

Guide structure: purpose and vocabulary; approved physical steps; how the method frames yes/no questions;
an example relevant to this questionnaire; return to the exact prior step; official source attribution.
Use a small typed content section structure with stable IDs, locale, provenance, and optional future media references.
Ship approved text and the approved W13-07V online video container described below.
No CMS, autoplay, completion tracking, custom media infrastructure or new treatment protocol is introduced.
Bundle approved educational text for the same loaded-assets offline experience as the app.
Do not promise first-ever offline loading where assets have not been installed.

Use the existing Hebrew/English locale provider, typed message keys, fallback-language metadata, RTL/LTR behavior,
and literal personal text handling. New screens receive English scaffolding and meaningful fallback copy;
unapproved English therapeutic text is identified as pending editorial review rather than silently machine translated.

#### Approved W13-07V — Official video alongside the text (part of W13-07)

**Status:** approved in the preflight charter; included in W13-07. No implementation starts during preflight.

The official source is an existing YouTube video, so a small educational embed can live wholly in pic-web.
It is not a Unified Player treatment, produces no Timeline/library entry, and does not affect questionnaire progress.
The [official YouTube embed documentation](https://developers.google.com/youtube/player_parameters)
supports a direct iframe without a custom Player API integration.

| Option | Relative effort estimate | Main trade-off |
| --- | --- | --- |
| Link to the official video | Very small | Opens a separate viewing surface. |
| In-app, click-to-load embed | Small; about half to one day including focused QA | Requires internet/provider access. |
| Owned hosting and offline download | Larger; scope after source review | Storage, delivery and cache lifecycle. |

These are preliminary engineering estimates, not a delivery commitment. They exclude creating a missing transcript,
caption authoring, content approval, and any provider restriction discovered during an actual embed playback check.
Watch-page access was verified; embed playback permission has not yet been tested.

Approved video increment: an explicitly activated video below the text, with native playback controls,
no autoplay, a localized frame title, and an external source link if playback is unavailable.
Load it only after the Event Manager chooses to watch; stop playback on closing/leaving the guide.
Preserve the exact questionnaire draft/return target. Keep text available independently when offline.
Verify keyboard focus, narrow-screen geometry, provider minimum dimensions, return navigation and unavailable playback.
Do not promise captions until an actual track is verified; the source currently has no retrievable transcript.

Do not bundle an MP4 opportunistically: the current production output allowlist excludes video assets.
An offline version would require an explicit content-asset and delivery design rather than weakening that boundary.
No engine, database, treatment-content deletion or custom video infrastructure is needed for the proposed online embed.

### 9. Content hygiene and the deletion gate

Treat the shared Treatments Table, bundled Guest catalog, approved translation overlays, Personal Treatment Library,
and Timeline execution records as distinct sources. Similar labels do not prove duplicates.

The separate audit below records the static findings and candidate inventory. No live database was inspected,
no session was reproduced in a browser, and no file or row was deleted in this specification task.

Expected trace:

1. Successful Finish clears the active Player pointer.
2. Retained questionnaire completion facts route to treatment selection.
3. The picker calls the catalog seam.
4. Guest reads the bundled seeds; authenticated catalog access reads the shared treatments table allowed by RLS.
5. Selecting a treatment explicitly resolves content and starts a Player session.

This is a plausible explanation for seeing seed content after completion. It is not evidence that new junk files
are created on Finish. Verify the exact reported route, identity state, source IDs, and completion outcome before fixing.

W13-08 may propose a clearly labeled completion/return surface or explicit “choose another treatment” action.
Do not implement auto-play, make an unrequested library copy, or hide known IDs to make the report disappear.
Any presentation remedy must preserve Terminal NEMAR, Finish Anyway, Integrating, timeline linkage, and use counts.

**Absolute gate:** Never delete a treatment content file or any database row without the human user's explicit
permission for the identified targets. This applies to cleanup scripts, migrations, cascades, fixtures that touch
shared databases, and “replacement” workflows. The current task gives no such permission.
List candidates and their references first. Silence, a filename containing “seed”, or approval of this spec is
not deletion permission. Prefer a reviewed routing correction when the issue is presentation.

## Testing Decisions

### Behavioral seams

Use the highest existing seam that demonstrates the promise. Tests observe rendered behavior, public engine
results, persisted round-trips, and actual ownership constraints; they do not mirror helper implementation.
Use the actual App providers/composition for assembled journeys, controlling transport where necessary.

| Contract | Verification |
| --- | --- |
| Optional title / progressive input | Empty title works; first input visible; last pending topic accepted exactly once. |
| Preparation / labels | Supplied Hebrew text retained; 1–10 initial endpoints; no topic totals; EN/RTL layout. |
| Priority permutation | Keyboard reorder retains IDs/ratings; invalid membership and stale revision rejected. |
| Persistence | Guest and Supabase reads preserve order; legacy backfill deterministic; no deletion on reorder. |
| Promotion | Ordered Guest → account; lost-response replay; legacy pending envelopes; no duplicate completion. |
| Ratings | Initial 1–10, later 0–10; real zero retained; no Reveal calls or polarity leakage during blind input. |
| Back | Pending input/order/score survive each backward transition; no Finish/reset side effects. |
| Renewed joint answer | Added topic requires a fresh full-list answer; pure reorder does not; failed commit preserves revision. |
| Errors | Partial add/rate/order failure retries the unfinished operation; double click cannot duplicate topics. |
| Identity | Guest, checking, verified, expired, verification-pending, missing name, and stale-owner name response. |
| Onboarding | Skippable, free, resumable; does not interrupt active Player or persistence recovery. |
| Catalog | Confirm post-Finish destination/source; no auto-launch; legitimate rows and content remain intact. |
| Accessibility | Focus, keyboard ordering, announcements, touch targets, zoom, long content, reduced motion. |

Prior art: symptom creation and localized symptom-flow suites; GroupEngine blind-rating tests; guest-flow router
tests; inquiry-reset and Player-reset tests; returning-identity and promotion-recovery suites; assembled Wave 12
browser journeys; adapter CRUD/promotion integration tests; content-localization and seed-integrity tests.

The order extension requires actual database contract coverage in an isolated, authorized environment in addition
to fake-port tests. Test cleanup must respect the deletion gate: no automatic shared/production row removal.
Do not run existing remote mutation suites against an unknown environment merely to validate this documentation.

Implementation gates: workspace typecheck, lint, scoped tests, all-workspace dependency checks, production build,
and relevant bilingual Chromium journeys. Run the full root suite and browser suite at final wave closure.
Retain all Wave 12 ownership/recovery tests. Use two workers and sequential heavy test/build runs, consistent with
the established stable workflow. Do not claim the historical counts as current evidence.
Physical keyboard/viewport, safe-area, zoom and native Hebrew screen-reader checks need explicit manual evidence;
automated geometry or ARIA checks are not equivalent.

## Detailed Ticket Suite

The [ticket index](../tickets/INDEX.md) is authoritative for the nine generated ticket IDs and their explicit DAG.
The approved behavior is unchanged; the earlier layer-oriented proposal is now organized as end-to-end slices.
W13-02 includes controls, engine, adapters, schema and promotion for durable priority.
W13-03 includes UI and atomic persistence for revised membership with a fresh joint answer.
W13-07 includes the now-approved W13-07V video container; no tenth ticket is created.

Every generated ticket contains objective/context, exact scope, blocked-by and blocking edges, demonstration,
acceptance criteria, testing requirements, Definition of Done, exclusions and a pending Resolution section.
The full [earlier specification](../archive/wave-13-spec-before-ticket-generation.md) preserves the original proposal.

The user has approved specification and content-audit scope, and authorized local ticket generation and commit only.
Ticket status remains awaiting-human-review until a separate implementation green light.

## Architectural Questions and Objections

| Decision | Relationship / conclusion |
| --- | --- |
| DEC-010 | Scale details were deferred, but existing implementation is 0–10. W13-D2 resolves initial-only 1–10. |
| DEC-011 | Summary ratings are allowed; blind input must hide prior dimensions and polarity-derived grouping. |
| DEC-012 | Reordering is not renaming or polarity flipping. No automatic name/valence edits. |
| DEC-013 | Finish, Back and decluttering do not close, archive or delete a Symptom Group. |
| DEC-014 | Recommended flow stays reversible; No remains sovereign. Full split tooling is not silently added. |
| DEC-015 | Questionnaire Back does not introduce prohibited manual Player navigation or alter Finish semantics. |
| DEC-016 | Translation overlays and Pointer/Hard Copy content are not junk merely because they share source text. |
| DEC-017 | Learning and inquiry stay Guest-first; greeting cannot imply saving. Wave 12 auth choice is preserved. |
| DEC-018 | New order metadata must not mutate frozen promotion payloads or break lost-response replay. |
| Dumb Reflection | Display reflects committed engine order; drag preview/draft state does not become a second engine. |
| Prior UI-only seam | W13-D1/D4 require bounded order and revised-answer contracts; unrelated core changes remain excluded. |

**Clarifications resolved; remaining delivery dependencies:**

- **Q1 resolved:** adding a topic requires answering again for the entire updated list. W13-03 owns the atomic revision.
- **Q2 source resolved:** propose an adaptation of the official demonstration. A verified transcript/draft and
  editorial approval are still required; the unavailable source transcript is recorded rather than filled with guesses.
- **Video approved:** W13-07V is included in W13-07 by the preflight charter; verify actual embedding during that ticket.

The proposed principal test seam is the existing App/composition → GroupEngine → RepositoryPort path,
with database/promotion contract tests where persistence cannot be proved through the browser alone.
The user's durable-order answer confirms expanding that existing boundary; no independent questionnaire engine is proposed.

## Out of Scope

- Implementing code, running migrations, deleting content, or editing live data during this specification task.
- Replacing the canonical Symptom Group model with a Questionnaire database entity.
- Automatic urgency inference, intensity-based prioritization, or therapeutic recommendations.
- Global migration of all ratings to 1–10, deletion of zero values, or inference of a positive/negative rating.
- Full symptom/group administration, automatic splitting, or automatic group archival.
- General authenticated engine hydration, cross-device draft sync, or offline conflict-resolution redesign.
- New auth mechanisms, entitlement changes, profile editing, or account deletion.
- New course/player semantics, snapshotting, treatment authoring, or a new library management product.
- Offline/bundled video and custom media/transcription infrastructure; a CMS or invented therapeutic procedures.

## Further Notes

### Source provenance

Official pages inspected on 2026-10-20:

- [PIC home](https://pic-healing.com/): app framing, method expansion, developer attribution, brand voice.
- [About Sigal](https://pic-healing.com/אודות/): personal background and origin of the method.
- [PIC method](https://pic-healing.com/שיטת-pic/): method introduction and self-muscle-testing demonstration reference.
- [Linked demonstration](https://www.youtube.com/watch?v=txSeLG4kJ6Y): source identified; no transcript was available.
- [YouTube embed reference](https://developers.google.com/youtube/player_parameters): online embedding feasibility.

The full questionnaire introduction in this document comes directly from the user's charter, not an extracted web quotation.
New welcome/background paragraphs are proposed adaptations. Existing product treatment translations have their own
recorded approval; that approval is not blanket approval of all new educational text.

### Repository evidence map

Paths here are evidence pointers at the inspected baseline, not a mandatory future file layout.

| Finding | Evidence |
| --- | --- |
| Required title gate | `packages/pic-web/src/SymptomGroupCreateScreen.tsx` |
| Per-topic add/rate and counter | `packages/pic-web/src/SymptomAddStep.tsx` |
| Default 0–10 widget and explicit reveal | `packages/pic-web/src/RatingControl.tsx` |
| Summary ratings and total counter | `packages/pic-web/src/SymptomGroupSummaryScreen.tsx` |
| Five forward-derived screens | `packages/pic-web/src/guest-flow-facts.ts` |
| Group public API lacks reorder | `packages/pic-engine/src/group-engine/index.ts` |
| Unordered reads; replacement writes | `packages/pic-adapter-supabase/src/supabase-repository.ts` |
| Owner-bound local unanswered drafts | `packages/pic-web/src/authenticated-draft.ts` |
| Identity separate from engine mode | `packages/pic-web/src/auth-lifecycle.ts` |
| Profile name bootstrap | `packages/pic-web/src/promote-path.ts` |
| Shared utility drawer | `packages/pic-web/src/therapeutic-frame/TherapeuticScreenFrame.tsx` |
| Successful Finish clears Player pointer | `packages/pic-web/src/composition-root.ts` |
| Catalog and content selection | `packages/pic-web/src/TreatmentPickerScreen.tsx` |
| Content findings and exact candidate IDs | [Wave 13 content audit](../audits/wave-13-content-audit.md) |
| Closed baseline and retained limitations | `docs/waves/wave-12/handoffs/wave-12-handoff.md` |

### Publication and readiness

The explicitly invoked `to-spec` skill calls for an issue-tracker publication and `ready-for-agent` label.
Repository instructions identify GitHub Issues on `yosseftal/PiC_healing` through the `gh` CLI.
`gh` is unavailable on PATH and was not found in the checked standard install locations in this environment.
No issue was created and no external publication is claimed.

This specification is approved for ticket generation. Q1 and the Q2 source choice are resolved by the user's replies.
The practical guide adaptation still needs source verification and approval before integration.
No implementation ticket should be advertised as fully ready while its stated content or contract blocker is unresolved.
The later preflight charter explicitly approves this specification and requests local ticket files plus commits.
Those local files are the publication target for this turn; no GitHub publication or implementation is requested.
