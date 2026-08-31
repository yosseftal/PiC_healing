/**
 * Repeatable single-symptom add + rate step (Ticket 08-05). One symptom per pass; `RatingControl` lives here
 * only.
 */
import { useState, type FormEvent, type ReactNode } from "react";
import type { Intensity, Polarity } from "pic-engine";
import { useGroupEngineActions } from "./group-engine-context";
import { RatingControl } from "./RatingControl";
import { useAsyncAction } from "./use-async-action";

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
  const {
    status: ratingStatus,
    run: saveRating,
    retry: retryRating,
  } = useAsyncAction(
    async (symptomId: string, rating: { polarity: Polarity; intensity: Intensity }) => {
      await rate(symptomId, rating);
      setSymptomName("");
      setPolarity("negative");
      setIntensity(5);
      setStepKey((current) => current + 1);
      onSymptomAdded?.();
    },
  );
  const {
    status: additionStatus,
    run: addAndRateSymptom,
    retry: retryAddition,
  } = useAsyncAction(
    async (
      requestedGroupId: string,
      name: string,
      rating: { polarity: Polarity; intensity: Intensity },
    ) => {
      const symptomId = await addSymptom(requestedGroupId, name);
      await saveRating(symptomId, rating);
    },
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmedName = symptomName.trim();
    if (trimmedName.length === 0) {
      return;
    }

    void addAndRateSymptom(groupId, trimmedName, { polarity, intensity });
  }

  return (
    <form data-testid="symptom-add-step" onSubmit={handleSubmit}>
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
      {additionStatus === "recovery" || ratingStatus === "recovery" ? (
        <div role="status">
          <p>Your symptom is ready for another try.</p>
          <button
            type="button"
            onClick={() => void (ratingStatus === "recovery" ? retryRating() : retryAddition())}
          >
            Try saving this symptom again
          </button>
        </div>
      ) : null}
    </form>
  );
}
