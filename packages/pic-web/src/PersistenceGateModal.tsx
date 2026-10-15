import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { UTILITY_CONTROL } from "./control-affordance";
import { authFeedback, verificationReturnFeedback, type AuthFeedback } from "./auth-feedback";
import { InquiryResetControls, useInquiryResetControls } from "./inquiry-reset-controls";
import { useLocale } from "./i18n/locale-provider";
import {
  usePromotePathActions,
  useSessionEngineState,
  usePromotionRecoveryState,
  useVerificationPending,
} from "./session-engine-context";

/**
 * Dumb-reflection Persistence Gate (Wave 8 ticket 08-02). Renders only when `SessionEngine` signals
 * `gateTriggered`; auth and retry delegate to composition-root `promotePathActions` — never direct adapter
 * imports. Ephemeral `preRpcPromotionFailed` covers sign-in/env failures before `SessionEngine.promote()`.
 */
export function PersistenceGateModal() {
  const { locale, direction, message } = useLocale();
  const state = useSessionEngineState();
  const recovery = usePromotionRecoveryState();
  const verification = useVerificationPending();
  const { gateTriggered, promotionStatus } = state;
  const controls = useInquiryResetControls();
  const { confirmation, busy, open: utilitiesOpen, handoffPending, keepInquiry, requestReset, resetRef } = controls;
  const { signInAndPromote, register, resendVerification, hasVerifiedIdentity, canRetryWithoutCredentials } =
    usePromotePathActions();
  const [feedback, setFeedback] = useState<AuthFeedback | null>(verificationReturnFeedback);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(verification?.name ?? "");
  const [preRpcPromotionFailed, setPreRpcPromotionFailed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState(verification?.email ?? "");
  const [password, setPassword] = useState("");
  const [validation, setValidation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (verification !== null) setMode("login"); }, [verification]);
  useEffect(() => { setDismissed(false); }, [state, recovery]);
  useEffect(() => {
    if (gateTriggered || recovery !== null) return;
    setPassword("");
    setValidation(false);
    setPreRpcPromotionFailed(false);
    setFeedback(null);
    setMode("login");
    setName("");
    setEmail("");
  }, [gateTriggered, recovery]);

  if (!gateTriggered && recovery === null) {
    return null;
  }

  const pending = submitting || promotionStatus === "pending" || recovery === "pending";
  const showFailedUi = !pending && (promotionStatus === "failed" || recovery === "failed" || preRpcPromotionFailed);
  const showIdleUi = promotionStatus === "idle" && !preRpcPromotionFailed;

  function anchorSession(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!event.currentTarget.checkValidity() || (mode === "register" && !name.trim())) { setValidation(true); return; }
    submittingRef.current = true;
    setSubmitting(true);
    setValidation(false);
    setPreRpcPromotionFailed(false);
    const credentials = canRetryWithoutCredentials() ? undefined : { email: email.trim(), password };
    setPassword("");
    const operation = mode === "register" ? register({ name, email: email.trim(), password }) : signInAndPromote(credentials);
    setFeedback(null);
    void operation.then(() => { setMode("login"); }).catch((error: unknown) => {
      setFeedback(authFeedback(error));
      setPreRpcPromotionFailed(true);
    }).finally(() => {
      submittingRef.current = false;
      setSubmitting(false);
    });
  }

  return (
    <Dialog.Root open={!dismissed && !utilitiesOpen && !handoffPending} onOpenChange={(open) => {
      if (busy || pending) return;
      if (!open && confirmation) keepInquiry();
      else setDismissed(!open);
    }}>
    <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-pic-ink/30" data-testid="persistence-gate-overlay" />
    <Dialog.Content asChild aria-describedby="persistence-gate-description" onOpenAutoFocus={(event) => {
      event.preventDefault();
      (controls.keepRef.current ?? dialogRef.current)?.focus();
    }} onCloseAutoFocus={(event) => {
      event.preventDefault();
      const target = document.querySelector<HTMLElement>('[data-testid="finish-button"]') ??
        document.querySelector<HTMLElement>('[data-testid="guest-flow-player"] header button');
      target?.focus();
    }}>
    <dialog open ref={dialogRef} aria-labelledby="persistence-gate-title" tabIndex={-1} lang={locale} dir={direction}
      aria-busy={busy || pending}
      className={[
        "fixed inset-0 z-50 m-auto grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[28rem]",
        "gap-3 overflow-y-auto rounded-pic-card border border-pic-quiet bg-pic-surface p-6 shadow-pic-sheet",
      ].join(" ")}
    >
      <Dialog.Title asChild>
        <h2 className="text-pic-heading font-pic-heading leading-pic-heading" id="persistence-gate-title">
          {message(confirmation ? "reset.confirm" : "gate.title").text}
        </h2>
      </Dialog.Title>
      <Dialog.Description asChild>
        <p id="persistence-gate-description">{message("gate.body").text}</p>
      </Dialog.Description>

      <InquiryResetControls controls={controls} />
      {confirmation ? null : <>

      {pending ? (
        <p role="status">{message("gate.pending").text}</p>
      ) : null}

      {!pending ? (
        <form noValidate onSubmit={anchorSession} className="grid gap-3">
          {verification ? <div role="status">
            <p>{message("gate.verification").text}</p><p>{message("gate.otherDevice").text}</p>
          </div> : null}
          {hasVerifiedIdentity() ? <p role="status">{message("gate.authenticated").text}</p> :
            canRetryWithoutCredentials() ? null : <>
          {mode === "register" ? <>
          <label htmlFor="gate-name">{message("gate.name").text}</label>
          <input id="gate-name" name="name" autoComplete="name" required value={name} className={UTILITY_CONTROL}
            aria-invalid={validation} aria-describedby={validation ? "gate-form-message" : undefined}
            onChange={(event) => setName(event.target.value)} />
          </> : null}
          <label htmlFor="gate-email">{message("gate.email").text}</label>
          <input id="gate-email" name="email" type="email" autoComplete="email" required value={email}
            className={UTILITY_CONTROL} dir="ltr" aria-invalid={validation || showFailedUi}
            aria-describedby={validation || showFailedUi ? "gate-form-message" : undefined}
            onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="gate-password">{message("gate.password").text}</label>
          <input id="gate-password" name="password" type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"} required
            className={UTILITY_CONTROL} value={password} aria-invalid={validation || showFailedUi}
            aria-describedby={validation || showFailedUi ? "gate-form-message" : undefined}
            onChange={(event) => setPassword(event.target.value)} />
          </>}
          {validation || showFailedUi ? <p id="gate-form-message" role="alert">
            {message(validation ? mode === "register" ? "gate.registerValidation" : "gate.validation" :
              feedback ?? "gate.recovery").text}
          </p> : null}
          {!validation && !showFailedUi && feedback ? <p role="status">{message(feedback).text}</p> : null}
          <button className={UTILITY_CONTROL} type="submit">
            {message(showFailedUi ? "gate.retry" : mode === "register" ? "gate.register" : "gate.signIn").text}
          </button>
        </form>
      ) : null}
      {!pending && verification ? <button className={UTILITY_CONTROL} type="button" onClick={() => {
        if (submittingRef.current) return;
        submittingRef.current = true; setSubmitting(true); setFeedback(null); setPreRpcPromotionFailed(false);
        void resendVerification().then(() => { setFeedback("gate.resent"); }).catch((error: unknown) => {
          setFeedback(authFeedback(error)); setPreRpcPromotionFailed(true);
        }).finally(() => { submittingRef.current = false; setSubmitting(false); });
      }}>{message("gate.resend").text}</button> : null}
      {!pending && !verification && !canRetryWithoutCredentials() ? (
        <button className={UTILITY_CONTROL} type="button" onClick={() => {
          setMode(mode === "login" ? "register" : "login"); setPassword("");
          setValidation(false); setPreRpcPromotionFailed(false);
          setFeedback(null);
        }}>{message(mode === "login" ? "gate.registerMode" : "gate.loginMode").text}</button>
      ) : null}

      {!pending && (showIdleUi || showFailedUi) ? (
        <button className={UTILITY_CONTROL} ref={resetRef} disabled={busy} type="button"
          onClick={() => void requestReset(false)}>
          {message("gate.continueWithoutSaving").text}
        </button>
      ) : null}
      </>}
    </dialog>
    </Dialog.Content>
    </Dialog.Portal>
    </Dialog.Root>
  );
}
