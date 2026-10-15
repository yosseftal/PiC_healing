import { createRoot } from "react-dom/client";
import { TRACER_BULLET_SEED_TREATMENTS } from "pic-engine";
import { App } from "../src/App";
import { compositionRoot } from "../src/composition-root";
import { settleGuestFlowPersistence } from "../src/guest-flow-facts";
import "../src/visual-foundation/visual-foundation.css";

const locale = new URLSearchParams(location.search).get("locale") === "he" ? "he" : "en";
localStorage.setItem("pic-web.locale.v1", locale);
if (!compositionRoot.sessionEngineStore.getSnapshot().gateTriggered) {
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("Original inquiry");
  const symptomId = await compositionRoot.groupEngineActions.addSymptom(groupId, "Original symptom");
  await compositionRoot.groupEngineActions.rate(symptomId, { polarity: "negative", intensity: 7 });
  await compositionRoot.groupEngineActions.setJointTreatmentMuscleTest(groupId, "together");
  await compositionRoot.groupEngineActions.finalizeGroup(groupId);
  const treatmentId = TRACER_BULLET_SEED_TREATMENTS[0]!.id;
  const sessionId = await compositionRoot.playerEngineActions.startSession(treatmentId, groupId, ["one", "two"]);
  await compositionRoot.playerEngineActions.jumpTo(sessionId, "two");
  await compositionRoot.playerEngineActions.respondTerminalNemar(sessionId, "no");
  await compositionRoot.sessionEngineActions.onFinishRequested(sessionId, "finishAnyway");
  await settleGuestFlowPersistence();
}
createRoot(document.getElementById("root")!).render(<App />);
