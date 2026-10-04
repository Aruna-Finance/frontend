import { formatCompact, formatPercent } from "@/lib/format";
import type { CycleResult } from "@/lib/vault-yield";

interface CohortHistoryProps {
  rows: readonly CycleResult[];
  labels: {
    cohort: string;
    capital: string;
    premiums: string;
    claims: string;
    result: string;
  };
  emptyText: string;
}

// The latest completed cohorts of one vault, newest first: what was committed,
// what came in as premiums, what went out as claims, and the net result.
export function CohortHistory({ rows, labels, emptyText }: CohortHistoryProps) {
  if (rows.length === 0) {
    return (
      <div className="py-[28px] text-center text-[14px] text-foreground-muted">
        {emptyText}
      </div>
    );
  }
  // A fixed minimum width keeps every column readable on a phone; the table
  // scrolls sideways rather than squeezing the figures into each other.
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col min-w-[460px]">
        <div className="grid grid-cols-5 gap-[8px] px-[4px] pb-[10px] text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
          <span>{labels.cohort}</span>
          <span className="text-right">{labels.capital}</span>
          <span className="text-right">{labels.premiums}</span>
          <span className="text-right">{labels.claims}</span>
          <span className="text-right">{labels.result}</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.cohortId}
            className="grid grid-cols-5 gap-[8px] px-[4px] py-[12px] border-t border-border font-mono text-[13px] items-center"
          >
            <span className="whitespace-nowrap">Cohort {row.cohortId}</span>
            <span className="text-right">{formatCompact(row.capitalUsdc)}</span>
            <span className="text-right">
              {formatCompact(row.premiumsUsdc)}
            </span>
            <span className="text-right">{formatCompact(row.claimsUsdc)}</span>
            <span
              className={[
                "text-right whitespace-nowrap",
                row.netUsdc >= 0 ? "text-positive" : "text-negative",
              ].join(" ")}
            >
              {formatPercent(row.percent, { signed: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
