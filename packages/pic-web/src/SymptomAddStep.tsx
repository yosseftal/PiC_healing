/**
 * Repeatable single-symptom add + rate step (Ticket 08-05). One symptom per pass; `RatingControl` lives here
 * only.
 */
import { useState, type FormEvent, type ReactNode } from "react";
import type { Intensity, Polarity } from "pic-engine";
import { useGroupEngineActions } from "./group-engine-context";
import { RatingControl } from "./RatingControl";

export interface SymptomAddStepProps {
  groupId: string;
  onSymptomAdded?: () => void;
}

export function SymptomAddStep({ groupId, onSymptomAdded }: SymptomAddStepProps): ReactNode {
  const { addSymptom, rate } = useGroupEngineActions();
  const [symptomName, setSymptomName] = useState("");
  const [polarity, setPolarity] = useState<Polarity>("negative");
  const [intensity, setIntensity] = useState<Intensity>(5);
  const [stepKey, setStepKey] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedName = symptomName.trim();
    if (trimmedName.length === 0) {
      return;
    }

    const symptomId = await addSymptom(groupId, trimmedName);
    await rate(symptomId, { polarity, intensity });
    setSymptomName("");
    setPolarity("negative");
    setIntensity(5);
    setStepKey((current) => current + 1);
    onSymptomAdded?.();
  }

  return (
    <form data-testid="symptom-add-step" onSubmit={(event) => void handleSubmit(event)}>
      <label>
        Symptom name
        <input
          aria-label="Symptom name"
          value={symptomName}
          onChange={(event) => setSymptomName(event.target.value)}
        />
      </label>

      <RatingControl
        key={stepKey}
        symptomId={null}
        polarity={polarity}
        intensity={intensity}
        onPolarityChange={setPolarity}
        onIntensityChange={setIntensity}
      />

      <button type="submit" data-testid="add-symptom-action">
        Add symptom
      </button>
    </form>
  );
}
