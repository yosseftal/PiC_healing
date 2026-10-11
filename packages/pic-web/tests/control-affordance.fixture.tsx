import { createRoot } from "react-dom/client";
import { AppProviders } from "../src/app-providers";
import { SymptomGroupCreateScreen } from "../src/SymptomGroupCreateScreen";
import { TreatmentPickerScreen } from "../src/TreatmentPickerScreen";
import "../src/visual-foundation/visual-foundation.css";

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error("Control fixture requires #root");
localStorage.setItem("pic-web.locale.v1", "en");
const pickerStage = new URLSearchParams(location.search).get("stage") === "picker";
createRoot(rootElement).render(
  <AppProviders>
    {pickerStage ? <TreatmentPickerScreen /> : <SymptomGroupCreateScreen />}
  </AppProviders>,
);
