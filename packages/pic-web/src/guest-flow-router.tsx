import { useInquiryUtilities } from "./inquiry-utilities-context";
import { useEffect, useRef } from "react";
import { useLocale } from "./i18n/locale-provider";
import { useInquiryGeneration } from "./inquiry-reset-context";
/**
 * Guest happy-path flow router (Ticket 08-04): mounts one screen at a time from derived facts only.
 */
import { useGuestFlowScreen } from "./guest-flow-context";
import { GuestFlowScreenView } from "./guest-flow-screens";

export function GuestFlowRouter() {
  const { message } = useLocale();
  const generation = useInquiryGeneration();
  const derivedScreen = useGuestFlowScreen();
  const { busy, confirmation } = useInquiryUtilities();
  const visible = useRef({ screen: derivedScreen, generation });
  if ((!busy && !confirmation) || visible.current.generation !== generation) {
    visible.current = { screen: derivedScreen, generation };
  }
  const screen = visible.current.screen;
  useEffect(() => {
    if (generation === 0) return;
    const timer = setTimeout(() => {
      document.querySelector<HTMLElement>('[data-testid="create-group-form"] input')?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [generation]);
  return <>
    <span className="sr-only" role="status">{generation > 0 ? message("reset.success").text : ""}</span>
    <GuestFlowScreenView key={generation} screen={screen} />
  </>;
}
