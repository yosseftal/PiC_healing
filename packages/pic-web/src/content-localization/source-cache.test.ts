import { afterEach, expect, it, vi } from "vitest";
import { compositionRoot, resetTreatmentContentCacheForTest } from "../composition-root";
import { TRACER_BULLET_SEED_TREATMENT_ROWS } from "pic-engine";

afterEach(() => { vi.restoreAllMocks(); resetTreatmentContentCacheForTest(); });

it("allows an explicit canonical retry after a source was temporarily absent", async () => {
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  const read = vi.spyOn(compositionRoot.repositoryPort, "getTreatment")
    .mockResolvedValueOnce(null).mockResolvedValueOnce(source);
  expect(await compositionRoot.treatmentContentActions.getParsedTreatmentContent(source.id)).toEqual([]);
  expect(await compositionRoot.treatmentContentActions.getParsedTreatmentContent(source.id)).toHaveLength(3);
  expect(read).toHaveBeenCalledTimes(2);
});

it("allows a canonical retry after rejection and shares the successful source with metadata reads", async () => {
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  const read = vi.spyOn(compositionRoot.repositoryPort, "getTreatment")
    .mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(source);
  await expect(compositionRoot.treatmentContentActions.getParsedTreatmentContent(source.id)).rejects.toThrow("offline");
  const units = await compositionRoot.treatmentContentActions.getParsedTreatmentContent(source.id);
  expect(await compositionRoot.treatmentContentActions.getTreatmentContentSource(source.id)).toBe(source);
  expect(await compositionRoot.treatmentContentActions.getParsedTreatmentContent(source.id)).toBe(units);
  expect(read).toHaveBeenCalledTimes(2);
});
