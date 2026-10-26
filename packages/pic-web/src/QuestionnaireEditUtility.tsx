import { useQuestionnaire } from "./group-engine-context";
import { useLocale } from "./i18n/locale-provider";
import { UTILITY_CONTROL } from "./control-affordance";
import { useInquiryUtilities } from "./inquiry-utilities-context";

/** Secondary return entry; the composition-owned draft survives screen changes. */
export function QuestionnaireEditUtility({ disabled = false }: { disabled?: boolean }) {
  const { actions, state } = useQuestionnaire();
  const { message } = useLocale();
  const { setOpen } = useInquiryUtilities();
  return <button type="button" className={UTILITY_CONTROL} data-testid="edit-questionnaire"
    disabled={disabled || state.busy} onClick={() => void actions.beginEdit().then((opened) => {
      if (opened) setOpen(false);
    })}>
    {message("questionnaire.edit").text}
  </button>;
}
