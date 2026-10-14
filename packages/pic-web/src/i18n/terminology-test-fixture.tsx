import { useEffect } from "react";
import { useLocale } from "./locale-provider";

/** Test-only access to the provider setter; no production alias editor is introduced. */
export function TerminologyFixture() {
  const { setCustomNemarAlias } = useLocale();
  useEffect(() => {
    const change = (event: Event) => {
      if (event instanceof CustomEvent && (typeof event.detail === "string" || event.detail === null)) {
        setCustomNemarAlias(event.detail);
      }
    };
    window.addEventListener("fixture-set-alias", change);
    return () => window.removeEventListener("fixture-set-alias", change);
  }, [setCustomNemarAlias]);
  return null;
}

export function changeFixtureAlias(alias: string | null) {
  window.dispatchEvent(new CustomEvent("fixture-set-alias", { detail: alias }));
}
