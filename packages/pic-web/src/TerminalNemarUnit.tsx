/** Mandatory closing muscle test (DEC-015 §7b), reflected from the Player session. */
import { useState, type RefObject } from "react";
import {
  AtomicActionLayout,
  type ActionTuple,
  type BannerTuple,
} from "./action-layout/AtomicActionLayout";
import { usePlayerEngineActions } from "./player-engine-context";
import { useSessionEngineActions } from "./session-engine-context";
import { useAsyncAction } from "./use-async-action";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";

interface TerminalNemarUnitProps {
  sessionId: string;
  /** Dumb reflection of `PlayerSession.terminal_nemar_response` — never local state (DEC-015). */
  response: "yes" | "no" | null;
  successDeclared?: boolean;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  onFinishResolved?: () => void;
}

export function TerminalNemarUnit({
  sessionId,
  response,
  successDeclared = false,
  headingRef,
  onFinishResolved,
}: TerminalNemarUnitProps) {
  const { message } = useLocale();
  const { respondTerminalNemar } = usePlayerEngineActions();
  const { onFinishRequested } = useSessionEngineActions();
  const [editing, setEditing] = useState(false);
  const {
    status: responseStatus,
    run: submitResponse,
    retry: retryResponse,
  } = useAsyncAction(respondTerminalNemar);
  const {
    status: finishStatus,
    run: requestFinish,
    retry: retryFinish,
  } = useAsyncAction(onFinishRequested);

  async function choose(answer: "yes" | "no") {
    const result = await submitResponse(sessionId, answer);
    if (result.ok) {
      setEditing(false);
    }
  }

  async function finish() {
    const result = await requestFinish(sessionId, "finish");
    if (result.ok) {
      onFinishResolved?.();
    }
  }

  async function retryFinishRequest() {
    const result = await retryFinish();
    if (result?.ok) {
      onFinishResolved?.();
    }
  }

  async function retryResponseRequest() {
    const result = await retryResponse();
    if (result?.ok) {
      setEditing(false);
    }
  }

  const showChoices = response === null || editing;
  const actions: ActionTuple = responseStatus === "recovery" ? [
    {
      kind: "button", label: message("player.retryResponse").text, intent: "secondary",
      onAction: () => void retryResponseRequest(),
    },
  ] : finishStatus === "recovery" ? [
    {
      kind: "button", label: message("player.retryFinish").text, intent: "secondary",
      onAction: () => void retryFinishRequest(),
    },
  ] : showChoices ? [
    {
      kind: "button", label: message("player.yes").text, testId: "terminal-nemar-yes", intent: "primary",
      pressed: response === "yes", onAction: () => void choose("yes"),
    },
    {
      kind: "button", label: message("player.no").text, testId: "terminal-nemar-no", intent: "secondary",
      pressed: response === "no", onAction: () => void choose("no"),
    },
  ] : response === "yes" && !successDeclared ? [
    {
      kind: "button", label: message("player.finish").text, testId: "finish-button", intent: "primary",
      onAction: () => void finish(),
    },
    {
      kind: "button", label: message("player.changeResponse").text, intent: "quiet",
      onAction: () => setEditing(true),
    },
  ] : [
    {
      kind: "button", label: message("player.changeResponse").text, intent: "quiet",
      onAction: () => setEditing(true),
    },
  ];

  const banners: BannerTuple = responseStatus === "recovery" ? [
    {
      id: "response-recovery", intent: "recovery",
      content: <LocalizedMessage message={message("player.responseRecovery")} />,
    },
  ] : finishStatus === "recovery" ? [
    {
      id: "finish-recovery", intent: "recovery",
      content: <LocalizedMessage message={message("player.finishRecovery")} />,
    },
  ] : !showChoices && response === "yes" ? [
    {
      id: "response-yes", intent: "confirmation",
      content: <p role="status" data-testid="terminal-nemar-response-recorded">
        <LocalizedMessage message={message("player.responseYes")} />
      </p>,
    },
  ] : !showChoices && response === "no" ? [
    {
      id: "response-no", intent: "reflection",
      content: <p role="status" data-testid="terminal-nemar-response-recorded">
        <LocalizedMessage message={message("player.responseNo")} />
      </p>,
    },
  ] : [];

  return (
    <section data-testid="terminal-nemar-unit">
      <AtomicActionLayout
        primaryContent={<>
          <h2 ref={headingRef} tabIndex={-1}><LocalizedMessage message={message("player.terminalTitle")} /></h2>
          <p><LocalizedMessage message={message("player.terminalQuestion")} /></p>
        </>}
        actions={actions}
        banners={banners}
        actionsLabel={message("player.availableActions").text}
        selectedLabel={message("player.selected").text}
      />
    </section>
  );
}
