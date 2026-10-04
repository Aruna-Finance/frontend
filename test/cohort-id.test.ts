import { describe, expect, it } from "vitest";
import {
  deriveCohortId,
  deriveCohortStatus,
  deriveCohortWindow,
  fundingTarget,
  rollTarget,
} from "@/lib/contracts/cohort-id";

// Sandbox calendar: tenor 3600, gap 600, so cohort n starts at anchor + n * 4200.
const anchor = 1_790_000_000n;
const tenor = 3600n;
const gap = 600n;
const cycle = tenor + gap;
const at = (n: bigint, offset: bigint) => anchor + n * cycle + offset;

describe("gap-aware calendar", () => {
  it("while cohort n is ACTIVE the deposit target is n+1 (AE2)", () => {
    const now = at(5n, 1800n);
    expect(deriveCohortId(anchor, tenor, now, gap)).toBe(5);
    expect(fundingTarget(anchor, tenor, now, gap)).toBe(6);
  });

  it("differs from the no-gap formula once cohorts have accumulated", () => {
    const now = anchor + 5n * tenor;
    expect(deriveCohortId(anchor, tenor, now, 0n)).toBe(5);
    expect(deriveCohortId(anchor, tenor, now, gap)).toBe(4);
  });

  it("inside the gap the current cohort is still n, SETTLING, and n+1 is the funding target", () => {
    const now = at(5n, tenor + 100n);
    expect(deriveCohortId(anchor, tenor, now, gap)).toBe(5);
    expect(fundingTarget(anchor, tenor, now, gap)).toBe(6);
    const window = deriveCohortWindow(anchor, tenor, 5, gap);
    expect(deriveCohortStatus(window, false, new Date(Number(now) * 1000))).toBe("SETTLING");
    expect(deriveCohortStatus(window, true, new Date(Number(now) * 1000))).toBe("SETTLED");
  });

  it("exactly at startsAt(n+1) cohort n+1 is current and n+2 is the funding target", () => {
    const now = at(6n, 0n);
    expect(deriveCohortId(anchor, tenor, now, gap)).toBe(6);
    expect(fundingTarget(anchor, tenor, now, gap)).toBe(7);
  });

  it("before the anchor, cohort 0 is both current and the funding target", () => {
    const now = anchor - 500n;
    expect(deriveCohortId(anchor, tenor, now, gap)).toBe(0);
    expect(fundingTarget(anchor, tenor, now, gap)).toBe(0);
    const window = deriveCohortWindow(anchor, tenor, 0, gap);
    expect(deriveCohortStatus(window, false, new Date(Number(now) * 1000))).toBe("FUNDING");
  });

  it("endsAt is startsAt + tenor, not the next cohort's start", () => {
    const w = deriveCohortWindow(anchor, tenor, 2, gap);
    expect(new Date(w.startsAt).getTime() / 1000).toBe(Number(at(2n, 0n)));
    expect(new Date(w.endsAt).getTime() / 1000).toBe(Number(at(2n, tenor)));
  });
});

describe("rollTarget (AE3)", () => {
  it("rolls to n+1 in the gap after n", () => {
    expect(rollTarget(5, anchor, tenor, at(5n, tenor + 100n), gap)).toBe(6);
  });

  it("rolls to n+1 while n+1 is still funding, even before the gap", () => {
    expect(rollTarget(5, anchor, tenor, at(5n, 100n), gap)).toBe(6);
  });

  it("rolls to n+2 once n+1 has started", () => {
    expect(rollTarget(5, anchor, tenor, at(6n, 1n), gap)).toBe(7);
  });

  it("never rolls to the source cohort or behind it", () => {
    expect(rollTarget(9, anchor, tenor, at(5n, 100n), gap)).toBe(10);
  });
});
