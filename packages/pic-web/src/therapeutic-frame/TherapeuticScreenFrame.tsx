import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { LanguageSelector } from "../i18n/language-selector";
import { useLocale } from "../i18n/locale-provider";
import { LocalizedMessage } from "../i18n/localized-message";
import { TherapeuticSheet } from "../therapeutic-sheet";
import { TherapeuticFrame, type TherapeuticFrameProps } from "./TherapeuticFrame";

export type TherapeuticScreenFrameProps = TherapeuticFrameProps & {
  utilityTrigger?: never;
  utilities?: ReactNode;
};

/** One viewport plus sovereign utilities. Callers supply their own content/actions, never another Frame. */
export function TherapeuticScreenFrame({ utilities, ...frameProps }: TherapeuticScreenFrameProps) {
  const { message } = useLocale();
  return (
    <TherapeuticFrame
      {...frameProps}
      utilityTrigger={(
        <TherapeuticSheet
          title={message("utilities.sessionTitle").text}
          triggerLabel={message("utilities.openSession").text}
          closeLabel={message("utilities.closeSession").text}
          contentLabel={message("utilities.sessionContent").text}
          trigger={<><Menu aria-hidden="true" size={20} /><LocalizedMessage message={message("utilities.trigger")} /></>}
        >
          <div className="grid gap-6"><LanguageSelector />{utilities}</div>
        </TherapeuticSheet>
      )}
    />
  );
}
