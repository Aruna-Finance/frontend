import { mockQuoteDefaults, mockQuoteStrikeTable } from "@/lib/mock/positions";
import type { QuoteRequest, QuoteResult } from "@/types/domain";

export interface UseQuoteResult {
  data: QuoteResult | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Mock hanya punya satu skenario terkalibrasi (posisi #482911, sisa waktu cohort 12).
// vaultId/coveredAmountUsdc diterima di sini supaya signature-nya sudah cocok dengan
// pemanggilan IPremiumPricer.quote() nanti; belum dipakai untuk menghitung ulang premi.
export function useQuote({ strikePercent }: QuoteRequest): UseQuoteResult {
  const row = mockQuoteStrikeTable.find((entry) => entry.strikePercent === strikePercent);

  if (!row) {
    return { data: undefined, isLoading: false, isError: false };
  }

  const data: QuoteResult = {
    strikePercent: row.strikePercent,
    premiumUsdc: row.premiumUsdc,
    fullCyclePremiumUsdc: row.fullCyclePremiumUsdc,
    breakevenPercent: row.breakevenPercent,
    capReachedAtPercent: row.capReachedAtPercent,
    maxPayoutUsdc: mockQuoteDefaults.maxPayoutUsdc,
    estPayoutIfVolHoldsUsdc: row.estPayoutIfVolHoldsUsdc,
    coveredSeconds: mockQuoteDefaults.coveredSecondsAtQuote,
  };

  return { data, isLoading: false, isError: false };
}
