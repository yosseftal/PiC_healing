import { createRoot } from "react-dom/client";
import { AppProviders } from "../src/app-providers";
import { compositionRoot } from "../src/composition-root";
import { SymptomGroupSummaryScreen } from "../src/SymptomGroupSummaryScreen";
import "../src/visual-foundation/visual-foundation.css";

const locale = new URLSearchParams(location.search).get("locale") === "en" ? "en" : "he";
localStorage.setItem("pic-web.locale.v1", locale);
const actions = compositionRoot.groupEngineActions;
const id = await actions.createDraftGroup("");
const zero = await actions.addSymptom(id, "נשימה רגועה ושקטה לאורך היום Quiet and easy breathing throughout the day");
await actions.rate(zero, { polarity: "positive", intensity: 0 });
const negative = await actions.addSymptom(id, "הצוואר והגב העליון Upper back and neck");
await actions.rate(negative, { polarity: "negative", intensity: 8 });
const positive = await actions.addSymptom(id, "שינה ומנוחה Rest and sleep");
await actions.rate(positive, { polarity: "positive", intensity: 4 });
await actions.addSymptom(id, "נושא חדש New topic");
await actions.setJointTreatmentMuscleTest(id, "together");
await actions.finalizeGroup(id);
createRoot(document.getElementById("root")!).render(
  <AppProviders><SymptomGroupSummaryScreen groupId={id} /></AppProviders>,
);
