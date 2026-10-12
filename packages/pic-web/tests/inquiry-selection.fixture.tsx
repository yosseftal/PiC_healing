import { createRoot } from "react-dom/client";
import { AppProviders } from "../src/app-providers";
import { compositionRoot } from "../src/composition-root";
import { GuestFlowRouter } from "../src/guest-flow-router";
import { setGuestFlowSummaryAcknowledged, setGuestFlowSymptomAdditionComplete } from "../src/guest-flow-facts";
import "../src/visual-foundation/visual-foundation.css";

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error("Inquiry fixture requires #root");
const params = new URLSearchParams(location.search);
localStorage.setItem("pic-web.locale.v1", params.get("locale") === "en" ? "en" : "he");
const groupId = await compositionRoot.groupEngineActions.createDraftGroup("גב <b>Back</b> 123");
rootElement.dataset.groupId = groupId;
for (let index = 0; index < (params.get("stage") === "summary" ? 30 : 1); index++) {
  const personalName = `צוואר Neck ${index + 1}` +
    (params.get("stage") === "summary" ? " — תחושה אישית Personal sensation".repeat(4) : "");
  const symptomId = await compositionRoot.groupEngineActions.addSymptom(groupId, personalName);
  await compositionRoot.groupEngineActions.rate(symptomId, { polarity: "positive", intensity: 7 });
}
setGuestFlowSymptomAdditionComplete(true);
if (params.get("stage") !== "joint") {
  await compositionRoot.groupEngineActions.setJointTreatmentMuscleTest(groupId, "together");
  await compositionRoot.groupEngineActions.finalizeGroup(groupId);
}
if (params.get("stage") === "picker") {
  setGuestFlowSummaryAcknowledged(true);
  const catalog = await compositionRoot.catalogActions.listTreatments();
  const target = catalog[2]!;
  rootElement.dataset.treatmentId = target.id;
  rootElement.dataset.unitIds = JSON.stringify(
    (await compositionRoot.treatmentContentActions.getParsedTreatmentContent(target.id)).map((unit) => unit.unit_id),
  );
  compositionRoot.catalogActions.listTreatments = async () => [
    ...catalog,
    ...Array.from({ length: 20 }, (_, index) => ({
      id: `catalog-fixture-${index}`, title: "מקור Source 123 ".repeat(8),
    })),
  ];
}

// Observe the existing action seam after setup, preserving real engine behavior and payloads.
let calls = 0;
rootElement.dataset.actionCalls = "0";
for (const key of ["setJointTreatmentMuscleTest", "finalizeGroup"] as const) {
  const original = compositionRoot.groupEngineActions[key];
  Object.assign(compositionRoot.groupEngineActions, { [key]: (...args: never[]) => {
    rootElement.dataset.actionCalls = String(++calls);
    return (original as (...values: never[]) => unknown)(...args);
  } });
}
const startSession = compositionRoot.playerEngineActions.startSession;
compositionRoot.playerEngineActions.startSession = (...args) => {
  rootElement.dataset.actionCalls = String(++calls);
  rootElement.dataset.startPayload = JSON.stringify(args);
  return startSession(...args);
};
createRoot(rootElement).render(<AppProviders><GuestFlowRouter /></AppProviders>);
