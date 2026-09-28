import { formatUnits, parseUnits } from "viem";

export const WAD = 10n ** 18n;
export const USDC_DECIMALS = 6;
export const SECONDS_PER_YEAR = 31_536_000n;

// strikeAnnualized is a uint64 on-chain, holding annualized variance as a WAD.
const UINT64_MAX = 2n ** 64n - 1n;

// The UI speaks volatility ("35% vol"); the contract speaks variance
// (vol², WAD). 35% vol -> 0.1225 -> 122_500_000_000_000_000.
// Works in basis points of vol so the maths stays in exact integers.
export function volPercentToVarianceWad(volPercent: number): bigint | undefined {
  if (!Number.isFinite(volPercent) || volPercent < 0) return undefined;
  const volBps = BigInt(Math.round(volPercent * 100));
  return (volBps * volBps * WAD) / 100_000_000n;
}

// Display only: the square root leaves integer space.
export function varianceWadToVolPercent(variance: bigint): number {
  if (variance <= 0n) return 0;
  return Math.sqrt(Number(variance) / Number(WAD)) * 100;
}

// Returns undefined for input the contract would not accept (negative, not a
// number, or larger than a uint64 can hold), so callers can disable submit.
export function volPercentToStrikeAnnualized(volPercent: number): bigint | undefined {
  const variance = volPercentToVarianceWad(volPercent);
  if (variance === undefined || variance > UINT64_MAX) return undefined;
  return variance;
}

// Parses what a person typed into base units. undefined = not a valid amount
// (empty, negative, not numeric, or more fraction digits than the token has).
export function parseTokenAmount(text: string, decimals: number): bigint | undefined {
  const trimmed = text.replace(/,/g, "").trim();
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") return undefined;
  const fraction = trimmed.split(".")[1] ?? "";
  if (fraction.length > decimals) return undefined;
  try {
    return parseUnits(trimmed, decimals);
  } catch {
    return undefined;
  }
}

// Exact for any size (no Number round-trip). Fraction is truncated, not
// rounded, so the UI never shows more than a wallet actually holds.
export function formatTokenAmount(value: bigint, decimals: number, maxFractionDigits = 2): string {
  const negative = value < 0n;
  const [whole, fraction = ""] = formatUnits(negative ? -value : value, decimals).split(".");
  const grouped = BigInt(whole).toLocaleString("en-US");
  const shown = fraction.slice(0, maxFractionDigits).replace(/0+$/, "");
  return `${negative ? "-" : ""}${grouped}${shown ? `.${shown}` : ""}`;
}

export function formatUsdcAmount(value: bigint, maxFractionDigits = 2): string {
  return formatTokenAmount(value, USDC_DECIMALS, maxFractionDigits);
}

// 604800 -> "7d", 90000 -> "1d 1h", 3900 -> "1h 5m", 45 -> "45s".
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes && !days) parts.push(`${minutes}m`);
  if (parts.length === 0) return `${seconds % 60}s`;
  return parts.slice(0, 2).join(" ");
}
