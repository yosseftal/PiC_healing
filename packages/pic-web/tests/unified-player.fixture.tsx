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

document.documentElement.dir = new URLSearchParams(location.search).get("direction") === "rtl" ? "rtl" : "ltr";

const longGuidance = Array.from(
  { length: 80 },
  (_, index) => `Pause ${index + 1}. Notice the ground beneath your feet and continue when ready.`,
).join("\n\n");
const columns = Array.from({ length: 12 }, (_, index) => `Treatment_detail_${index + 1}_unbroken`);
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
compositionRoot.treatmentContentActions.getParsedTreatmentContent = async () => units;

await compositionRoot.playerEngineActions.startSession(
  TRACER_BULLET_SEED_TREATMENTS[0]!.id,
  null,
  units.map((unit) => unit.unit_id),
);

createRoot(rootElement).render(
  <AppProviders>
    <GuestModeShell><UnifiedPlayerScreen /></GuestModeShell>
  </AppProviders>,
);
