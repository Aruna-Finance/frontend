import { deriveCohortId } from "@/lib/contracts/cohort-id";
import { formatDuration } from "@/lib/contracts/units";
import { buildTimeline, type CalendarFacts, type CohortRowFacts } from "@/lib/demo/timeline";

// Where the market is in its cycle. "gap" is the settlement window after a
// cohort ends and before the next one starts: nobody is covered, and the
// capital of the finished cohort is being settled.
export type MarketPhase = "not_started" | "active" | "gap";

// Why cover can or cannot be bought right now.
export type CoverReason = "open" | "cutoff" | "gap" | "not_started";

export interface MarketStatus {
  phase: MarketPhase;
  // The cohort the calendar is in (cohort 0 before the anchor).
  currentCohortId: number;
  cover: {
    canBuy: boolean;
    // The cohort a bought cover would belong to.
    cohortId: number;
    reason: CoverReason;
    // Unix seconds. While cover is open: the last moment to buy. Otherwise null.
    buyUntil: number | null;
    // Unix seconds the next cohort opens for cover. Null while cover is open.
    opensAt: number | null;
  };
  deposit: {
    // The first cohort that has not started: the only one a deposit is accepted into.
    cohortId: number;
    // Unix seconds the deposit window closes (the cohort starts).
    closesAt: number;
  };
}

// What the market page needs to say to each role, from the same calendar the
// demo console uses (buildTimeline, v2 with the settlement gap), so the two
// never disagree. Pure: pass the clock in.
export function summarizeMarket(
  calendar: CalendarFacts,
  rows: readonly CohortRowFacts[],
  nowSeconds: number,
): MarketStatus {
  const timeline = buildTimeline(calendar, rows, nowSeconds);
  const n = deriveCohortId(calendar.anchor, calendar.tenor, BigInt(nowSeconds), calendar.gap);
  // buildTimeline always includes n and n+1.
  const current = timeline.find((entry) => entry.id === n)!;
  const next = timeline.find((entry) => entry.id === n + 1)!;

  if (current.status === "FUNDING") {
    // Before the anchor: cohort 0 has not started, so it takes deposits and nothing is coverable yet.
    return {
      phase: "not_started",
      currentCohortId: n,
      cover: { canBuy: false, cohortId: n, reason: "not_started", buyUntil: null, opensAt: current.startsAt },
      deposit: { cohortId: n, closesAt: current.startsAt },
    };
  }

  if (current.status === "ACTIVE") {
    const buyUntil = current.buyCutoffAt!;
    const canBuy = nowSeconds < buyUntil;
    return {
      phase: "active",
      currentCohortId: n,
      cover: {
        canBuy,
        cohortId: n,
        reason: canBuy ? "open" : "cutoff",
        buyUntil: canBuy ? buyUntil : null,
        opensAt: canBuy ? null : next.startsAt,
      },
      deposit: { cohortId: n + 1, closesAt: next.startsAt },
    };
  }

  return {
    phase: "gap",
    currentCohortId: n,
    cover: { canBuy: false, cohortId: n + 1, reason: "gap", buyUntil: null, opensAt: next.startsAt },
    deposit: { cohortId: n + 1, closesAt: next.startsAt },
  };
}

export type StatusTone = "positive" | "accent" | "neutral";

export interface StatusHeadline {
  // Short badge text.
  tag: string;
  tone: StatusTone;
  // One line with the countdown that matters most to a visitor.
  text: string;
}

// The single line a market row or page header shows: what state the market is
// in and the next thing that will change. Durations come from formatDuration,
// never from a fixed "7 days".
export function statusHeadline(status: MarketStatus, nowSeconds: number): StatusHeadline {
  const left = (at: number) => formatDuration(at - nowSeconds);
  switch (status.phase) {
    case "not_started":
      return { tag: "Not started", tone: "neutral", text: `Opens in ${left(status.cover.opensAt!)}` };
    case "gap":
      return { tag: "Settling", tone: "accent", text: `Next cohort opens in ${left(status.cover.opensAt!)}` };
    case "active":
      return status.cover.canBuy
        ? { tag: "Active", tone: "positive", text: `Cover sales close in ${left(status.cover.buyUntil!)}` }
        : { tag: "Active", tone: "accent", text: `Cover sales closed · next cohort in ${left(status.cover.opensAt!)}` };
  }
}
