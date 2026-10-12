import { useLocale } from "../i18n/locale-provider";
import { useTreatmentDisplay } from "./use-treatment-display";

export function TreatmentPickerTitle({ treatmentId, title }: { treatmentId: string; title: string }) {
  const { locale, direction } = useLocale();
  const display = useTreatmentDisplay(treatmentId, title, true);
  return <>
    <bdi dir={display.direction} lang={display.language}>{display.title}</bdi>
    {display.notice === null ? null : (
      <span className="block text-sm" lang={locale} dir={direction}>{display.notice}</span>
    )}
  </>;
}
