import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "../src/app-providers";
import { compositionRoot } from "../src/composition-root";
import { GuestFlowRouter } from "../src/guest-flow-router";
import { GuestModeShell } from "../src/GuestModeShell";
import { useLocale } from "../src/i18n/locale-provider";
import { TerminologyFixture } from "../src/i18n/terminology-test-fixture";
import { useAuthIdentity, useSessionEngineState } from "../src/session-engine-context";
import "../src/visual-foundation/visual-foundation.css";

const root = document.getElementById("root")!;
localStorage.setItem("pic-web.locale.v1", new URLSearchParams(location.search).get("locale") === "he" ? "he" : "en");
const catalog = await compositionRoot.catalogActions.listTreatments();
root.dataset.treatmentId = catalog[0]!.id;

/** Presentation setters and read-only reflections; every therapeutic/auth action remains the actual application action. */
function JourneyEvidence() {
  const { selectLocale, customNemarAlias } = useLocale();
  const state = useSessionEngineState();
  const identity = useAuthIdentity();
  useEffect(() => {
    root.dataset.state = JSON.stringify(state);
    root.dataset.identity = JSON.stringify(identity);
    root.dataset.alias = customNemarAlias ?? "";
  }, [state, identity, customNemarAlias]);
  useEffect(() => {
    const change = (event: Event) => {
      if (event instanceof CustomEvent && (event.detail === "he" || event.detail === "en")) selectLocale(event.detail);
    };
    window.addEventListener("fixture-select-locale", change);
    return () => window.removeEventListener("fixture-select-locale", change);
  }, [selectLocale]);
  return <TerminologyFixture />;
}

createRoot(root).render(<AppProviders><JourneyEvidence /><GuestModeShell><GuestFlowRouter /></GuestModeShell></AppProviders>);
