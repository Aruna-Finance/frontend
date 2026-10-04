"use client";

import { useQuery } from "@tanstack/react-query";
import { varianceWadToVolPercent } from "@/lib/contracts/units";
import { realizedVarianceAnnualized } from "@/lib/contracts/variance";
import { indexerRequest } from "@/lib/indexer/client";
import { WINDOW_SAMPLES_QUERY } from "@/lib/indexer/queries";

interface WindowSample {
  timestamp: string;
  cumulativeSumSq: string;
}

// Annualized realized vol (percent, one decimal) over a finalized cohort
// window: the sum of squared returns between its bracketing samples, over the
// time those samples span. Null until the window is known.
export function useWindowRealizedVol(
  accumulator: string | undefined,
  startIndex: number | null | undefined,
  endIndex: number | null | undefined,
): number | null {
  const enabled = Boolean(accumulator) && typeof startIndex === "number" && typeof endIndex === "number";
  const query = useQuery({
    queryKey: ["indexer", "windowSamples", accumulator, startIndex, endIndex],
    queryFn: () =>
      indexerRequest<{ start: WindowSample | null; end: WindowSample | null }, { accumulator: string; startIndex: number; endIndex: number }>(
        WINDOW_SAMPLES_QUERY,
        { accumulator: accumulator as string, startIndex: startIndex as number, endIndex: endIndex as number },
      ),
    enabled,
  });
  const start = query.data?.start;
  const end = query.data?.end;
  if (!start || !end) return null;
  const sumSq = BigInt(end.cumulativeSumSq) - BigInt(start.cumulativeSumSq);
  const span = BigInt(end.timestamp) - BigInt(start.timestamp);
  if (sumSq < 0n || span <= 0n) return null;
  return Math.round(varianceWadToVolPercent(realizedVarianceAnnualized(sumSq, span)) * 10) / 10;
}
