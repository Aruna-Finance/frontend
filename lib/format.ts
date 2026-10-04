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
