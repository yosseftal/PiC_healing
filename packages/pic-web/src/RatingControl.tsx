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
import { summaryMessage } from "./summary-messages";

export interface RatingControlProps {
  symptomId: string | null;
  polarity: Polarity;
  intensity: Intensity | null;
  explicitIntensity?: boolean;
  disabled?: boolean;
  onPolarityChange: (polarity: Polarity) => void;
  onIntensityChange: (intensity: Intensity) => void;
}

export function RatingControl({
  symptomId,
  polarity,
  intensity,
  explicitIntensity = false,
  disabled = false,
  onPolarityChange,
  onIntensityChange,
}: RatingControlProps): ReactNode {
  const { message, locale } = useLocale();
  const { hasPriorRating, revealPriorRating } = useGroupEngineActions();
  const [showRevealAffordance, setShowRevealAffordance] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{
    symptomId: string; prior: { polarity: Polarity; intensity: Intensity };
  } | null>(null);
  const revealedPrior = revealed?.symptomId === symptomId ? revealed.prior : null;
  const activeSymptomId = useRef(symptomId);
  activeSymptomId.current = symptomId;
  const requestVersion = useRef(0);

  useEffect(() => {
    const version = ++requestVersion.current;
    setShowRevealAffordance(null);
    setRevealed(null);

    if (symptomId === null) {
      return;
    }

    let cancelled = false;
    void hasPriorRating(symptomId).then((hasPrior) => {
      if (!cancelled && version === requestVersion.current) {
        setShowRevealAffordance(hasPrior ? symptomId : null);
      }
    }).catch(() => { /* An unavailable history never reveals a prior dimension. */ });

    return () => {
      cancelled = true;
      requestVersion.current += 1;
    };
  }, [hasPriorRating, symptomId]);

  function revealPrior(): void {
    if (symptomId === null) {
      return;
    }
    const requestedSymptomId = symptomId;
    const version = requestVersion.current;
    void revealPriorRating(requestedSymptomId).then((prior) => {
      if (activeSymptomId.current === requestedSymptomId && version === requestVersion.current) {
        setRevealed(prior === null ? null : { symptomId: requestedSymptomId, prior });
      }
    }).catch(() => { /* Keep current input available when history cannot be read. */ });
  }

  return (
    <fieldset className="grid min-w-0 gap-4" data-testid="rating-control" disabled={disabled}>
      <legend><LocalizedMessage message={message("rating.legend")} /></legend>

      <label className="grid min-w-0 gap-2">
        <LocalizedMessage message={message("rating.polarity")} />
        <select
          className={INPUT_CONTROL}
          aria-label={message("rating.polarity").text}
          data-navigation-focus={`${symptomId}:rating-polarity`}
          value={polarity}
          onChange={(event) => onPolarityChange(event.target.value as Polarity)}
        >
          <option value="negative">{message("rating.negative").text}</option>
          <option value="positive">{message("rating.positive").text}</option>
        </select>
      </label>

      <label className="grid min-w-0 gap-2">
        <LocalizedMessage message={message("rating.intensity")} />
        {explicitIntensity ? <select className={INPUT_CONTROL} aria-label={message("rating.intensity").text}
          data-navigation-focus={`${symptomId}:rating-intensity`}
          value={intensity ?? ""} onChange={(event) => onIntensityChange(Number(event.target.value) as Intensity)}>
          <option value="" disabled>{summaryMessage(locale, "choose").text}</option>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => <option value={value} key={value}>
            {new Intl.NumberFormat(locale).format(value)}
          </option>)}
        </select> : <><input
          className={`min-h-11 min-w-11 accent-pic-sage-700 ${CONTROL_FOCUS}`}
          aria-label={message("rating.intensity").text}
          data-navigation-focus={`${symptomId}:rating-intensity`}
          type="range"
          min={0}
          max={10}
          step={1}
          value={intensity ?? 0}
          onChange={(event) => onIntensityChange(Number(event.target.value) as Intensity)}
        />
        <span data-testid="rating-intensity-value">{new Intl.NumberFormat(locale).format(intensity ?? 0)}</span></>}
      </label>

      {showRevealAffordance !== null && showRevealAffordance === symptomId ? (
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
