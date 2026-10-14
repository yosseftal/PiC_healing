import { useInquiryDraft } from "./inquiry-lifecycle";
/**
 * Repeatable single-symptom add + rate step (Ticket 08-05). One symptom per pass; `RatingControl` lives here
 * only.
 */
import { useState, type FormEvent, type ReactNode } from "react";
import type { Intensity, Polarity } from "pic-engine";
import { useGroupEngineActions } from "./group-engine-context";
import { RatingControl } from "./RatingControl";
import { useAsyncAction } from "./use-async-action";
import { INPUT_CONTROL, UTILITY_CONTROL } from "./control-affordance";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";
import "./symptom-creation.css";

export interface SymptomAddStepProps {
  groupId: string;
  onSymptomAdded?: () => void;
  symptomCount?: number;
  groupName?: string;
  onDone?: () => void;
  utilities?: ReactNode;
  recoveryStatus?: string;
}

export function SymptomAddStep({
  groupId, onSymptomAdded, symptomCount = 0, groupName, onDone, utilities, recoveryStatus,
}: SymptomAddStepProps): ReactNode {
  const { message } = useLocale();
  const { addSymptom, rate } = useGroupEngineActions();
  const [symptomName, setSymptomName] = useState("");
  const [polarity, setPolarity] = useState<Polarity>("negative");
  const [intensity, setIntensity] = useState<Intensity>(5);
  useInquiryDraft(symptomName.length > 0 || polarity !== "negative" || intensity !== 5);
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

  const needsRetry = additionStatus === "recovery" || ratingStatus === "recovery";
  return (
    <TherapeuticScreenFrame allowInquiryReset
      title={message("group.title").text} stageLabel={message("group.stage").text}
      progress={<span data-testid="symptom-count"><LocalizedMessage
        message={message("symptom.count", { count: symptomCount })} /></span>}
      utilities={<>{utilities}{needsRetry ? (
        <div role="status">
          <p><LocalizedMessage message={message("symptom.recovery")} /></p>
          <button className={UTILITY_CONTROL} type="button"
            onClick={() => void (ratingStatus === "recovery" ? retryRating() : retryAddition())}>
            <LocalizedMessage message={message("symptom.retry")} />
          </button>
        </div>
      ) : null}</>}
    >
      <form className="pic-symptom-step" data-testid="symptom-add-step" onSubmit={handleSubmit}>
        <TherapeuticContentCard aria-label={message("group.card").text}>
          {groupName === undefined ? null : <p><bdi lang="" dir="auto">{groupName}</bdi></p>}
          {recoveryStatus === undefined ? null : <p role="status">{recoveryStatus}</p>}
          <div className="pic-symptom-form">
            <label>
              <LocalizedMessage message={message("symptom.name")} />
              <input
                className={INPUT_CONTROL}
                aria-label={message("symptom.name").text}
                placeholder={message("symptom.placeholder").text}
                lang="" dir="auto"
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

            {needsRetry ? <p role="status"><LocalizedMessage message={message("symptom.recovery")} />{" "}
              <LocalizedMessage message={message("symptom.recoveryHint")} /></p> : null}
          </div>
        </TherapeuticContentCard>
        <div className="pic-symptom-form__actions" role="group" aria-label={message("player.availableActions").text}>
          <button className={UTILITY_CONTROL} type="submit" data-testid="add-symptom-action">
            <LocalizedMessage message={message("symptom.add")} />
          </button>
          {symptomCount > 0 && onDone !== undefined ? (
            <button className={UTILITY_CONTROL} type="button" data-testid="finish-symptom-addition" onClick={onDone}>
              <LocalizedMessage message={message("symptom.done")} />
            </button>
          ) : null}
        </div>
      </form>
    </TherapeuticScreenFrame>
  );
}
