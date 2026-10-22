import {
  useAuthIdentity, useAuthenticatedDraft, useInquiryDraftState, usePromotionRecoveryState, useSessionEngineState,
  useVerificationPending,
} from "./session-engine-context";
import { useGroupEngineState } from "./group-engine-context";
import { LocalizedMessage } from "./i18n/localized-message";
import { useLocale } from "./i18n/locale-provider";

/** Shared identity and unsaved-work facts for both service drawers. */
export function IdentityDrawerStatus() {
  const { message } = useLocale();
  const draft = useAuthenticatedDraft();
  const hasLocalDraft = useInquiryDraftState();
  const identity = useAuthIdentity();
  const verificationPending = useVerificationPending();
  const recovery = usePromotionRecoveryState();
  const session = useSessionEngineState();
  const group = useGroupEngineState();
  const identityStatus = verificationPending !== null && identity.status === "guest" ?
    "verificationPending" : identity.status;
  const unsaved = hasLocalDraft || Boolean(draft && draft.phase !== "anchored") ||
    session.mode === "guest" && (group.activeGroupId !== null || session.gateTriggered) || recovery !== null;
  const greeting = identity.status === "verified" && identity.fullName?.trim() ?
    message("identity.greeting", { name: identity.fullName.trim() }) : message("identity.greetingFallback");

  return (
    <section aria-label={message("identity.section").text} className="grid gap-2">
      <p className="text-lg font-semibold"><LocalizedMessage message={greeting} /></p>
      <p role="status"><LocalizedMessage message={message(`identity.${identityStatus}`)} /></p>
      {unsaved ? <p role="status"><LocalizedMessage message={message("identity.unsaved")} /></p> : null}
      {session.promotionStatus === "pending" || recovery === "pending" ?
        <p role="status"><LocalizedMessage message={message("identity.promotionPending")} /></p> : null}
      {session.promotionStatus === "failed" || recovery === "failed" ?
        <p role="status"><LocalizedMessage message={message("identity.promotionFailed")} /></p> : null}
    </section>
  );
}
