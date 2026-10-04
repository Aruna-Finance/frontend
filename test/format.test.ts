import { describe, expect, it } from "vitest";
import { formatCompact, formatPercent } from "@/lib/format";

describe("formatCompact", () => {
  it("shortens large amounts to K/M/B with one decimal", () => {
    expect(formatCompact(200_439_501.623)).toBe("200.4M");
    expect(formatCompact(150_595_986.76)).toBe("150.6M");
    expect(formatCompact(9_800)).toBe("9.8K");
    expect(formatCompact(2_500_000_000)).toBe("2.5B");
  });

  it("keeps up to two decimals under 1,000", () => {
    expect(formatCompact(141.129)).toBe("141.13");
    expect(formatCompact(46.348408)).toBe("46.35");
    expect(formatCompact(7)).toBe("7");
  });

  it("appends the unit when given", () => {
    expect(formatCompact(200_439_501.623, "USDC")).toBe("200.4M USDC");
    expect(formatCompact(141.129, "USDC")).toBe("141.13 USDC");
  });

  it("drops a trailing .0", () => {
    expect(formatCompact(1_000_000)).toBe("1M");
    expect(formatCompact(1_000)).toBe("1K");
    expect(formatCompact(12_000)).toBe("12K");
  });

  it("never prints 1000 or 1000K: values that round up move to the next unit", () => {
    expect(formatCompact(999.999)).toBe("1K");
    expect(formatCompact(999_950)).toBe("1M");
    expect(formatCompact(999_950_000)).toBe("1B");
  });

  it("handles zero and negatives", () => {
    expect(formatCompact(0)).toBe("0");
    expect(formatCompact(-173.67)).toBe("−173.67");
    expect(formatCompact(-12_345)).toBe("−12.3K");
    // A negative that rounds to zero must not read "−0".
    expect(formatCompact(-0.001)).toBe("0");
  });

  it("returns a dash for missing or non-finite values", () => {
    expect(formatCompact(null)).toBe("–");
    expect(formatCompact(undefined)).toBe("–");
    expect(formatCompact(Number.NaN)).toBe("–");
    expect(formatCompact(Number.POSITIVE_INFINITY, "USDC")).toBe("–");
  });

  // Covers AE1.
  it("turns the underwrite page's overlapping figures into short ones", () => {
    expect(formatCompact(200_439_501.623, "USDC")).toBe("200.4M USDC");
    expect(formatPercent(4.867111751788873)).toBe("4.9%");
  });
});

describe("formatPercent", () => {
  it("uses one decimal from 1% up and drops a trailing .0", () => {
    expect(formatPercent(4.867111751788873)).toBe("4.9%");
    expect(formatPercent(51)).toBe("51%");
    expect(formatPercent(88.24)).toBe("88.2%");
    expect(formatPercent(194)).toBe("194%");
  });

  it("uses two decimals below 1%", () => {
    expect(formatPercent(0.02)).toBe("0.02%");
    expect(formatPercent(0.5)).toBe("0.5%");
  });

  it("shows <0.01% for a nonzero value too small to display", () => {
    expect(formatPercent(0.0008014629850063927)).toBe("<0.01%");
    expect(formatPercent(-0.004)).toBe("<0.01%");
  });

  it("adds a plus sign to gains only when asked, and a minus to losses", () => {
    expect(formatPercent(0.02, { signed: true })).toBe("+0.02%");
    expect(formatPercent(0.02)).toBe("0.02%");
    expect(formatPercent(-1.26, { signed: true })).toBe("−1.3%");
    expect(formatPercent(0, { signed: true })).toBe("0%");
  });

  it("returns a dash for missing or non-finite values", () => {
    expect(formatPercent(null)).toBe("–");
    expect(formatPercent(Number.NaN)).toBe("–");
  });
});
