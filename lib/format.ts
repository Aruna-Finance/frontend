export function formatCohortDate(iso: string): string {
  const date = new Date(iso);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const day = date.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" });
  const month = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${weekday} ${day} ${month} · ${time} UTC`;
}

export function formatCohortDateInline(iso: string): string {
  const date = new Date(iso);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const day = date.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" });
  const month = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${weekday} ${day} ${month} ${time} UTC`;
}

export function formatUsdc(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

export function formatUsdcDecimal(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatSettlementDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" });
  const month = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${day} ${month} ${time} UTC`;
}

// Unix seconds -> "21 Sep 08:00" - for tables where the column header already
// says UTC, so repeating it per row would be noise.
export function formatSampleTime(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  const day = date.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" });
  const month = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
  return `${day} ${month} ${time}`;
}

export function formatRangeValue(value: number): string {
  const fractionDigits = value < 10 ? 4 : 2;
  return value.toLocaleString("en-US", { minimumFractionDigits: fractionDigits });
}

// 0x7a4c1b...9f21 -> 0x7a4c…9f21
export function shortenAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

// A plain token amount (already in human units, any decimals), with no
// currency attached - for showing real on-chain quantities where there's no
// price feed to turn them into a dollar figure. 0.00031 -> "0.00031",
// 1234.5 -> "1,234.5", 0 -> "0".
export function formatTokenNumber(value: number): string {
  if (value === 0) return "0";
  const fractionDigits = Math.abs(value) < 1 ? 6 : Math.abs(value) < 1000 ? 4 : 2;
  return value.toLocaleString("en-US", { maximumFractionDigits: fractionDigits });
}

const MISSING = "–";
const COMPACT_UNITS = [
  { value: 1e9, suffix: "B" },
  { value: 1e6, suffix: "M" },
  { value: 1e3, suffix: "K" },
] as const;

// Number.toString after toFixed drops trailing zeros: 1.0 -> "1", 4.90 -> "4.9".
const trimmed = (value: number, digits: number) => Number(value.toFixed(digits)).toString();

// A compact amount for stat tiles and table cells: 200439501.623 -> "200.4M",
// 9800 -> "9.8K", 141.129 -> "141.13". Under 1,000 it keeps up to two decimals;
// from 1,000 up it uses K/M/B with one. Rounding never leaves "1000" or "1000K":
// a value that rounds up to the next unit is shown in that unit. The full figure
// belongs in a tooltip (see formatUsdcDecimal).
export function formatCompact(value: number | null | undefined, unit?: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return MISSING;
  const abs = Math.abs(value);
  let body: string;
  let isZero = false;

  let unitIndex = COMPACT_UNITS.findIndex((u) => abs >= u.value);
  if (unitIndex === -1) {
    const rounded = Number(abs.toFixed(2));
    if (rounded < 1000) {
      isZero = rounded === 0;
      body = rounded.toString();
    } else {
      unitIndex = COMPACT_UNITS.length - 1; // 999.999 rounds up to 1K
    }
  }
  if (unitIndex !== -1) {
    let scaled = Number((abs / COMPACT_UNITS[unitIndex].value).toFixed(1));
    if (scaled >= 1000 && unitIndex > 0) {
      unitIndex -= 1; // 999.95K rounds up to 1M
      scaled = Number((abs / COMPACT_UNITS[unitIndex].value).toFixed(1));
    }
    body = `${scaled}${COMPACT_UNITS[unitIndex].suffix}`;
  }

  const sign = value < 0 && !isZero ? "−" : "";
  return `${sign}${body!}${unit ? ` ${unit}` : ""}`;
}

// A percentage with a readable precision: one decimal from 1% up (whole numbers
// lose the ".0"), two below 1%, and "<0.01%" for a nonzero value that would
// otherwise print as 0.00%. `signed` adds "+" to gains, for results and returns.
// A loss keeps its minus even when tiny ("−<0.01%"), so it never reads as a gain.
export function formatPercent(value: number | null | undefined, options: { signed?: boolean } = {}): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return MISSING;
  const abs = Math.abs(value);
  if (abs === 0) return "0%";
  const sign = value < 0 ? "−" : options.signed ? "+" : "";
  if (Number(abs.toFixed(2)) === 0) return `${sign}<0.01%`;
  return `${sign}${trimmed(abs, abs < 1 ? 2 : 1)}%`;
}
