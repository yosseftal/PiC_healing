import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "../src/app-providers";
import { compositionRoot } from "../src/composition-root";
import { useGuestFlowFacts } from "../src/guest-flow-context";
import { TreatmentPickerScreen } from "../src/TreatmentPickerScreen";
import { UnifiedPlayerScreen } from "../src/UnifiedPlayerScreen";
import { GuestModeShell } from "../src/GuestModeShell";
import { GuestFlowRouter } from "../src/guest-flow-router";
import "../src/visual-foundation/visual-foundation.css";

const root = document.getElementById("root");
if (root === null) throw new Error("Content fixture needs #root");
const params = new URLSearchParams(location.search);
if (params.get("mode") !== "flow") {
  localStorage.setItem("pic-web.locale.v1", params.get("locale") === "en" ? "en" : "he");
}
const catalog = await compositionRoot.catalogActions.listTreatments();
const target = catalog[params.get("treatment") === "grounding" ? 1 : 0]!;
root.dataset.treatmentId = target.id;
const readTreatment = compositionRoot.repositoryPort.getTreatment.bind(compositionRoot.repositoryPort);
let reads = 0;
compositionRoot.repositoryPort.getTreatment = async (id) => {
  root.dataset.sourceReads = String(++reads);
  const source = await readTreatment(id);
  if (source === null || id !== target.id || params.get("mode") !== "stale") return source;
  return { ...source, structured_markdown: source.structured_markdown.replace("three slow breaths", "four slow breaths") };
};
if (params.get("mode") === "unavailable") {
  const canonical = await compositionRoot.treatmentContentActions.getParsedTreatmentContent(target.id);
  compositionRoot.treatmentContentActions.getParsedTreatmentContent = async () => canonical.map((unit, index) =>
    index === 0 ? { ...unit, unit_content: "Personal edited guidance <script>unsafe()</script>" } : unit);
}

// Observe the public mutation actions while delegating every call to the real engines.
const actions: string[] = [];
root.dataset.actions = "[]";
for (const boundary of [compositionRoot.groupEngineActions, compositionRoot.playerEngineActions,
  compositionRoot.sessionEngineActions]) {
  for (const key of Object.keys(boundary)) {
    if (key === "getGroup" || key === "hasPriorRating") continue;
    const original = Object.getOwnPropertyDescriptor(boundary, key)!.value as (...args: never[]) => unknown;
    Object.assign(boundary, { [key]: (...args: never[]) => {
      actions.push(key);
      root.dataset.actions = JSON.stringify(actions);
      return original(...args);
    } });
  }
}

function ContentFixture() {
  const { activePlayerSessionId } = useGuestFlowFacts();
  useEffect(() => {
    if (activePlayerSessionId === null || root === null) return;
    const reflect = () => {
      root.dataset.session = JSON.stringify(compositionRoot.playerSessionStore.getSnapshot(activePlayerSessionId));
    };
    reflect();
    return compositionRoot.playerSessionStore.subscribe(reflect);
  }, [activePlayerSessionId]);
  return <GuestModeShell>{params.get("mode") === "flow" ? <GuestFlowRouter />
    : activePlayerSessionId === null ? <TreatmentPickerScreen /> : <UnifiedPlayerScreen />}</GuestModeShell>;
}

createRoot(root).render(<AppProviders><ContentFixture /></AppProviders>);
