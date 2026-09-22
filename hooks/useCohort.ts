import { mockCohorts } from "@/lib/mock/cohorts";
import type { Cohort } from "@/types/domain";

export interface UseCohortResult {
  data: Cohort | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useCohort(vaultId: string, cohortId?: number): UseCohortResult {
  const cohort =
    cohortId !== undefined
      ? mockCohorts.find((item) => item.vaultId === vaultId && item.id === cohortId)
      : mockCohorts.find((item) => item.vaultId === vaultId && item.status === "ACTIVE") ??
        mockCohorts.find((item) => item.vaultId === vaultId);

  return { data: cohort, isLoading: false, isError: false };
}

export interface UseCohortsResult {
  data: Cohort[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useCohorts(vaultId: string): UseCohortsResult {
  const cohorts = mockCohorts.filter((item) => item.vaultId === vaultId);
  return { data: cohorts, isLoading: false, isError: false };
}
