import { useState } from "react";
import { useCompletionPresentation } from "./completion-context";
import { completionMessage } from "./completion-messages";
import { UTILITY_CONTROL } from "./control-affordance";
import { useLocale } from "./i18n/locale-provider";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";

/** A recovery check never repeats Finish or promises that pending persistence succeeded. */
export function CompletionRecoveryScreen() {
  const { locale } = useLocale();
  const { recovery, retryRecovery } = useCompletionPresentation();
  const [checking, setChecking] = useState(false);
  const title = completionMessage(locale, "checking");
  const pending = checking || recovery.status === "pending";
  async function retry() {
    if (pending) return;
    setChecking(true);
    try { await retryRecovery(); } catch { /* The retained recovery surface remains the retry point. */ }
    finally { setChecking(false); }
  }
  return <section data-testid="completion-recovery-screen">
    <TherapeuticScreenFrame title={title.text} stageLabel={title.text} allowInquiryReset>
      <TherapeuticContentCard aria-label={title.text}>
        <p role="status">{completionMessage(locale, pending ? "checking" : "recovery").text}</p>
        {!pending ? <button type="button" className={UTILITY_CONTROL} onClick={() => void retry()}>
          {completionMessage(locale, "retry").text}
        </button> : null}
      </TherapeuticContentCard>
    </TherapeuticScreenFrame>
  </section>;
}
