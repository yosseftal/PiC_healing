import type { AtomicUnitContent, Treatment } from "pic-engine";
import type { Locale } from "../i18n/locale";
import { resolveMessage } from "../i18n/core-messages";
import { approvedContent } from "./approved-content";
import { PRODUCT_CONTENT_APPROVAL } from "./permission";
import type { ApprovedTreatmentContent, TreatmentDisplay } from "./types";

export const availabilityNotice = {
  he: resolveMessage("he", "content.availability").text,
  en: resolveMessage("en", "content.availability").text,
};

function sameUnits(left: readonly AtomicUnitContent[], right: readonly AtomicUnitContent[]): boolean {
  return left.length === right.length && left.every((unit, index) => {
    const other = right[index];
    return other !== undefined && unit.unit_id === other.unit_id && unit.unit_order === other.unit_order
      && unit.unit_title === other.unit_title && unit.unit_content === other.unit_content
      && unit.unit_rationale === other.unit_rationale;
  });
}

export function resolveTreatmentDisplay({
  treatmentId, source, units, locale, catalogTitle, catalog = approvedContent,
}: {
  treatmentId: string;
  source: Treatment | null;
  units: readonly AtomicUnitContent[];
  locale: Locale;
  catalogTitle?: string;
  catalog?: readonly ApprovedTreatmentContent[];
}): TreatmentDisplay {
  const asset = catalog.find((candidate) => candidate.source.id === treatmentId);
  const validSource = asset !== undefined && source !== null && units.length > 0
    && source.id === treatmentId && source.title === asset.source.title
    && (catalogTitle === undefined || catalogTitle === source.title)
    && source.content_format === asset.source.content_format
    && source.structured_markdown === asset.source.structured_markdown && sameUnits(units, asset.units);
  const translated = validSource ? asset.locales[locale] : undefined;
  const approved = validSource && asset.permission === PRODUCT_CONTENT_APPROVAL
    && asset.provenance.length > 0 && asset.revision.length > 0 && asset.sourceLanguage === "en"
    && translated !== undefined && translated.locale === locale && translated.approval === PRODUCT_CONTENT_APPROVAL
    && translated.sourceRevision === asset.revision
    && translated.title.trim().length > 0 && translated.units.length === units.length
    && translated.units.every((unit, index) => unit.unit_id === units[index].unit_id
      && unit.unit_order === units[index].unit_order && unit.unit_title.trim().length > 0
      && unit.unit_content.trim().length > 0 && unit.unit_rationale === units[index].unit_rationale);
  if (approved) {
    return {
      title: translated.title, units: translated.units, language: locale,
      direction: locale === "he" ? "rtl" : "ltr", notice: null, revision: asset.revision,
    };
  }
  return {
    title: catalogTitle ?? source?.title ?? "", units, language: validSource ? "en" : "",
    direction: validSource ? "ltr" : "auto", notice: units.length === 0 ? null : availabilityNotice[locale],
    revision: null,
  };
}

/** Only validated display results enter this cache; canonical units are never cached or mutated here. */
export function createTreatmentDisplayResolver() {
  const displays = new Map<string, TreatmentDisplay>();
  return (input: Parameters<typeof resolveTreatmentDisplay>[0]): TreatmentDisplay => {
    const display = resolveTreatmentDisplay(input);
    if (display.revision === null) return display;
    const key = JSON.stringify([input.treatmentId, display.revision, input.locale]);
    const cached = displays.get(key);
    if (cached !== undefined) return cached;
    displays.set(key, display);
    return display;
  };
}
