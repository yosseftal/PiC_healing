import { useState } from "react";
import { createRoot } from "react-dom/client";
import type { Intensity, Polarity } from "pic-engine";
import { AppProviders } from "../src/app-providers";
import { compositionRoot } from "../src/composition-root";
import { RatingControl } from "../src/RatingControl";
import { SymptomGroupCreateScreen } from "../src/SymptomGroupCreateScreen";
import { useLocale } from "../src/i18n/locale-provider";
import { TherapeuticContentCard } from "../src/therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "../src/therapeutic-frame/TherapeuticScreenFrame";
import "../src/visual-foundation/visual-foundation.css";

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error("Symptom fixture requires #root");
const params = new URLSearchParams(location.search);
localStorage.setItem("pic-web.locale.v1", params.get("locale") === "en" ? "en" : "he");
let symptomId: string | null = null;
if (params.get("stage") === "prior") {
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("גב Back");
  symptomId = await compositionRoot.groupEngineActions.addSymptom(groupId, "צוואר Neck");
  await compositionRoot.groupEngineActions.rate(symptomId, { polarity: "positive", intensity: 8 });
}

// Observe the existing public action boundary after fixture setup, without replacing engine behavior.
let calls = 0;
rootElement.dataset.actionCalls = "0";
for (const key of ["createDraftGroup", "addSymptom", "rate", "revealPriorRating"] as const) {
  const original = compositionRoot.groupEngineActions[key];
  const observed = (...args: never[]) => {
    rootElement.dataset.actionCalls = String(++calls);
    return (original as (...values: never[]) => unknown)(...args);
  };
  Object.assign(compositionRoot.groupEngineActions, { [key]: observed });
}

function PriorScreen({ id }: { id: string }) {
  const { message } = useLocale();
  const [polarity, setPolarity] = useState<Polarity>("negative");
  const [intensity, setIntensity] = useState<Intensity>(3);
  return <TherapeuticScreenFrame title={message("rating.legend").text} stageLabel={message("group.stage").text}>
    <TherapeuticContentCard aria-label={message("group.card").text}>
      <div className="pic-symptom-form">
        <RatingControl symptomId={id} polarity={polarity} intensity={intensity}
          onPolarityChange={setPolarity} onIntensityChange={setIntensity} />
      </div>
    </TherapeuticContentCard>
  </TherapeuticScreenFrame>;
}

createRoot(rootElement).render(<AppProviders>
  {symptomId === null ? <SymptomGroupCreateScreen /> : <PriorScreen id={symptomId} />}
</AppProviders>);
