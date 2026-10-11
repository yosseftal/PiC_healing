import { createRoot } from "react-dom/client";
import { parseStructuredMarkdown, TRACER_BULLET_SEED_TREATMENTS } from "pic-engine";
import { AppProviders } from "../src/app-providers";
import { compositionRoot } from "../src/composition-root";
import { GuestModeShell } from "../src/GuestModeShell";
import { UnifiedPlayerScreen } from "../src/UnifiedPlayerScreen";
import "../src/visual-foundation/visual-foundation.css";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Unified Player fixture requires #root");
}

// Legacy layout cases declare a locale explicitly; real selector cases leave browser preference authoritative.
const directionFixture = new URLSearchParams(location.search).get("direction");
if (directionFixture !== null) {
  localStorage.setItem("pic-web.locale.v1", directionFixture === "rtl" ? "he" : "en");
}

const longGuidance = Array.from(
  { length: 80 },
  (_, index) => `Pause ${index + 1}. Notice the ground beneath your feet and continue when ready.`,
).join("\n\n");
const rtlSource = new URLSearchParams(location.search).get("sourceDirection") === "rtl";
const columns = Array.from({ length: 12 }, (_, index) => rtlSource
  ? `פרט_טיפולי_${index + 1}_בהנחיה_אישית` : `Treatment_detail_${index + 1}_unbroken`);
const table = [
  `| ${columns.join(" | ")} |`,
  `| ${columns.map(() => "---").join(" | ")} |`,
  `| ${columns.join(" | ")} |`,
].join("\n");
const optionalSteps = Array.from(
  { length: 20 },
  (_, index) => `### Optional reflection ${index + 1}\n\nNotice one small change before continuing.`,
);
const markdown = [
  "### Long guidance",
  longGuidance,
  "### Guidance table",
  table,
  "### Closing reflection",
  "Notice how you feel before deciding what comes next.",
  ...optionalSteps,
].join("\n\n");
const units = parseStructuredMarkdown(markdown);
const phase = new URLSearchParams(location.search).get("phase");
const pendingContent = new Promise<void>((resolve) => {
  window.addEventListener("fixture-release-content", () => resolve(), { once: true });
});
compositionRoot.treatmentContentActions.getParsedTreatmentContent = async () => {
  if (phase === "resolving") await pendingContent;
  if (phase === "empty") return [];
  if (phase === "recovery" || phase === "recovery-empty") throw new Error("Guidance is reconnecting");
  return units;
};

await compositionRoot.playerEngineActions.startSession(
  TRACER_BULLET_SEED_TREATMENTS[0]!.id,
  null,
  phase === "empty" || phase === "recovery-empty" ? [] : units.map((unit) => unit.unit_id),
);

createRoot(rootElement).render(
  <AppProviders>
    <GuestModeShell><UnifiedPlayerScreen /></GuestModeShell>
  </AppProviders>,
);
