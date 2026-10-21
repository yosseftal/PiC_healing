# Wave 11: Bilingual (Hebrew/English) i18n Infrastructure & Dynamic RTL Support

**Date:** 2026-10-08 (Asia/Jerusalem)  
**Repository baseline inspected:** `dddd56d`  
**Status:** Technical specification; implementation has not started. Copy and content approvals remain release prerequisites.  
**Implementation boundary:** `packages/pic-web` only; zero changes to `packages/pic-engine` or storage adapters.  
**Planning deliverable:** This document only. No application changes, issue publication, or implementation authorization.

## 1. Overview & Business Objectives

### Problem Statement

An Event Manager currently encounters predominantly English interface text and bundled English treatment guidance.
Hebrew readers need the same access to the Personal Information Center in their own language, without losing their
place, exposing prior ratings, or changing the healing work when they switch language.

Wave 10 established the therapeutic layout primitives and logical horizontal motion. It did not deliver localization.
The current application document declares English; `TherapeuticFrame` has no locale binding. `TherapeuticSheet`
renders through a Radix portal and generates some accessibility labels through English string concatenation.
Only the Unified Player currently adopts the full therapeutic frame and utility drawer. Earlier Guest Flow screens
are separate sections, so global language access and viewport locking cannot be assumed to exist on those screens.

### Solution

Provide one frontend locale authority for `he` and `en`, defaulting to `he` on first use. Switching language updates
interface text, approved localized treatment guidance, semantic language attributes, and logical layout in place.
The language selector lives inside the Utility Drawer as `[עברית / English]`. It adds no main therapeutic choice.
The Event Manager chooses the language without signing in, restarting an Inquiry Session, or passing a new gate.

### Business objectives and domain guardrails

- Make the currently shipped experience usable in Hebrew and English with equal access to sovereign actions.
- Preserve Atomic Focus: at most two direct therapeutic actions in the main frame; secondary tools stay in the Sheet.
- Preserve Dumb Reflection: locale is presentation state, while engines retain all healing and navigation authority.
- Preserve Blind-by-Default symptom rating, Terminal NEMAR, Integrating, and the sovereign Finish Anyway path.
- Preserve the single viewport, calm motion, internal content scrolling, readable contrast, and touch affordances.
- Express Mutuality (הדיות), Growth (צמיחה), and Deepening (העמקה) through respectful choices and revisiting.
  These are task-specified principles; this document does not claim all three are verified website labels.
- Ground Hebrew terminology in the official PIC website. Leave other Hebrew values pending explicit approval.
  Do not invent therapeutic labels, translate them automatically, or present repository terms as website quotations.

### Confirmed scope after pre-flight clarification

1. Localize application UI throughout the currently shipped Guest Flow, Unified Player, utilities, and Persistence Gate.
   This includes visible text, button labels, recovery banners, accessible names, placeholders, and announcements.
2. Localize currently shipped **official treatments** through frontend presentation assets. Inventory, official provenance,
   publication permission, and approved translations are prerequisites. Courses are deferred.
3. Preserve personal text, symptom/group names, notes, and personally edited protocols in their original language.
4. Persist the selected locale on this browser/device across reloads for guests and authenticated Event Managers.
   First use is Hebrew. No account synchronization is included.
5. Hebrew copy absent from the official site remains pending approval; this specification supplies no proposed values.

### Out of Scope

- Changes to engine APIs, Content Parser behavior, domain enums, RepositoryPort, schemas, migrations, or adapters.
- Account locale fields, server synchronization, locale routes, browser-language detection, or additional languages.
- Course localization or implementation of course workflows that are not present in the current application.
- Personal-content translation, machine translation, or importing the full website into the application.
- New therapeutic recommendations, navigation gestures, completion rules, or Terminal NEMAR remedial flows.
- A new font service, translation management service, or changes to the frozen Wave 10 visual tokens.

## 2. User Stories & Acceptance Criteria

Acceptance identifiers below are release requirements. A pending copy/content approval is a recorded blocker,
not permission to substitute unapproved Hebrew or to claim complete bilingual delivery.

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| AC-01 | As an Event Manager, I want Hebrew on first use, so I can begin comfortably. | No valid preference yields `he`/RTL. |
| AC-02 | As an Event Manager, I want a remembered language, so repeat visits feel familiar. | Valid saved `en` or `he` wins. |
| AC-03 | As an Event Manager, I want the language selector in utilities, so my active question stays clear. | Sheet only. |
| AC-04 | As an Event Manager, I want to switch at any current screen, so I need not restart. | All shipped screens have access. |
| AC-05 | As an Event Manager, I want immediate updates, so the interface follows my choice. | No reload or mixed UI commit. |
| AC-06 | As an Event Manager, I want direction to follow language, so layout matches reading order. | `he`/RTL; `en`/LTR. |
| AC-07 | As a keyboard user, I want a labelled selector, so I can choose without a pointer. | Native buttons; pressed state. |
| AC-08 | As a screen-reader user, I want language metadata, so pronunciation follows the text. | Frame and portals agree. |
| AC-09 | As an Event Manager, I want the drawer to stay open, so switching does not interrupt me. | Focus stays on selection. |
| AC-10 | As an Event Manager, I want my unit preserved, so switching does not change progress. | Stable unit/session IDs. |
| AC-11 | As an Event Manager, I want my draft preserved, so switching does not erase my work. | Draft values persist. |
| AC-12 | As an Event Manager, I want blind ratings preserved, so switching reveals no earlier scores. | No new reveal or reset. |
| AC-13 | As an Event Manager, I want bilingual Finish Anyway, so my authority is preserved. | Same eligibility and action. |
| AC-14 | As an Event Manager, I want respectful No responses, so ongoing work is not called failure. | Integrating remains. |
| AC-15 | As an Event Manager, I want bilingual treatment guidance, so I can understand it. | Approved matching assets resolve. |
| AC-16 | As an Event Manager, I want fallback guidance, so missing translations preserve my work. | Original source retained. |
| AC-17 | As an Event Manager, I want my own wording unchanged, so my personal content stays mine. | No dictionary lookup on it. |
| AC-18 | As an Event Manager, I want readable long guidance, so I can follow it on a phone. | Internal scrolling only. |
| AC-19 | As an Event Manager, I want reduced motion, so navigation feels calm. | No spatial motion when reduced. |
| AC-20 | As an Event Manager, I want reachable controls, so either locale works on mobile. | Targets at least 44 x 44 CSS px. |
| AC-21 | As an Event Manager, I want readable labels, so text length does not hide choices. | AA contrast; no clipping. |
| AC-22 | As a guest, I want offline switching, so language is freely accessible. | Bundled assets; no sign-in or new requests. |
| AC-23 | As an Event Manager, I want graceful storage failure, so my session continues. | In-memory choice still works. |
| AC-24 | As a maintainer, I want validated dictionaries, so missing copy is found early. | Key and parameter parity gates. |
| AC-25 | As a maintainer, I want isolated localization, so healing stays authoritative. | Web-only diff; dependency gates. |

### Observable scenario details

- **Default and persistence:** Missing, empty, malformed, or unsupported stored values resolve to Hebrew without throwing.
  Select English, reload, and observe English/LTR on the first application render. Selecting the current locale is a no-op.
  Promotion, guest discard, and sign-in do not clear the independent preference or copy it into therapeutic records.
- **Toggle and focus:** Open the Sheet, select the other locale, and observe translated headings/labels and changed placement
  while the Sheet remains open. The selected button retains focus and DOM identity. Escape, close, and overlay dismissal
  restore focus to the existing trigger. The background remains inert throughout the switch.
- **Layout:** Hebrew uses inline-start on the right and inline-end on the left; English reverses those relationships.
  Header utility placement, Sheet edge, borders, indentation, and directional affordances follow logical direction.
  Main action order remains semantic; do not reverse arrays or add `row-reverse` to compensate for direction twice.
- **State:** Switching alone changes no engine snapshot, unit state, response, success declaration, use count, rating,
  pending gate, link, or persistence payload. It preserves an explicit prior-rating reveal already chosen by the EM.
  It must not reveal a hidden prior rating, reinitialize a rating draft, or call a therapeutic action.
- **Content:** An approved asset replaces only display fields for the same treatment and canonical unit identities.
  A missing, stale, or unapproved translation displays the unchanged source with truthful content direction/language
  and a calm approved fallback notice. It does not become empty content or unlock an otherwise blocked treatment.

## 3. Technical Design & Architecture

### 3.1 Current seams and architectural authority

The inspected application uses React providers above engine-derived Guest Flow routing. Catalog reads use
`CatalogProvider`; parsed guidance uses `TreatmentContentProvider` and the composition root's tab-scoped cache.
The existing Content Parser returns canonical ordered Atomic Units. The Unified Player renders those units,
while Navigation Tree and Finish controls invoke the existing context actions.

`TherapeuticFrame`, `TherapeuticContentCard`, `HorizontalSlideContainer`, `AtomicActionLayout`, and
`TherapeuticSheet` already provide the presentation seams to extend. Existing slide and drawer CSS uses
`:dir(rtl)` signs, and reduced-motion tokens already suppress spatial movement. Reuse these capabilities.

| Presentation responsibility | Owner | Authority retained |
| --- | --- | --- |
| Locale, dictionary lookup, preference | New web `LocaleProvider` | No engine state or repository access |
| Semantic language and direction | Provider, Frame, portal surfaces | One locale value; derived direction |
| Global utility access | Existing screen composition and Sheet | Existing routing and action calls |
| Treatment display translation | Existing content seam plus pure web resolver | Canonical parsed units remain source |
| Directional placement and motion | Existing primitives and visual tokens | Stable domain keys; reflected navigation |
| Healing and persistence | Existing engine/context actions | Entirely unchanged |

Prefer the highest test seam: the real application provider/screen composition with existing engine actions.
Dictionary and treatment-display resolution are pure supporting tests within this same web presentation boundary.
Do not create separate localization stores per screen, a locale-aware engine, or a second content parser.

### 3.2 Locale state, provider lifetime, and startup

- Define the supported locale set as exactly `he` and `en`. Derive direction through the fixed mapping
  `he -> rtl`, `en -> ltr`; never persist direction separately.
- Mount one `LocaleProvider` above the existing application providers and modal surfaces. Its public contract exposes
  the selected locale, derived direction, typed message resolution, and a validated locale-selection action.
- Use local typed dictionaries and platform internationalization APIs. No added i18n dependency is necessary for this
  two-locale scope. Include full-sentence templates, declared interpolation parameters, and plural forms where needed.
- Read the browser preference synchronously in a guarded initializer before rendering the application tree.
  Serverless/test environments without `window` resolve to Hebrew. React StrictMode initialization is idempotent.
- Reserve the independent versioned key `pic-web.locale.v1`, containing only `he` or `en`. Read/write failures are caught.
  A failed write leaves the new in-memory locale active for this visit; no blocking banner or auth gate is introduced.
- Set the static application's initial document metadata to Hebrew/RTL inside the web package. After initialization,
  the provider applies the resolved `lang` and `dir` before the first visible application layout.
- A valid stored preference wins; otherwise use Hebrew. Do not negotiate with browser settings, URL parameters, or account data.
- Other tabs may save a preference, but do not automatically switch this active tab in response. Each tab retains its
  current locale; the next reload reads the latest stored value. This avoids unsolicited movement during healing work.
- Keep the provider and all engine/content providers mounted across changes. Never key the application, screen, Sheet,
  or active Atomic Unit by locale. Locale changes rerender presentation, not service construction or domain navigation.

### 3.3 Dictionary resolution and coverage

Use semantic English keys grouped by purpose, such as `center.name`, `actions.finish`, and `recovery.guidanceUnavailable`.
English strings are values, not keys. Keep the canonical key set and each key's parameter contract typed and exhaustive.
Do not pass user text, raw error messages, domain IDs, or protocol bodies through the UI dictionary.

Resolution behavior:

1. Resolve the selected locale's approved nonempty value and required plural variant.
2. If missing, resolve the approved Hebrew value; if that is also unavailable, use the English value.
3. Mark fallback text with its actual language and direction rather than inheriting inaccurate Hebrew metadata.
4. An unknown runtime key must never display the key or a parameter token. Development reports the defect;
   production uses an approved generic availability message, with English metadata if only English is available.
5. Missing values, wrong parameter sets, unknown keys, or fallback usage on a required shipped UI key fail release validation.
   Runtime fallback is resilience, not acceptance of an incomplete dictionary.

Do not implement unresolved Hebrew values as literal `PENDING`, empty strings, or invented translations.
Their absence is an approval prerequisite, not a new product state. A bilingual release waits for approved values.

Translate complete messages, including Sheet close/content labels and state announcements. Avoid assembling phrases
by concatenating English fragments or lowercasing a translated title. Interpolate names as escaped text and isolate them
bidirectionally. Format any displayed counts/dates using the selected locale; persisted numbers and timestamps stay unchanged.
Pluralized UI messages must include all forms required by the locale and be tested at relevant count boundaries.

Inventory all shipped system text: group creation, symptom addition/rating, joint-treatment testing, group summary,
treatment picker, Player, Navigation Tree state labels, Finish controls, recovery states, and the Persistence Gate.
Localize engine-origin **display labels** such as Continuous Guidance and unit states through explicit semantic mappings;
preserve the raw domain enum values and canonical parser output. Preserve stable test IDs and automation identities.

### 3.4 Directionality, portal inheritance, and global utility access

Bind `lang` and `dir` explicitly on every `TherapeuticFrame` from the locale authority. Also synchronize the application
document root for early screens and surfaces outside the frame. Language and direction are separate semantic attributes;
CSS alone must not set the base text direction. See [W3C direction guidance][S4].

Radix portal content is outside the frame's DOM subtree. Explicitly bind the same locale/direction to Sheet content
and any other portalled dialogs; do not rely on frame inheritance. The Persistence Gate also consumes the same authority.
Keep one active document metadata owner; individual screens must not compete to reset the document on unmount.
Provider cleanup in tests/embeddings restores the preceding metadata, without disturbing the existing document-lock lifecycle.

Add the same language utility section to each screen's Sheet. The current Player drawer already owns Navigation Tree
and Finish Anyway; share the language section rather than duplicating it. Earlier screens need a thin composition with
one TherapeuticFrame, bounded content, and a Sheet trigger. Do not nest a second frame around the Player.
Adoption does not change route selection or form submission. Tertiary actions move to utilities when needed to keep
the main action area within its existing two-choice contract.

Separate **language access** from **Player utility eligibility**. The Sheet trigger remains available while Player content
is resolving, empty, or reconnecting. Those phases may expose language controls alone; do not expose Finish or navigation
where the existing source-content guard prohibits them. This preserves the Zero-H3 behavior and global language access.

The selector is a labelled group with two native `type="button"` controls displaying the supplied autonyms
`עברית` and `English`. Mark the current choice with `aria-pressed`; each label has its own `lang` and `dir`.
Use ordinary Tab/Shift+Tab traversal and Enter/Space activation. No custom arrow-key navigation or switch role is needed.
Allow labels to wrap on small screens; the slash is decorative, not a third control. Do not use flags.
On selection, keep the Sheet open and focus on the activated button. A concise approved polite announcement may describe
the locale change; it must not announce a new therapeutic step or duplicate the whole guidance. Do not steal focus.

### 3.5 CSS logical properties, viewport lock, and accessibility

- Use inline/block sizes, min sizes, margins, padding, logical borders/insets, and `text-align: start/end` for directional
  layout. Use existing logical Tailwind utilities consistently. Grid/flex should follow inherited direction once.
- Keep symmetrical spacing, physical viewport dimensions, and x/y overflow where they describe physical axes.
  Audit directional left/right usage rather than replacing every occurrence mechanically.
- Mirror only icons that convey navigation direction. Preserve the meaning of numbers, logos, media, diagrams, and
  authored content. Never apply a blanket `scaleX(-1)` to containers or text.
- Safe-area environment variables name physical edges. Map right inset to inline-start in RTL, left inset in LTR,
  including the Frame's compact breakpoint. The inspected Sheet already maps those edges; the Frame still needs that audit.
- Preserve one `100dvh`/`100vw` frame with the existing `100vh` fallback, border-box sizing, bounded grid tracks,
  zero minimum child sizes, and document/root overflow lock. No locale may create a second full-height viewport.
- Keep long guidance in `TherapeuticContentCard`, wide tables in the bounded table scroller, and tools in the Sheet body.
  Header and active choice area remain visible; scrolling does not propagate to the document. Preserve scroll position
  when its content remains stable; translated reflow may clamp it to the available range without changing the active unit.
- Use `dir="auto"` for personal text inputs and appropriate block boundaries; use `bdi` for inserted names/identifiers.
  Explicitly mark Latin codes, URLs, and mixed numeric expressions where needed. Do not store bidi control characters
  in the Event Manager's data, infer language from direction alone, or label unknown personal text as translated.
- The system font stack includes Hebrew-capable fallbacks. Verify shaping, punctuation, line height, headings, and
  focus indicators with actual Hebrew. Do not shrink type or reduce targets to fit longer translations.
- Maintain text contrast of at least 4.5:1, or 3:1 for qualifying large text, and required non-text/control contrast.
  Keep the shared visible focus and disabled-control styling. See [WCAG contrast guidance][S5].
- All actionable targets remain at least 44 x 44 CSS pixels, including selector, utility trigger, close control, and
  wrapped Navigation Tree controls. This is a project requirement; [WCAG's 44px enhanced target criterion][S6]
  is Level AAA, while the requested contrast baseline is AA. Do not describe 44px as the AA minimum.

### 3.6 Motion token behavior under RTL

Keep Wave 10 token values: standard step duration 240ms, drawer duration 280ms, organic easing
`[0.22, 1, 0.36, 1]`, step distance `clamp(24px, 8vw, 96px)`, and drawer distance 100%.
Locale changes do not alter duration, easing, or magnitude; inherited direction determines the sign.

| Transition | LTR | RTL |
| --- | --- | --- |
| Forward reflected unit change | Enters from right; exits left | Enters from left; exits right |
| Backward reflected unit change | Enters from left; exits right | Enters from right; exits left |
| Neutral/reordered identity | No directional translation | No directional translation |
| Sheet open/close | Logical inline-end: right | Logical inline-end: left |
| Language switch only | No new unit transition | No new unit transition |

Forward/backward remains derived from canonical unit order, not translated labels or physical direction.
Use the existing CSS sign mechanism; do not also negate motion values in JavaScript.
Maintain presence waiting, inert exiting panels, and one active focusable panel. A locale switch during an in-flight
transition settles presentation to the current reflected unit at zero spatial offset, suppresses any obsolete
navigation announcement, and does not manufacture a navigation callback or domain action. A real pending navigation
may complete its existing presentation callback once; selection focus stays in the open Sheet.

Switching while the drawer is open repositions it immediately at the new logical edge without replaying open/close
motion or animating it across the screen. An in-flight drawer animation settles without closing the dialog.
Preserve focus and inert background throughout. Reduced motion keeps step and drawer spatial distance/duration at
zero in both locales; only the established short opacity treatment may remain.

### 3.7 Localized official treatment content

Add a web-owned, read-only catalog of **approved** localized presentation records. Keep it separate from short UI
messages and from persisted source content. Resolve it through the existing Treatment Content seam and a pure web
display resolver. Retain `getParsedTreatmentContent` as canonical, locale-independent input to session startup and guards.
Add a localized display read rather than changing what engine callers receive from that existing method.

The candidate currently shipped treatment inventory is:

| Canonical treatment ID | Current bundled title | Provenance status |
| --- | --- | --- |
| `2c6e77bd-61db-4898-8612-84e976587ff7` | Settling the Nervous System | Official provenance/translation pending |
| `c818490b-10ed-46c2-9890-1f35d34f4e25` | Grounding Through the Feet | Official provenance/translation pending |
| `92be9fb3-7092-4a78-9fa2-4aee9ba34bc6` | Loosening the Shoulders and Neck | Official provenance/translation pending |

Repository presence establishes shipped fixtures, not therapeutic authorship or official website provenance.
Confirm which candidates qualify as official before approving assets. Do not label these titles as website terms.
Do not expand the catalog to courses or arbitrary future protocols under this wave.

Each asset records canonical treatment ID, source revision/fingerprint, source language when verified, target locale,
approval/provenance references, localized catalog title, and localized unit title/body/rationale keyed by canonical unit ID.
Asset validation requires exact unit ID/order parity, complete required fields, and approved wording.
No new IDs, extra steps, split/merged units, or changed therapeutic instructions are permitted.

Because the current port has no content-version or locale field, compare a deterministic full canonical parsed-content
representation against the approved asset's source representation/fingerprint before applying an overlay.
It must include every unit's ID, order, title, body, and rationale; unit count or title alone is insufficient.
Apply only explicit allowlisted treatment identities with matching source. Validate catalog titles against approved source
titles as well. Extend only the web content facade if it needs source-title metadata; no RepositoryPort change is allowed.
Picker labels must validate their source before claiming a translated title; initial canonical labels may remain while
that existing content read resolves. Read full source only for allowlisted candidates eligible for translated titles,
reuse the existing cache, and retain canonical labels for all other rows without prefetching their protocols.

Use one coherent translation for the treatment, not partial translated units mixed silently with original guidance.
If the locale asset is missing, unapproved, or mismatched, display canonical source and an approved localized availability
notice. Empty canonical content remains guarded even if an asset exists. Nonempty zero-H3 Continuous Guidance remains
a first-class unit with the existing `unit-0` identity; translate its system title without modifying the parser.

Never reparse translated Markdown to determine session unit IDs or mutate the source cache. Render localized Markdown
through the current renderer/table scroller with the same safety policy. Locale-specific display caching must include
treatment ID, validated source revision, and locale; stale asynchronous results cannot replace a newer locale selection.
Mark localized guidance with its actual `lang`/`dir`. Mark original fallback with verified source metadata, or use
content-derived direction without claiming a known language when that metadata is unavailable.

Preserve the current canonical content cache lifetime; this wave introduces no new server freshness contract.
Do not write translated display fields into treatments, library Hard Copies, timeline events, or guest promotion payloads.
Pointers continue to reflect their current canonical source; personally authored or edited content bypasses overlays.
The current read contract lacks ownership metadata, so eligibility cannot be inferred for arbitrary rows: require the
explicit official allowlist and matching source. Keep existing FK-aligned seed IDs and seed/migration byte parity intact.
These limits preserve DEC-016 ownership semantics and the existing content-storage ADRs.

### 3.8 Implementation sequence within the web boundary

1. Complete the UI key inventory and official treatment/copy approvals; retain pending items as explicit prerequisites.
2. Add the locale authority, guarded preference handling, typed dictionaries, and semantic metadata binding.
3. Integrate one shared language section into existing/early-screen utility composition and localize all shipped system text.
4. Add approved treatment presentation assets and resolution through the existing content seam, preserving canonical inputs.
5. Audit logical layout, portal surfaces, safe areas, mixed text, and interrupted/reduced motion.
6. Execute the quality gates below and record any blocked environment or approval separately from implementation failures.

No step requires an engine edit, schema change, adapter import in a component, new dependency, or root lockfile update.
Do not expand the boundary to repair unrelated baseline failures; report them independently.

## 4. Official Terminology Dictionary Table

### Source verification and copy policy

Website sources were inspected on 2026-10-08. The [PIC home page][S1] defines the system concept, three-step process,
and supplied empowering phrase. The [PIC method page][S2] uses self-muscle-testing terminology and emphasizes
ownership of the process and pace. The [official development archive][S3] explicitly expands NEMAR.
Sources support terminology and tone, not every application's label or a guaranteed outcome.

**V:** verified website wording. **R:** repository domain term, Hebrew value awaiting approval.
**T:** supplied by this task, not independently verified as website copy. **P:** application copy pending approval.
English values below are proposed equivalents where the website does not supply English. They also need copy review.
`Pending approval` in these tables is documentation status and must never become a rendered dictionary value.

| English key | English value / meaning | Hebrew value | Basis |
| --- | --- | --- | --- |
| `center.name` | Personal Information Center | מאגר מידע אישי | V, S1 |
| `method.connect` | Connect to the information center | להתחבר למאגר המידע | V, S1 |
| `method.diagnose` | Diagnose | לאבחן | V, S1 |
| `method.heal` | Heal | לרפא | V, S1 |
| `method.answersWithin` | All the answers already exist within you | כל התשובות כבר קיימות אצלך | V, S1 |
| `method.selfHealing` | Self-healing | ריפוי עצמי | V, S1/S2 |
| `method.selfMuscleTest` | Self-muscle testing | מבחן שרירים עצמי | V, S2 |
| `method.nemar` | NEMAR | נמ"ר | V, S3; repository spelling retained |
| `method.nemarMeaning` | Right, Accurate, Desirable | נכון, מדויק ורצוי | V, S3 |
| `language.he` | Hebrew autonym | עברית | T; required selector label |
| `language.en` | English autonym | English | T; intentionally English |
| `principles.mutuality` | Mutuality | הדיות | T; principle, not a verified UI label |
| `principles.growth` | Growth | צמיחה | T; principle; S1 also uses this term |
| `principles.deepening` | Deepening | העמקה | T; principle, not a verified UI label |

### Domain display labels requiring approval

Keep these meanings aligned with CONTEXT and existing decisions. Do not use a literal generic synonym to fill the gap.
In particular, Integrating cannot be replaced by failed, incomplete, or an invented new session state.

| English key | Required English meaning | Hebrew value | Basis |
| --- | --- | --- | --- |
| `domain.eventManager` | Event Manager | Pending approval | R |
| `domain.symptomGroup` | Symptom Group | Pending approval | R |
| `domain.symptom` | Symptom | Pending approval | R |
| `domain.inquirySession` | Inquiry Session | Pending approval | R |
| `domain.workSession` | Work Session | Pending approval | R |
| `domain.integrating` | Integrating | Pending approval | R |
| `domain.player` | Unified Player | Pending approval | R |
| `domain.continuousGuidance` | Continuous Guidance | Pending approval | R |
| `domain.navigationTree` | Navigation Tree | Pending approval | R |
| `domain.terminalNemar` | Terminal NEMAR | Pending approval | R |
| `domain.polarity` | Polarity, independent from intensity | Pending approval | R |
| `domain.intensity` | Intensity, magnitude 0-10 | Pending approval | R |
| `domain.positive` | Positive polarity | Pending approval | R |
| `domain.negative` | Negative polarity | Pending approval | R |
| `unitState.unseen` | Not yet reached | Pending approval | R |
| `unitState.inView` | Currently in view | Pending approval | R |
| `unitState.skipped` | Bypassed; available for revisiting | Pending approval | R |
| `unitState.completed` | Completed; revisiting preserves completion | Pending approval | R |

### Application controls and messages requiring approval

The official site does not establish these as exact application labels. Obtain approved Hebrew before release.
This is the minimum coverage checklist; inventory every concrete screen string before implementation is accepted.

| English key / family | Required purpose | Hebrew value | Basis |
| --- | --- | --- | --- |
| `actions.yes`, `actions.no` | Binary responses | Pending approval | P |
| `actions.finish` | Finish declaration | Pending approval | R/P |
| `actions.finishAnyway` | Sovereign Finish Anyway | Pending approval | R/P |
| `actions.changeResponse` | Revise Terminal NEMAR response | Pending approval | P |
| `actions.retry.*` | Context-specific retry labels | Pending approval | P |
| `utilities.title`, `utilities.open` | Utility Drawer title and trigger | Pending approval | P |
| `utilities.close`, `utilities.content` | Full accessible messages with title parameter | Pending approval | P |
| `language.label`, `language.changed` | Selector label and polite announcement | Pending approval | P |
| `frame.stage.*`, `actions.available` | Stage and action-region accessible names | Pending approval | P |
| `group.*`, `symptom.*` | Creation, names, addition, summary and count forms | Pending approval | P |
| `rating.*` | Rating input, explicit reveal, prior-rating messages | Pending approval | R/P |
| `jointTreatment.*` | Joint treatment question and responses | Pending approval | R/P |
| `treatmentPicker.*` | Treatment choice and voluntary group linking | Pending approval | P |
| `terminalNemar.question` | Existing closing muscle-test meaning | Pending approval | R/P |
| `terminalNemar.recorded.*` | Yes/No response banners with existing semantics | Pending approval | R/P |
| `player.step.*`, `player.guidance.*` | Step announcements and guidance region names | Pending approval | P |
| `recovery.*` | Calm recovery and Zero-H3 guard messages | Pending approval | P |
| `content.translationUnavailable` | Original-language fallback explanation | Pending approval | P |
| `messages.unavailable` | Safe generic runtime fallback | Pending approval | P |
| `persistenceGate.*` | Keep work, anchoring, sign-in, retry and discard | Pending approval | R/P |
| `treatments.*` | Approved catalog titles and canonical unit display fields | Pending approval | Official inventory |

Use calm, accessible sentences without judging an answer, pressuring completion, or predicting clinical outcomes.
Preserve factual recovery information and the Event Manager's choice. Do not import website marketing claims into
system banners. Avoid forced gendered address where possible; exact Hebrew style requires approval rather than invention.

## 5. Open Questions & Decision Log

### Confirmed product decisions

| ID | Decision | Evidence / consequence |
| --- | --- | --- |
| D-01 | Two locales; Hebrew default | Task requirement; no automatic browser negotiation |
| D-02 | Selector inside TherapeuticSheet | Task requirement; preserves main Atomic Focus |
| D-03 | Web-only implementation | Task requirement; engines, adapters, schema and seeds unchanged |
| D-04 | Local browser preference across reloads | Pre-flight answer; guests and authenticated EMs; no account sync |
| D-05 | Currently shipped official treatments included | Final pre-flight answer narrows earlier UI-plus-course answer |
| D-06 | Course content deferred | Final pre-flight answer; no course infrastructure expansion |
| D-07 | Unverified Hebrew values stay pending | Pre-flight answer; no proposed Hebrew copy in this specification |
| D-08 | Personal wording preserved | Content localization limited to approved official presentation assets |

### Architectural decisions adopted for this specification

| ID | Decision | Rationale / trade-off |
| --- | --- | --- |
| A-01 | Single web provider and typed bundled dictionaries | Small scope; offline locale change; no dependency/lockfile churn |
| A-02 | Bind Frame, document, and portal metadata | Portals escape Frame DOM inheritance; early screens need coverage |
| A-03 | Preserve canonical units; apply validated display overlays | Source-order IDs and persisted progress must stay aligned |
| A-04 | Retain tab-local canonical content cache lifetime | No new server freshness promise or engine read contract |
| A-05 | No unsolicited cross-tab locale changes | Active healing/focus is stable; last saved preference wins on reload |
| A-06 | Keep Sheet open on selection; settle spatial animations | Avoid remount, focus loss, or an apparent navigation step |
| A-07 | Original-content fallback; complete planned release coverage | Resilience when content changes; honest coverage claims |
| A-08 | Compose early screens with existing primitives | Global access and single viewport require more than Player changes |

These technical choices are proposals made concrete by this specification, not claims of a separately approved ADR.
They preserve DEC-006/007 use-count rules, DEC-010/011 rating semantics, DEC-015 Player sovereignty, DEC-016 content
ownership, DEC-017 Guest Mode, and the accepted content-storage ADRs.

### Open questions and prerequisites requiring product/therapeutic sign-off

| ID | Unresolved item | Owner / closure criterion |
| --- | --- | --- |
| OQ-01 | Hebrew UI wording absent from the verified site | Product/content authority approves every shipped key and variant |
| OQ-02 | Approved English equivalents and inclusive Hebrew style | Content authority reviews full messages and assistive text |
| OQ-03 | Which shipped seed treatments are official? | Content authority confirms allowlist, source language, authorship |
| OQ-04 | Bilingual treatment text and publication permission | Authorized content owner supplies complete approved assets |
| OQ-05 | Guidance-fallback and language-change announcement copy | Approved messages; both locales; no failure framing |
| OQ-06 | New source revision invalidates a translation | Content owner refreshes fingerprint and approvals before reuse |
| OQ-07 | Actual device cutouts, zoom, keyboard and Hebrew pronunciation | Manual/device QA supplements Chromium automation |

OQ-01 through OQ-05 block a complete bilingual release, but do not block specification delivery.
Do not resolve them by silently retaining English UI, generating Hebrew, or changing engine/storage contracts.
Verified terminology may be implemented first in a later authorized turn; release waits for complete approvals.
Future account sync, courses, extra locales, and comprehensive content versioning require separate scope decisions.

## 6. Testing & Quality Gates Strategy

### 6.1 Test seams and prior art

Test observable behavior rather than context internals, hook names, dictionary file shapes, or duplicated CSS declarations.
Use the real LocaleProvider and actual screen/Sheet composition; mock storage failure or existing repository/actions at
their established seams. No live website request or translation service belongs in tests.

Prior art includes the Frame's document-lock/card/table tests, the Sheet's focus/inert/dismissal tests,
HorizontalSlideContainer's ordered-key and reduced-motion tests, Unified Player browser fixtures, and Guest Flow's
integration tests. Browser fixtures currently set direction explicitly; add actual locale switching through the provider
and control, rather than treating a test-written `dir` attribute as evidence that the feature works.
Keep test fixtures, new suites, and any dependency-rule extensions within `packages/pic-web`.

### 6.2 Unit and integration requirements

1. **Dictionary resolution:** Both approved dictionaries have identical canonical key coverage; required values are nonempty;
   parameter and plural contracts match. Exercise selected locale, Hebrew fallback, English fallback, unsupported locale,
   unknown runtime key, escaped dynamic text, and appropriate fallback language metadata. Required-key absence fails validation.
2. **Preference behavior:** Cover initial Hebrew, saved English/Hebrew, invalid values, inaccessible storage, quota/write failure,
   repeated selection, reload-equivalent remount, StrictMode, and tab policy.
   Locale storage remains distinct from guest snapshots.
3. **Metadata and toggle:** Assert document/Frame/portal language and direction, autonym metadata, pressed state, focus retention,
   drawer-open preservation, and localized title/close/region labels. Existing modal focus restoration still works.
4. **Domain invariance:** Compare reflected session/rating/draft state before and after selection. Spy on existing actions.
   Prove no jump, response, Finish, reveal, promotion, use-count mutation, or new session is triggered by selection.
   Resolve already-pending work after a switch and assert current-locale messaging with the same original result.
5. **Treatment presentation:** Approved matching source resolves the correct translated title/body/rationale without mutating
   canonical records. Test absent locale, changed body with identical IDs, reordered units, renamed title, partial assets,
   invalid approvals, empty source, Continuous Guidance, unlisted IDs, and personal content. Preserve canonical startup IDs.
6. **Race and cache behavior:** Rapid `he -> en -> he` selection cannot display a stale asynchronous translation, reset source
   caches, or mark units visited. Localized display caches distinguish locale and source revision.
7. **Therapeutic invariants:** Both locales retain Blind-by-Default, voluntary linking, Terminal NEMAR response meaning,
   Integrating wording, Finish Anyway eligibility, Zero-H3 guard, and the two-main-action contract.

### 6.3 Playwright E2E and layout matrix

Run actual `he`/RTL and `en`/LTR cases at 320x568, 390x844, 768x1024, and 1440x900 CSS pixel viewports.
Include fresh preference, restored preference, each Guest Flow screen, ordinary Player unit, Terminal NEMAR Yes/No,
content resolving/recovery/empty phases, and the Persistence Gate. Chromium is the existing configured browser;
do not claim Safari/Firefox/device coverage unless separately executed.

- Open the app with controlled storage, change language **through the utility selector**, and reload to verify persistence.
  Browser-only stubs may replace existing catalog/auth/network seams; language itself uses real provider and dictionaries.
- Assert Frame/document dimensions stay within viewport, document scroll width/height do not exceed it (allow at most 1px
  rounding tolerance), `window.scrollX/Y` stay zero, and document/root overflow remains locked through switching.
- Scroll long translated guidance, Sheet content, and wide GFM tables; verify the header stays fixed and the document does
  not move. Measure containment and visibility, not signed RTL `scrollLeft`, whose conventions differ between browsers.
- Measure mirrored utility placement and Sheet bounding boxes at logical inline-end; check borders, safe-area mapping,
  wrapped controls, mixed Hebrew/Latin names, punctuation, numeric ratings, and keyboard reachability.
- Measure every relevant control at at least 44px in both dimensions. Verify focus rings and text/control contrast on
  translated states using the existing token/contrast coverage plus rendered checks; screenshots alone do not prove contrast.
- Test Tab/Shift+Tab trapping, Enter/Space selector activation, Escape/overlay/close dismissal, return focus, and unchanged
  background inertness. Confirm language metadata and accessible names on both Frame and portalled content.
- Observe real transforms during forward/backward movement in both locales, neutral replacements, and open/close motion.
  Attach observations before actions; wait for settled states rather than sleeping or masking races with extra retries.
- Switch during navigation and drawer animations, and rapidly switch twice. Verify a single settled active unit, no orphaned
  exiting controls, no spurious navigation announcement, and retained selector focus.
- Emulate `prefers-reduced-motion: reduce` in both locales; prove zero spatial movement for step and Sheet transitions.
- Exercise approved treatment translations with real canonical fixtures, then stale/unavailable assets; assert source fallback
  and language metadata. Personal text remains byte-identical. No network request is caused by selecting the language.
- Verify fresh Guest Mode localization without server connectivity once the application assets are loaded. This does not
  introduce or claim a new service worker or offline installation feature.

Manual QA covers real mobile keyboard/visual viewport changes, device cutouts, desktop browser zoom, Hebrew rendering,
and screen-reader pronunciation/announcements. Record results and limitations explicitly.

### 6.4 Commands and boundary gates for the later implementation

Run from the repository root unless noted. These are future implementation requirements, not checks claimed in this
documentation-only turn. No tests are skipped, weakened, or moved into engine/adapters to satisfy the web scope.

| Gate | Command / required evidence |
| --- | --- |
| Frontend unit/integration suite | `npx vitest run packages/pic-web/src` |
| Frontend dependency boundaries | `npm run depcruise --workspace=pic-web` |
| All workspace dependency boundaries | `npm run depcruise --workspaces --if-present` |
| Root typecheck | `npm run typecheck` |
| Root lint | `npm run lint` |
| Browser E2E/layout suite | `npm run test:browser --workspace=pic-web` |
| Frontend production build | `npm run build --workspace=pic-web` |
| Root regressions | `npm test` (includes workspace dependency checks) |
| Line-length standards | Existing checker; changed files at most 130 characters per line |
| Change scope | Compare changed paths with the implementation baseline; web-only implementation diff |
| Copy/content release validation | Approved key parity and complete approved treatment inventory in both locales |

Dependency-cruiser currently prevents adapter imports outside approved web composition seams. Retain that rule and,
within the web configuration if needed, forbid the locale/dictionary modules from importing engines or adapters.
`depcruise` does not prove zero edits to engine packages; review the diff separately. No application file outside
`packages/pic-web`, including root dependency metadata, may change under this wave without a new scope decision.

Root regression tests can depend on configured remote services. Report an unavailable environment separately from a
passing test; do not disable TLS verification, replace real fixtures with weaker data, or declare an unrun gate green.
The remediation handoff records prior passes; it is historical evidence, not verification of Wave 11.

### 6.5 Definition of Done

- All acceptance criteria pass for both locales on the shipped screen/content scope.
- Approved Hebrew/English UI dictionaries are complete; no pending values, raw keys, or unintended UI fallbacks ship.
- The confirmed official treatment inventory has complete approved assets with verified identity/source matching.
- Locale changes preserve domain state and personal data; portals, motion, focus, viewport and internal scrolling pass.
- All applicable quality gates pass with results recorded; manual limitations and external blockers are explicit.
- The implementation diff is confined to `packages/pic-web`; engine, adapters, contracts, seeds and migrations are unchanged.
- Course content remains deferred. Content revision/fallback behavior is documented without claiming new backend support.

### References

[S1]: https://pic-healing.com/ "Official PIC home page: system concept and three-step process"
[S2]: https://pic-healing.com/%D7%A9%D7%99%D7%98%D7%AA-pic/ "Official PIC method page"
[S3]: https://pic-healing.com/tag/%D7%94%D7%AA%D7%A4%D7%AA%D7%97%D7%95%D7%AA/ "Official NEMAR expansion"
[S4]: https://www.w3.org/International/questions/qa-html-dir "W3C structural direction and logical layout guidance"
[S5]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html "WCAG text contrast"
[S6]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html "WCAG enhanced target size"

Repository authority: [Domain glossary](../../CONTEXT.md), [Decisions](../../decisions.md),
[Project manifesto](../../CLAUDE.md), [Wave 10 specification](../../.scratch/wave-10-ui-primitives.md),
[Wave 10 remediation handoff](../audits/wave-10-remediation-handoff.md),
[Hybrid ownership ADR](../adr/0001-hybrid-ownership-for-shared-reference-tables.md), and
[Content storage ADR](../adr/0002-protocol-content-jsonb.md).
