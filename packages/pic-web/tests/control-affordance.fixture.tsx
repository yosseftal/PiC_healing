import { createRoot } from "react-dom/client";
import { AppProviders } from "../src/app-providers";
import { SymptomGroupCreateScreen } from "../src/SymptomGroupCreateScreen";
import { TreatmentPickerScreen } from "../src/TreatmentPickerScreen";
import "../src/visual-foundation/visual-foundation.css";

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error("Control fixture requires #root");
createRoot(rootElement).render(
  <AppProviders>
    <SymptomGroupCreateScreen />
    <TreatmentPickerScreen />
  </AppProviders>,
);
