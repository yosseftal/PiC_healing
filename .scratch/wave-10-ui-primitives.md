# Wave 10 Technical Specification: Therapeutic UX and Visual Primitives

**Status:** Ready for implementation  
**Scope:** Therapeutic visual design, layout infrastructure, motion, and one Unified Player proof of concept  
**Primary package:** `packages/pic-web`  
**Boundary exception:** Root `package-lock.json` changes caused by `pic-web` package installation only  
**Domain authority:** DEC-001, DEC-011, DEC-015, DEC-016, DEC-017, `CONTEXT.md`, and `CLAUDE.md`

## Problem Statement

PiC's current React screens prove the Guest Mode and Unified Player flows, but they do not yet provide a
shared therapeutic visual system. Screens render as mostly unstyled document flow, the browser page may
become the scrolling surface, step changes cut abruptly, and each screen can independently accumulate
cards and actions.

This creates four risks for the Event Manager (EM):

1. Long pages and abrupt cuts can weaken Atomic Focus and the feeling of a Safe Container.
2. Repeated one-off styling can produce inconsistent interaction rules and make later screens expensive
   to align.
3. An unconstrained action surface can compete with body attention, especially at Terminal NEMAR.
4. UI work can accidentally leak into `pic-engine`, violating the Dumb Reflection seam.

Wave 10 establishes a reusable visual and layout foundation in `pic-web`. The browser viewport becomes a
stable frame, macro movement is represented horizontally, long content scrolls only inside its own
bounded card, direct choices remain intentionally scarce, and sovereign utility actions remain available
through an accessible pull-out Sheet.

## Solution

Implement a five-layer design hierarchy:

1. **Principles** define the ethical and perceptual constraints.
2. **Tokens** define semantic color, typography, spacing, focus, elevation, and motion values.
3. **Primitives** enforce viewport, movement, content, action, and utility boundaries.
4. **Patterns** compose primitives into repeatable therapeutic screen shapes.
5. **Interaction Rules** govern scrolling, navigation, motion, focus, action density, and recovery.

The first complete composition will refactor the Unified Player, including Atomic Unit content and
Terminal NEMAR. It will continue to reflect engine-owned state and call existing action seams. No Player,
Group, Session, persistence, content-parser, or domain behavior will move into the web layer.

## User Stories

1. As an EM, I want each screen to remain within my visible device frame, so that I feel oriented.
2. As an EM, I want the browser page to stay still, so that the experience feels like a stable container.
3. As an EM, I want long guidance to scroll inside its own card, so that the surrounding frame remains calm.
4. As an EM, I want horizontal movement between steps, so that progression feels continuous and spatial.
5. As an EM, I want backward movement to look directionally different from forward movement, so that I can
   retain a sense of place.
6. As an EM, I want only the current Atomic Unit visible, so that another step does not compete for attention.
7. As an EM, I want at most two direct choices in the main frame, so that decisions remain simple.
8. As an EM, I want at most two banners in the main frame, so that supporting information does not become a
   dashboard.
9. As an EM, I want the Navigation Tree available on request, so that I retain non-linear control.
10. As an EM, I want the Navigation Tree hidden until requested, so that it does not compete with guidance.
11. As an EM, I want Finish Anyway available from the utility Sheet, so that sovereignty is never removed.
12. As an EM, I want utility controls grouped away from therapeutic choices, so that their purposes are clear.
13. As an EM, I want Yes and No to remain equally understandable at Terminal NEMAR, so that neither answer is
    framed as failure.
14. As an EM, I want a No response to preserve Integrating language, so that ongoing healing is respected.
15. As an EM, I want a Yes response to reveal Finish without visual celebration pressure, so that completion
    remains my choice.
16. As an EM, I want to revise a Terminal NEMAR answer, so that the interface does not make an accidental tap
    authoritative.
17. As an EM, I want recovery choices stated positively, so that a temporary technical interruption is not
    presented as my failure.
18. As an EM, I want selected and focused controls to be visually distinct without relying on color alone.
19. As an EM using a keyboard, I want predictable focus after a step changes, so that I do not lose my place.
20. As an EM using a screen reader, I want the frame, active step, Sheet, and scroll region to have clear
    names, so that the visual hierarchy is also semantic.
21. As an EM using screen magnification, I want enlarged text to remain usable through internal scrolling,
    so that content is not clipped.
22. As an EM with motion sensitivity, I want reduced-motion preferences honored, so that transitions remain
    comfortable.
23. As an EM on a small phone, I want controls to stay reachable around safe areas and browser chrome.
24. As an EM on a large display, I want readable line lengths rather than stretched guidance.
25. As an EM using touch, I want controls large enough to activate reliably.
26. As an EM, I want opening and closing the utility Sheet to preserve the active Atomic Unit.
27. As an EM, I want selecting a Navigation Tree item to use the existing Player semantics, so that skipped
    and completed states remain trustworthy.
28. As an EM, I want visual transitions to follow engine state rather than anticipate it, so that the screen
    never claims movement that did not persist.
29. As an EM, I want loading and recovery phases contained in the same calm frame, so that the layout does not
    jump.
30. As an EM, I want Structured Markdown tables and lists to remain usable inside the content card.
31. As a frontend developer, I want semantic tokens, so that visual changes do not require editing every view.
32. As a frontend developer, I want layout primitives with narrow contracts, so that screens cannot silently
    bypass action and banner limits.
33. As a frontend developer, I want presentation-only motion state separated from domain state, so that Dumb
    Reflection remains intact.
34. As a frontend developer, I want one Sheet implementation, so that focus trapping and dismissal behavior
    are consistent.
35. As a frontend developer, I want logical directions rather than hardcoded left and right, so that future
    Hebrew presentation can reverse naturally.
36. As a maintainer, I want Tailwind and visual dependencies isolated to `pic-web`, so that the engine remains
    framework-free.
37. As a maintainer, I want existing test selectors and engine action paths preserved, so that the visual
    refactor does not create false domain changes.
38. As a QA engineer, I want browser-level assertions for viewport and internal scrolling, so that jsdom does
    not provide false confidence about layout.
39. As a QA engineer, I want reduced-motion and narrow-viewport cases covered, so that accessibility is part
    of the baseline.
40. As a product owner, I want one proof-of-concept screen before broader migration, so that the primitives
    can be validated before adoption across PiC.

## Implementation Decisions

### Scope and Seam

- Runtime and source changes live only in `packages/pic-web`.
- The root `package-lock.json` is the sole permitted file exception, and only for dependencies declared by
  `pic-web`.
- `packages/pic-engine`, adapter packages, migrations, and their tests must not change.
- Existing `pic-web` contexts remain the state and action seam. Primitives accept rendered values and
  callbacks; they do not import engine instances, repository ports, or adapters.
- `UnifiedPlayerScreen` remains the highest integration seam for the proof of concept.
- Existing domain `data-testid` values remain stable unless a test is explicitly testing a new primitive.
- Local state is permitted only for presentation concerns such as Sheet openness, response-edit disclosure,
  previous visual index, and transition completion. It must not mirror unit state, Terminal NEMAR response,
  Finish eligibility, session status, or persistence status.

### Package and Styling Foundation

- Use Tailwind CSS v4 in `pic-web`, integrated through the Tailwind Vite plugin.
- Keep the Tailwind entry stylesheet, generated shadcn/ui source, utility helpers, and configuration local to
  `pic-web`.
- Use a local shadcn/ui Sheet component backed by Radix Dialog behavior. Do not install or generate the wider
  shadcn/ui catalog.
- Use the `motion` React package for presence-aware horizontal transitions.
- Use CSS transitions for simple hover, focus, pressed, and Sheet state styling.
- Styling dependencies may be declared only by `pic-web`. No styling dependency may be exported through a
  domain package.
- A single class-merging helper may combine conditional Tailwind classes. It remains a private web utility.
- Global CSS is limited to token declaration, normalization of `html`, `body`, and `#root`, reduced-motion
  handling, and base typography. Screen-specific rules belong in primitives or composed patterns.

## Five-Layer Design Architecture

### Layer 1: Principles

#### 1.1 Safe Container

- The app frame is exactly the dynamic viewport: `100dvh` by `100vw`.
- `html`, `body`, `#root`, and the active `TherapeuticFrame` suppress page scrolling and rubber-band
  propagation.
- Safe-area insets are part of frame padding, not extra document height.
- No adopted screen may rely on body scrolling as an escape hatch.

#### 1.2 Atomic Focus

- One active therapeutic subject is visually dominant.
- The main frame exposes zero, one, or two direct actions; never more than two.
- The main frame exposes zero, one, or two content or status banners; never more than two.
- Navigation, Finish Anyway, and secondary tools live in the utility Sheet.
- Opening the Sheet creates a separate modal utility context. Its controls do not count toward the obscured
  main frame's action budget.

#### 1.3 EM Sovereignty

- Hiding a utility is not removing it. The Sheet trigger remains consistently available in Player states.
- Finish Anyway remains enabled whenever the existing domain contract allows it.
- The Navigation Tree remains the only manual non-sequential Player navigation mechanism.
- Visual design must not make No, Integrating, revisiting, retrying, or dismissing the gate look punitive.
- No animation, disabled state, or hierarchy may invent a new completion gate.

#### 1.4 Dumb Reflection

- Direction, labels, selected states, and Finish visibility derive from current engine snapshots.
- Movement animation starts after the reflected active key changes.
- A failed action leaves the visible domain state in place and presents a positive recovery banner.
- Primitives have no knowledge of symptoms, ratings, treatment rules, unit state transitions, or promotion.

#### 1.5 Calm Legibility

- Visual hierarchy comes from space, type, subtle surface contrast, and restrained color.
- Decorative gradients are accents only and never sit behind long-form body text.
- Motion has no bounce, overshoot, autoplay loop, parallax, or celebratory pressure.
- Content line length is capped for reading comfort.

### Layer 2: Tokens

#### 2.1 Design System Color Tokens (`pic-web`)

Define the following Tailwind v4 theme variables:

- `--color-pic-sterile`: `#F7F9F5` — master background.
- `--color-pic-surface`: `#FFFFFF` — primary card surface.
- `--color-pic-sage-50`: `#F2F7F1` — subtle sage wash.
- `--color-pic-sage-100`: `#E3EFE4` — Light Sage Green surface.
- `--color-pic-sage-200`: `#CFE1D1` — selected and confirmation surface.
- `--color-pic-sage-500`: `#7FA687` — non-text decorative accent.
- `--color-pic-sage-700`: `#3E6749` — contrast-safe primary action and text accent.
- `--color-pic-lavender-50`: `#F7F4FB` — subtle reflection wash.
- `--color-pic-lavender-100`: `#EFEAF7` — Soft Lavender surface.
- `--color-pic-lavender-200`: `#DDD2EE` — selected inquiry surface.
- `--color-pic-lavender-500`: `#9B85BE` — non-text decorative accent.
- `--color-pic-lavender-700`: `#5D477D` — contrast-safe inquiry text and controls.
- `--color-pic-ink`: `#25312B` — primary readable text.
- `--color-pic-quiet`: `#56635D` — Quiet Text and secondary metadata.
- `--color-pic-line`: `#DCE4DD` — calm structural borders.
- `--color-pic-focus`: `#6F568F` — gentle but visible focus ring.
- `--color-pic-focus-offset`: `#F7F9F5` — focus-ring separation from surfaces.

Semantic mappings:

- Canvas uses Sterile Background.
- Default cards use Surface with Line borders.
- Primary confirmation uses Sage 700 with white text; Light Sage remains its surrounding family.
- Inquiry and deepening surfaces use Lavender 100 or 200 with Lavender 700 text.
- Quiet Text is secondary only and must still meet WCAG AA for its intended size.
- Focus uses a three-pixel ring plus a two-pixel offset and never relies on color alone.
- Disabled controls use reduced contrast plus `disabled` semantics; opacity alone is insufficient.
- Recovery states use Lavender or neutral styling, not danger-red framing.

Before implementation acceptance, final foreground/background pairs must be checked for WCAG 2.2 AA.
Decorative Sage 500 and Lavender 500 are not approved for body text without a measured contrast pass.

#### 2.2 Gradient Tokens

- `--gradient-pic-healing`: a low-contrast Sage 100 to Lavender 100 linear gradient.
- `--gradient-pic-confirmation`: Surface to Sage 50.
- `--gradient-pic-reflection`: Surface to Lavender 50.
- Gradients may appear on frame edges, headers, or compact banners.
- Long-form content cards use a solid Surface background for stable readability.

#### 2.3 Typography Tokens

- `--font-pic-sans`: system UI sans-serif stack with native Hebrew support.
- Display size: responsive `1.5rem` to `2rem`, weight 600, compact but not crowded.
- Heading size: responsive `1.25rem` to `1.5rem`, weight 600.
- Body size: `1rem` minimum, `1.0625rem` preferred for guidance, line height 1.65.
- Quiet size: `0.875rem` minimum, line height 1.5.
- Reading measure: 62 characters preferred, 70 characters maximum.
- Do not use all caps for therapeutic actions or state labels.

#### 2.4 Space, Shape, and Elevation Tokens

- Spacing follows a four-pixel base with named calm gaps at 8, 12, 16, 24, 32, and 48 pixels.
- Minimum touch target is 44 by 44 CSS pixels.
- Card radius is 24 pixels on regular screens and 18 pixels on compact screens.
- Button radius is 14 pixels; pill shapes are reserved for compact status labels.
- Main card shadow is diffuse and low contrast; borders remain visible when shadows are disabled.
- The Sheet uses stronger separation than content cards without appearing like an alert.

#### 2.5 Focus and State Tokens

- Every interactive element receives the shared focus-visible ring.
- Pressed controls use border, icon or checkmark, and `aria-pressed`; color is supplemental.
- Loading uses stable geometry and quiet text rather than layout-shifting spinners where possible.
- Recovery banners use `role="status"` and never steal focus automatically.

#### 2.6 Motion Tokens

Define matching CSS and typed Motion tokens:

- `--motion-pic-fast`: 140 milliseconds.
- `--motion-pic-standard`: 240 milliseconds.
- `--motion-pic-deliberate`: 360 milliseconds.
- `--motion-pic-drawer`: 280 milliseconds.
- `--ease-pic-organic`: cubic-bezier `(0.22, 1, 0.36, 1)`.
- `--distance-pic-step`: `clamp(24px, 8vw, 96px)`.
- `--distance-pic-drawer`: 100 percent of the Sheet width.

Motion behavior:

- Forward content enters from logical inline-end and exits toward logical inline-start.
- Backward content enters from logical inline-start and exits toward logical inline-end.
- Initial mount does not slide.
- Step opacity may move only between 0.92 and 1 to avoid a harsh blink.
- Sheet overlay fades while Sheet content translates from logical inline-end.
- `prefers-reduced-motion: reduce` removes translation and uses an immediate content swap with, at most, a
  fast opacity transition.
- CSS and typed Motion values have one contract test to prevent drift.

### Layer 3: Primitives

#### 3.1 Layout Primitive 1: `TherapeuticFrame`

Purpose: own the viewport, safe areas, stable header, stage, content boundary, and utility trigger.

Public contract:

- Required accessible frame title or `aria-labelledby` reference.
- Optional eyebrow, progress, and quiet status slots.
- Optional utility Sheet trigger and Sheet content.
- One stage child.
- Tone option limited to neutral, confirmation, or reflection.
- Optional constrained-width override for exceptional content; full-width is not a screen-level default.

Structural contract:

- Outer shell uses `h-[100dvh]`, `w-screen`, `overflow-hidden`, `overscroll-none`, and isolation.
- A `100vh` fallback is present for browsers without dynamic viewport support.
- Internal grid rows are header, `minmax(0, 1fr)` stage, and safe-area spacing.
- Every flex or grid ancestor of an internal scroll surface uses `min-h-0` and `min-w-0`.
- The stage clips horizontal overflow and does not become a vertical page scroller.
- Frame padding includes `env(safe-area-inset-*)`.
- The header remains stable during step transitions.
- The utility trigger is in the header, has a minimum 44-pixel target, and has an accessible name.

Internal content scrolling:

- `TherapeuticFrame` exposes a dedicated `TherapeuticContentCard` sub-primitive.
- The card uses bounded height, `overflow-y-auto`, `overscroll-contain`, stable scrollbar gutter, and smooth
  touch scrolling.
- Only the active card or banner may scroll vertically. The stage and document remain locked.
- The card receives an accessible region name when overflow is possible.
- Markdown tables scroll horizontally inside a table wrapper; they must not widen the frame.
- Focused controls inside a card may use `scrollIntoView({ block: "nearest" })`.

Non-responsibilities:

- It does not choose the current screen or unit.
- It does not determine Player progress, Finish eligibility, or persistence.
- It does not render arbitrary navigation controls outside the provided utility Sheet.

#### 3.2 Layout Primitive 2: `HorizontalSlideContainer`

Purpose: give engine- or router-derived changes a consistent horizontal spatial transition.

Public contract:

- Controlled active key.
- Controlled ordered key list or explicit previous/next direction.
- One active child.
- Optional accessible step label and transition-complete callback.
- Reduced-motion behavior enabled by default and not disableable by consumers.

Behavior:

- The primitive compares the reflected active key with the prior visual key to infer forward or backward
  direction.
- Previous-key memory is presentation-only and is never written to an engine or repository.
- A missing or reordered key causes a neutral replacement rather than guessing direction.
- Presence mode waits for the outgoing view to leave before the incoming view becomes interactive.
- Hidden or exiting children are removed from the tab order and accessibility tree.
- The active child is keyed by stable domain identity, never array position alone.
- After a completed user-initiated transition, focus moves to the new step heading or card region.
- Screen readers receive one concise step announcement; content is not duplicated in a live region.
- The container does not implement drag, swipe, wheel, or keyboard navigation.

The no-gesture decision is deliberate. Horizontal motion is a visual representation of navigation, not a
new navigation mechanism. Player jumps still occur only through the Navigation Tree and existing engine
actions.

#### 3.3 Layout Primitive 3: `AtomicActionLayout`

Purpose: structurally enforce Atomic Focus rather than relying on review discipline.

Public contract:

- One non-interactive primary content slot.
- An action tuple containing zero, one, or two action descriptors.
- A banner tuple containing zero, one, or two banner descriptors.
- Optional alignment limited to stacked or paired.
- Action descriptors support button or link semantics, label, accessible label, visual intent, disabled
  state, pressed state, and callback or destination.
- Banner descriptors support neutral, confirmation, reflection, and recovery intent.

Enforcement:

- Tuple types make three main actions or three banners a TypeScript error.
- The primitive renders direct controls itself; consumers cannot inject an arbitrary button collection into
  the action row.
- Development assertions reject interactive descendants in the primary content and banner slots, except
  semantic links inside rendered Markdown.
- Production output does not throw for authored Markdown links.
- Paired actions receive equal visual weight unless one is explicitly a quiet revision action.
- Action wrapping becomes a vertical pair on narrow screens without changing order.
- A banner's dismissal control, when present, counts as an action and must be modeled intentionally.

The header Sheet trigger is frame chrome, not a main-frame action. Sheet contents are a separate modal
context and do not relax the two-action limit in the main frame.

#### 3.4 Supporting Primitive: `TherapeuticSheet`

Purpose: preserve sovereign and non-linear controls without crowding the active therapeutic choice.

Implementation:

- Use a locally owned shadcn/ui Sheet backed by Radix Dialog.
- Open from logical inline-end; reverse naturally under right-to-left document direction.
- Width is capped for tablets and desktops and nearly full-width on narrow phones.
- Sheet body is its own bounded vertical scroll region.
- Opening traps focus; Escape and overlay click close it; closing restores focus to the trigger.
- The Sheet has a visible title, optional description, and explicit close control.
- Background content becomes inert and is not screen-reader navigable while open.
- Destructive or failure framing is prohibited.

Unified Player contents:

- Navigation Tree, including unit state labels.
- Finish Anyway whenever the existing session contract permits it.
- Secondary recovery actions belonging to Navigation Tree or Finish requests.
- Future secondary tools only after they independently satisfy Atomic Focus review.

The Sheet must not:

- Duplicate Player state.
- Mark units completed or skipped itself.
- Call an adapter or repository.
- Add a confirmation gate before Finish Anyway.
- Become a general dumping ground for unrelated product navigation.

#### 3.5 Supporting Primitive: `TherapeuticBanner`

- Banners provide concise status or supporting context.
- A banner may be internally scrollable only when authored text exceeds its allocated bound.
- Status copy is positive and non-blocking.
- Confirmation banners use Sage; inquiry and recovery banners use Lavender.
- Banners do not animate repeatedly after entering.

### Layer 4: Patterns

#### 4.1 Atomic Guidance Pattern

- Stable `TherapeuticFrame` header with title, progress, and utility Sheet trigger.
- One `HorizontalSlideContainer` in the stage.
- One active `TherapeuticContentCard` containing Atomic Unit Structured Markdown.
- Zero direct actions for a regular Atomic Unit in the current Player model.
- Navigation Tree movement is requested from the Sheet and reflected through the slide container.

#### 4.2 Binary Inquiry Pattern

- One reflection-toned question card.
- Exactly two equal direct actions, such as Yes and No.
- Selection uses text, pressed semantics, and a visible selection mark.
- Supporting copy appears in no more than one status banner.
- Sovereign bypass remains in the Sheet.

#### 4.3 Terminal NEMAR Pattern

Before a response:

- Main card asks the canonical Terminal NEMAR question.
- Main actions are Yes and No.
- Finish Anyway is available in the Sheet.

After Yes:

- A calm confirmation banner states that Finish is available.
- Main actions become Finish and Change response.
- Change response returns the main action row to Yes and No without changing engine state until a new
  response is selected.
- Finish Anyway remains available in the Sheet.

After No:

- A reflection banner states that the session is Integrating.
- The only main action is Change response.
- Finish Anyway remains available in the Sheet without added confirmation.

This progressive disclosure preserves two direct actions while retaining the existing ability to answer,
revise, Finish after Yes, or Finish Anyway regardless of response.

#### 4.4 Recovery Pattern

- Preserve the last trustworthy reflected content when possible.
- Show one recovery banner using positive language.
- Offer no more than two direct actions: retry and a safe alternate path.
- Keep utility actions in the Sheet when the Player session is still valid.
- Never display Failed, Error, Invalid, or incomplete-as-failure language to the EM.

#### 4.5 Loading Pattern

- Reserve the final card geometry to prevent layout jumps.
- Use a quiet textual status or restrained skeleton.
- Do not slide from resolving to ready unless the active domain key changed.
- Loading has no action unless the existing async seam enters recovery.

### Layer 5: Interaction Rules

#### 5.1 Viewport and Scrolling

1. The document and frame never scroll vertically or horizontally.
2. Long Atomic Unit content scrolls only inside its content card.
3. Long banner copy scrolls only inside that banner.
4. Sheet content scrolls only inside the Sheet.
5. Scroll chaining from card or Sheet to the body is blocked.
6. Route or unit changes reset the newly active card to its top unless a revisit policy is later specified.
7. Opening and closing the Sheet does not reset the active card's scroll position.
8. Browser zoom up to 200 percent must preserve access through internal scrolling.

#### 5.2 Horizontal Navigation

1. Macro screen and step changes use the horizontal slide primitive.
2. Forward and backward direction follows ordered screen or unit identity.
3. A Navigation Tree selection closes the Sheet only after the action resolves successfully.
4. If the action needs recovery, the Sheet remains open and presents the retry near the relevant utility.
5. No swipe, drag, wheel, or hidden edge gesture changes a Player unit.
6. No manual Back, Skip, or Done control is introduced.

#### 5.3 Action and Banner Budgets

1. Main content has no more than two direct action controls.
2. Main content has no more than two banners or cards; the active content card counts as one.
3. A modal Sheet is a separate frame while open and may contain the Navigation Tree list.
4. Sheet sections remain grouped and sparse even though tree item count is domain-driven.
5. Recovery controls replace or occupy action slots; they do not append an unbounded row.
6. Authored Markdown links are content references and must not be styled as competing primary actions.

#### 5.4 Focus and Accessibility

1. Initial render focuses nothing automatically.
2. User-initiated step movement focuses the incoming heading after motion completes.
3. Reduced-motion movement focuses immediately after the DOM replacement.
4. Sheet focus is trapped and restored according to Dialog semantics.
5. Focus rings are never removed.
6. Color is never the only selected, pressed, Integrating, or completed indicator.
7. Every icon-only control has an accessible name.
8. Touch targets remain at least 44 by 44 pixels.
9. Heading levels remain ordered across frame, card, and Sheet.
10. Status announcements are polite and concise.

#### 5.5 Direction and Localization

- Use CSS logical properties and document direction.
- Forward means inline-forward, not hardcoded right-to-left geometry.
- In left-to-right mode, forward content enters from the right and exits left.
- In right-to-left mode, this geometry reverses.
- English copy remains in scope for the proof of concept; token and primitive architecture must not block
  Hebrew localization.

#### 5.6 Motion Restraint

- Animate only changes that communicate location, hierarchy, or state.
- Hover motion is limited to color, border, or at most two pixels of translation.
- Pressed motion must not imply success before an async action resolves.
- Repeated recovery attempts do not replay decorative entrance motion.
- Background gradients remain static.

## Proof-of-Concept Refactoring Plan: Unified Player

The Unified Player is the baseline because it exercises long content, ordered units, the Navigation Tree,
Terminal NEMAR, Finish, Finish Anyway, loading, recovery, and engine-reflected state in one web subtree.

### Step 1: Establish the Visual Toolchain

1. Add Tailwind v4, the Vite integration, Motion, Radix Dialog, and the minimal local shadcn/ui utilities to
   `pic-web`.
2. Update only `pic-web` package configuration and the root lockfile.
3. Add the Tailwind entry stylesheet and import it from the web entry point.
4. Confirm build, typecheck, dependency-cruiser, and existing tests before visual refactoring.

### Step 2: Add Tokens and Global Viewport Normalization

1. Declare all color, type, space, shape, focus, gradient, and motion tokens.
2. Normalize `html`, `body`, and `#root` to full size with no margin.
3. Lock overflow only when the therapeutic app root is mounted.
4. Add reduced-motion rules and safe-area support.
5. Verify token contrast before adopting action combinations.

### Step 3: Build and Verify Primitives

1. Implement `TherapeuticFrame` and `TherapeuticContentCard`.
2. Implement `HorizontalSlideContainer`.
3. Implement descriptor-driven `AtomicActionLayout`.
4. Generate and constrain the local shadcn/ui Sheet as `TherapeuticSheet`.
5. Implement `TherapeuticBanner`.
6. Add primitive-level accessibility and contract tests before integrating a screen.

### Step 4: Compose the Unified Player Frame

1. Wrap resolving, recovery, active-unit, and Terminal NEMAR phases in one stable `TherapeuticFrame`.
2. Keep the existing content-resolution seam and engine subscriptions unchanged.
3. Derive active unit order from the existing session snapshot.
4. Key the slide container by the active unit's stable `unit_id`.
5. Render only the active Atomic Unit or Terminal NEMAR in the stage.
6. Preserve all existing domain test selectors.

### Step 5: Bound Atomic Unit Content

1. Place the Structured Markdown title and body in `TherapeuticContentCard`.
2. Make only that card vertically scrollable.
3. Constrain prose measure and responsive type.
4. Wrap wide GFM tables in a card-local horizontal scroller.
5. Keep rationale hidden because rationale affordance work is not part of this wave.
6. Do not alter parsing, cache, content fetching, or unit state.

### Step 6: Move Player Utilities into the Sheet

1. Place the Navigation Tree in the Sheet and preserve every existing `jumpTo` call.
2. Place Finish Anyway in the Sheet and preserve `SessionEngine.onFinishRequested`.
3. Keep Navigation Tree and finish recovery copy near their originating Sheet controls.
4. Close the Sheet after a successful tree selection; keep it open when retry is needed.
5. Ensure Finish Anyway is available for null, Yes, and No Terminal NEMAR responses.
6. Remove the always-visible navigation list and Finish Anyway button from the main frame only after the
   Sheet path is tested.

### Step 7: Apply the Terminal NEMAR Pattern

1. Render Yes and No through the two-slot action layout before a response.
2. Continue calling the existing `respondTerminalNemar` action.
3. Derive confirmation and Integrating banners from the reflected response.
4. For Yes, expose Finish and Change response in the main frame.
5. For No, expose Change response in the main frame.
6. Keep Finish Anyway in the Sheet with no new validation or confirmation.
7. Preserve positive copy and all current `aria-pressed` semantics while the response choices are visible.

### Step 8: Integrate Horizontal Motion

1. Animate only after the active reflected unit changes.
2. Infer direction from the stable session unit ordering.
3. Treat unknown order as a neutral replacement.
4. Move focus to the incoming unit heading after user-initiated navigation.
5. Disable translation under reduced motion.
6. Verify that Sheet opening, response selection, and async retries do not falsely animate a unit change.

### Step 9: Verify and Harden

1. Run all existing unit and integration tests without changing engine or adapter tests.
2. Add high-seam Unified Player tests for Sheet access, action budgets, response progression, and preserved
   action calls.
3. Add real-browser tests for viewport lock and card-local scrolling.
4. Run typecheck, build, dependency-cruiser, lint, and max-line-length checks.
5. Inspect phone, tablet, desktop, zoomed, reduced-motion, keyboard, and right-to-left geometry.
6. Stop the Wave 10 proof of concept at the Unified Player; record any primitive changes needed before
   migrating another screen.

## Testing Decisions

### Testing Philosophy

- Test observable behavior at the highest practical seam.
- Prefer `UnifiedPlayerScreen` tests for composed behavior and primitive tests only for reusable contracts.
- Do not assert private Motion internals, component hook state, or exact generated class strings.
- Use jsdom for semantics and action routing.
- Use a real browser for geometry, overflow, focus trapping, and reduced-motion behavior.
- Existing tests are regression assets. Visual refactoring must not weaken or delete assertions to obtain a
  green suite.

### Primitive Contract Tests

`TherapeuticFrame`:

- Exposes one named frame and one stage.
- Provides a named internal content region.
- Opens the utility Sheet from the header and restores trigger focus on close.
- Applies direction-aware Sheet placement.

`HorizontalSlideContainer`:

- Renders only the active child as interactive.
- Reports forward, backward, and neutral changes from controlled keys.
- Moves focus only after user-initiated changes.
- Removes translation under reduced-motion preference.
- Does not expose swipe or drag handlers.

`AtomicActionLayout`:

- Renders zero, one, or two actions.
- Renders zero, one, or two banners.
- Compile-time fixtures reject three actions and three banners.
- Button, link, disabled, and pressed semantics are preserved.
- Narrow layouts preserve action order.

`TherapeuticSheet`:

- Has Dialog title and description semantics.
- Traps focus, closes by Escape, and restores trigger focus.
- Makes background content inert while open.
- Scrolls internally when Navigation Tree content exceeds its height.

### Unified Player Integration Tests

- Resolving content shows the stable frame without Active Player controls.
- Empty or unavailable content preserves the Zero-H3 guard and offers no Finish path.
- An Atomic Unit renders title and real Structured Markdown inside the content card.
- Navigation Tree controls are absent from the main frame and present in the Sheet.
- Selecting a future or prior unit still calls `jumpTo` with the same session and unit identifiers.
- A successful reflected unit change updates the active slide key.
- Terminal NEMAR with no response exposes exactly Yes and No in the main action region.
- A Yes response exposes Finish and Change response in the main action region.
- A No response shows Integrating and keeps Finish unavailable in the main frame.
- Finish Anyway is present and enabled in the Sheet for null, Yes, and No responses.
- Finish and Finish Anyway still route through `SessionEngine.onFinishRequested`, never raw Finish methods.
- The Player subtree still contains zero rating controls.
- Recovery copy contains none of the prohibited failure terms.
- Promotion replay and discard still unmount the Player subtree as existing tests require.

### Browser Layout Tests

Run representative viewports at approximately:

- 320 by 568 compact phone.
- 390 by 844 modern phone.
- 768 by 1024 tablet.
- 1440 by 900 desktop.

Assert:

- The document's scroll dimensions do not exceed its viewport dimensions.
- The active frame equals the dynamic viewport.
- Oversized Atomic Unit content has greater scroll height than client height and can scroll internally.
- Header, action region, and Sheet trigger remain visible while the card scrolls.
- Wide Markdown tables scroll inside their wrapper without widening the frame.
- Sheet content scrolls without moving the document.
- Safe-area padding prevents controls from touching simulated device cutouts.
- At 200 percent zoom, content and controls remain reachable.
- Reduced-motion mode produces no horizontal transform.

### Regression and Boundary Checks

- All existing 255-plus unit and integration tests remain green.
- New Wave 10 tests pass.
- `pic-web` typecheck and production build pass.
- Dependency-cruiser reports zero violations.
- Repository-wide CI passes.
- Max line length remains at or below 130 characters for every changed source and test file.
- A changed-file check confirms that only `packages/pic-web` and root `package-lock.json` changed.
- A source scan confirms no visual dependency was added to `pic-engine` or adapter packages.

## Acceptance Criteria

1. Tailwind, Motion, and the local shadcn/ui Sheet are used only by `pic-web`.
2. Root `package-lock.json` is the only changed file outside `packages/pic-web`.
3. No `pic-engine`, adapter, migration, or core test file changes.
4. `TherapeuticFrame`, `HorizontalSlideContainer`, and `AtomicActionLayout` are independently reusable.
5. The adopted frame is locked to `100dvh` and `100vw` with no document scrolling.
6. Long Atomic Unit content scrolls only inside its card.
7. Unit changes animate horizontally with correct forward and backward direction.
8. Reduced-motion users receive no horizontal translation.
9. Main Player content never exposes more than two direct actions.
10. Main Player content never exposes more than two cards or banners.
11. Navigation Tree and Finish Anyway are available in the accessible utility Sheet.
12. Terminal NEMAR preserves Yes, No, Integrating, Finish, answer revision, and Finish Anyway semantics.
13. No visual primitive owns or duplicates domain state.
14. Existing action calls, state transitions, test selectors, and positive recovery language remain intact.
15. Existing and new test suites, typecheck, build, dependency checks, and line-length checks pass.

## Out of Scope

- Any change to `pic-engine`, its state machines, types, actions, or tests.
- Any change to repository ports, adapters, Supabase, migrations, promotion, or persistence.
- New Player navigation methods, including swipe, drag, Back, Skip, or Done.
- Changes to Structured Markdown parsing or content snapshots.
- Unit rationale disclosure.
- Blind-rating UI or symptom-rating behavior.
- Full visual migration of every Guest Mode screen.
- Dark mode, user-selectable themes, or a public theming API.
- Final Hebrew copy or localization delivery, although logical-direction support is required.
- New completion celebrations, gamification, streaks, or pressure-oriented progress.
- A broad shadcn/ui component library installation.
- Redesign of authentication or the Persistence Gate.
- Changes to authored treatment content.

## Further Notes

- The Sheet decision resolves the apparent conflict between a two-choice therapeutic frame and the need for
  sovereign utilities. It must remain easy to discover, keyboard accessible, and consistently located.
- Light Sage and Soft Lavender are surface identities. Darker members of the same color families are
  necessary for accessible text and controls; using pale colors for text would not meet the design goal.
- `100dvh` is the primary mobile viewport unit. The fallback exists for compatibility, not as a second
  layout mode.
- Smooth internal scrolling refers to touch and wheel behavior. Programmatic smooth scrolling must be
  disabled under reduced motion.
- Horizontal animation communicates movement but never performs domain movement. The engine snapshot is
  always authoritative.
- The current test baseline could not be independently re-run during specification authoring because the
  sandbox could not read the local environment file. This does not alter the implementation requirement:
  establish a green baseline in the normal development environment before the first Wave 10 code change.
- This specification is complete for implementation and requires no `pic-engine` design follow-up.
