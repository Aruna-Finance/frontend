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

export function formatRangeValue(value: number): string {
  const fractionDigits = value < 10 ? 4 : 2;
  return value.toLocaleString("en-US", { minimumFractionDigits: fractionDigits });
}
