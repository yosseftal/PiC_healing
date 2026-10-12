import type { AtomicUnitContent, Treatment } from "pic-engine";
import type { Locale } from "../i18n/locale";

export interface ApprovedLocaleContent {
  approval: string;
  sourceRevision: string;
  locale: Locale;
  title: string;
  units: readonly AtomicUnitContent[];
}

export interface ApprovedTreatmentContent {
  source: Treatment;
  sourceLanguage: "en";
  revision: string;
  permission: string;
  provenance: string;
  units: readonly AtomicUnitContent[];
  locales: Partial<Record<Locale, ApprovedLocaleContent>>;
}

export interface TreatmentDisplay {
  title: string;
  units: readonly AtomicUnitContent[];
  language: "" | Locale;
  direction: "auto" | "ltr" | "rtl";
  notice: string | null;
  revision: string | null;
}
