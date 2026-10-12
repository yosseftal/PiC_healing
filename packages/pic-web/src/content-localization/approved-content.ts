import { treatment1 } from "./treatment-1";
import { treatment2 } from "./treatment-2";
import { treatment3 } from "./treatment-3";

export const approvedContent = [treatment1, treatment2, treatment3] as const;

export function isApprovedContentCandidate(treatmentId: string): boolean {
  return approvedContent.some((asset) => asset.source.id === treatmentId);
}
