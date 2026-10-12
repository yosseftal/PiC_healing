import { useEffect, useMemo, useState } from "react";
import type { AtomicUnitContent, Treatment } from "pic-engine";
import { useLocale } from "../i18n/locale-provider";
import { useTreatmentContentActions } from "../treatment-content-context";
import { isApprovedContentCandidate } from "./approved-content";
import { createTreatmentDisplayResolver } from "./resolver";

interface ContentRead {
  treatmentId: string;
  source: Treatment | null;
  units: readonly AtomicUnitContent[];
}

/** Loading depends on identity only. Latest locale selects synchronously from validated source/display data. */
export function useTreatmentDisplay(treatmentId: string, catalogTitle?: string, picker = false) {
  const { locale } = useLocale();
  const { getParsedTreatmentContent, getTreatmentContentSource } = useTreatmentContentActions();
  const [read, setRead] = useState<ContentRead | null>(null);
  const resolve = useMemo(createTreatmentDisplayResolver, []);
  useEffect(() => {
    let cancelled = false;
    const candidate = isApprovedContentCandidate(treatmentId);
    if (picker && !candidate) return;
    void Promise.all([
      getParsedTreatmentContent(treatmentId),
      candidate ? getTreatmentContentSource(treatmentId).catch(() => null) : Promise.resolve(null),
    ]).then(([units, source]) => {
      if (!cancelled) setRead({ treatmentId, source, units });
    }).catch(() => {
      // Canonical guards/recovery own read failures; never let failed validation blank the picker title.
    });
    return () => { cancelled = true; };
  }, [getParsedTreatmentContent, getTreatmentContentSource, treatmentId, picker]);
  const current = read?.treatmentId === treatmentId ? read : null;
  return resolve({
    treatmentId, source: current?.source ?? null, units: current?.units ?? [], locale, catalogTitle,
  });
}
