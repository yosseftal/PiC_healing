/**
 * Blind-by-default rating widget (Ticket 08-05, DEC-011). Renders polarity + intensity inputs and a Reveal
 * affordance when `hasPriorRating` resolves true — never pre-fills prior values into the inputs.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Intensity, Polarity } from "pic-engine";
import { useGroupEngineActions } from "./group-engine-context";
import { CONTROL_FOCUS, INPUT_CONTROL, UTILITY_CONTROL } from "./control-affordance";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";

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
  const { message, locale } = useLocale();
  const { hasPriorRating, revealPriorRating } = useGroupEngineActions();
  const [showRevealAffordance, setShowRevealAffordance] = useState(false);
  const [revealedPrior, setRevealedPrior] = useState<{ polarity: Polarity; intensity: Intensity } | null>(
    null,
  );
  const activeSymptomId = useRef(symptomId);
  activeSymptomId.current = symptomId;

  useEffect(() => {
    setShowRevealAffordance(false);
    setRevealedPrior(null);

    if (symptomId === null) {
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
    const requestedSymptomId = symptomId;
    void revealPriorRating(requestedSymptomId).then((prior) => {
      if (activeSymptomId.current === requestedSymptomId) {
        setRevealedPrior(prior);
      }
    });
  }

  return (
    <fieldset data-testid="rating-control">
      <legend><LocalizedMessage message={message("rating.legend")} /></legend>

      <label>
        <LocalizedMessage message={message("rating.polarity")} />
        <select
          className={INPUT_CONTROL}
          aria-label={message("rating.polarity").text}
          value={polarity}
          onChange={(event) => onPolarityChange(event.target.value as Polarity)}
        >
          <option value="negative">{message("rating.negative").text}</option>
          <option value="positive">{message("rating.positive").text}</option>
        </select>
      </label>

      <label>
        <LocalizedMessage message={message("rating.intensity")} />
        <input
          className={`min-h-11 min-w-11 accent-pic-sage-700 ${CONTROL_FOCUS}`}
          aria-label={message("rating.intensity").text}
          type="range"
          min={0}
          max={10}
          step={1}
          value={intensity}
          onChange={(event) => onIntensityChange(Number(event.target.value) as Intensity)}
        />
        <span data-testid="rating-intensity-value">{new Intl.NumberFormat(locale).format(intensity)}</span>
      </label>

      {showRevealAffordance ? (
        <button className={UTILITY_CONTROL} type="button" data-testid="reveal-prior-rating" onClick={revealPrior}>
          <LocalizedMessage message={message("rating.reveal")} />
        </button>
      ) : null}

      {revealedPrior !== null ? (
        <p data-testid="revealed-prior-rating">
          <LocalizedMessage message={message("rating.prior", {
            polarity: message(revealedPrior.polarity === "positive" ? "rating.positive" : "rating.negative").text,
            intensity: revealedPrior.intensity, maximum: 10,
          })} />
        </p>
      ) : null}
    </fieldset>
  );
}
