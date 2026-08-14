/**
 * Blind-by-default rating widget (Ticket 08-05, DEC-011). Renders polarity + intensity inputs and a Reveal
 * affordance when `hasPriorRating` resolves true — never pre-fills prior values into the inputs.
 */
import { useEffect, useState, type ReactNode } from "react";
import type { Intensity, Polarity } from "pic-engine";
import { useGroupEngineActions } from "./group-engine-context";

export interface RatingControlProps {
  symptomId: string | null;
  polarity: Polarity;
  intensity: Intensity;
  onPolarityChange: (polarity: Polarity) => void;
  onIntensityChange: (intensity: Intensity) => void;
}

export function RatingControl({
  symptomId,
  polarity,
  intensity,
  onPolarityChange,
  onIntensityChange,
}: RatingControlProps): ReactNode {
  const { hasPriorRating, revealPriorRating } = useGroupEngineActions();
  const [showRevealAffordance, setShowRevealAffordance] = useState(false);
  const [revealedPrior, setRevealedPrior] = useState<{ polarity: Polarity; intensity: Intensity } | null>(
    null,
  );

  useEffect(() => {
    if (symptomId === null) {
      setShowRevealAffordance(false);
      setRevealedPrior(null);
      return;
    }

    let cancelled = false;
    void hasPriorRating(symptomId).then((hasPrior) => {
      if (!cancelled) {
        setShowRevealAffordance(hasPrior);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hasPriorRating, symptomId]);

  function revealPrior(): void {
    if (symptomId === null) {
      return;
    }
    void revealPriorRating(symptomId).then((prior) => {
      setRevealedPrior(prior);
    });
  }

  return (
    <fieldset data-testid="rating-control">
      <legend>Rate this symptom</legend>

      <label>
        Polarity
        <select
          aria-label="Polarity"
          value={polarity}
          onChange={(event) => onPolarityChange(event.target.value as Polarity)}
        >
          <option value="negative">Negative</option>
          <option value="positive">Positive</option>
        </select>
      </label>

      <label>
        Intensity
        <input
          aria-label="Intensity"
          type="range"
          min={0}
          max={10}
          step={1}
          value={intensity}
          onChange={(event) => onIntensityChange(Number(event.target.value) as Intensity)}
        />
        <span data-testid="rating-intensity-value">{intensity}</span>
      </label>

      {showRevealAffordance ? (
        <button type="button" data-testid="reveal-prior-rating" onClick={revealPrior}>
          Reveal prior rating
        </button>
      ) : null}

      {revealedPrior !== null ? (
        <p data-testid="revealed-prior-rating">
          Prior: {revealedPrior.polarity}, {revealedPrior.intensity}/10
        </p>
      ) : null}
    </fieldset>
  );
}
