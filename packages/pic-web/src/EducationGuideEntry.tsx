import {
  useAuthIdentity,
  usePromotionRecoveryState,
  useSessionEngineState,
  useVerificationPending,
} from "./session-engine-context";
import { UTILITY_CONTROL } from "./control-affordance";
import { useLocale } from "./i18n/locale-provider";
import { useQuestionnaireNavigation } from "./questionnaire-navigation-context";
import type { QuestionnaireLocation } from "./questionnaire-navigation";
import { useQuestionnaireDraftState } from "./group-engine-context";
import { useInquiryGeneration } from "./inquiry-reset-context";
import { resolveEducationMessage } from "./education-messages";
import { useOptionalEducationPresentation, type EducationIdentity } from "./education-presentation-context";

export type EducationGuideEntryProps = {
  location: QuestionnaireLocation;
  disabled: boolean;
  onOpened: () => void;
};

/** Keep isolated frame fixtures usable unless the app explicitly provides education presentation state. */
export function EducationGuideEntry(props: EducationGuideEntryProps) {
  const education = useOptionalEducationPresentation();
  if (education === null) return null;
  return <AvailableEducationGuideEntry {...props} education={education} />;
}

type EducationPresentation = NonNullable<ReturnType<typeof useOptionalEducationPresentation>>;

function AvailableEducationGuideEntry({
  location, disabled, onOpened, education,
}: EducationGuideEntryProps & { education: EducationPresentation }) {
  const { locale } = useLocale();
  const identity = useAuthIdentity();
  const session = useSessionEngineState();
  const verificationPending = useVerificationPending();
  const promotionRecovery = usePromotionRecoveryState();
  const generation = useInquiryGeneration();
  const navigation = useQuestionnaireNavigation();
  const questionnaireDraft = useQuestionnaireDraftState();
  const educationIdentity: EducationIdentity = {
    ownerKey: identity.owner === null ? "guest" : `account:${identity.owner}:${identity.revision}`,
    generation,
  };
  const educationBlocked = navigation.state.waiting || navigation.state.recovery || questionnaireDraft.readOnly ||
    questionnaireDraft.recovery || questionnaireDraft.storageUnavailable || questionnaireDraft.busy ||
    session.gateTriggered || session.promotionStatus === "pending" || verificationPending !== null ||
    promotionRecovery !== null || identity.status === "checking" || identity.status === "reauthenticate" ||
    identity.status === "uncertain";

  return <button className={UTILITY_CONTROL} type="button" data-testid="education-guide-trigger"
    disabled={educationBlocked || disabled}
    onClick={() => {
      if (educationBlocked || disabled) return;
      const focusToken = "test:education-guide-trigger";
      navigation.actions.rememberFocus(focusToken);
      education.actions.openGuide(educationIdentity, { kind: "questionnaire", location, focusToken });
      onOpened();
    }}>
    {resolveEducationMessage(locale, "drawerGuide").text}
  </button>;
}
