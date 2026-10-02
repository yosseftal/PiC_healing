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
      kind: "button", label: "Try this Terminal NEMAR response again", intent: "secondary",
      onAction: () => void retryResponseRequest(),
    },
  ] : finishStatus === "recovery" ? [
    {
      kind: "button", label: "Try finishing again", intent: "secondary",
      onAction: () => void retryFinishRequest(),
    },
  ] : showChoices ? [
    {
      kind: "button", label: "Yes", testId: "terminal-nemar-yes", intent: "primary",
      pressed: response === "yes", onAction: () => void choose("yes"),
    },
    {
      kind: "button", label: "No", testId: "terminal-nemar-no", intent: "secondary",
      pressed: response === "no", onAction: () => void choose("no"),
    },
  ] : response === "yes" && !successDeclared ? [
    {
      kind: "button", label: "Finish", testId: "finish-button", intent: "primary",
      onAction: () => void finish(),
    },
    {
      kind: "button", label: "Change response", intent: "quiet",
      onAction: () => setEditing(true),
    },
  ] : [
    {
      kind: "button", label: "Change response", intent: "quiet",
      onAction: () => setEditing(true),
    },
  ];

  const banners: BannerTuple = responseStatus === "recovery" ? [
    {
      id: "response-recovery", intent: "recovery",
      content: "Your Terminal NEMAR response is ready for another try.",
    },
  ] : finishStatus === "recovery" ? [
    {
      id: "finish-recovery", intent: "recovery",
      content: "Your session is ready when you are.",
    },
  ] : !showChoices && response === "yes" ? [
    {
      id: "response-yes", intent: "confirmation",
      content: <p role="status" data-testid="terminal-nemar-response-recorded">
        Your Yes response was recorded — Finish is available when you are ready.
      </p>,
    },
  ] : !showChoices && response === "no" ? [
    {
      id: "response-no", intent: "reflection",
      content: <p role="status" data-testid="terminal-nemar-response-recorded">
        Your No response was recorded. This session is Integrating — Finish Anyway remains
        available whenever you are ready.
      </p>,
    },
  ] : [];

  return (
    <section data-testid="terminal-nemar-unit">
      <AtomicActionLayout
        primaryContent={<>
          <h2 ref={headingRef} tabIndex={-1}>Terminal NEMAR</h2>
          <p>Is it NEMAR that this treatment ended successfully?</p>
        </>}
        actions={actions}
        banners={banners}
      />
    </section>
  );
}
