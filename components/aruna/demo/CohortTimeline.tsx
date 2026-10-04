"use client";

import { formatUnits } from "viem";
import { Badge } from "@/components/aruna/Badge";
import { Card } from "@/components/aruna/Card";
import { demoCopy } from "@/lib/content/copy";
import { USDC_DECIMALS } from "@/lib/contracts/units";
import { formatCountdown } from "@/lib/demo/countdown";
import type { TimelineEntry } from "@/lib/demo/timeline";
import { formatUsdc } from "@/lib/format";
import type { Tone } from "@/types/aruna";

const statusTone: Record<TimelineEntry["status"], Tone> = {
  FUNDING: "accent",
  ACTIVE: "positive",
  SETTLING: "neutral",
  SETTLED: "neutral",
};

function note(entry: TimelineEntry): string | null {
  if (entry.status === "SETTLING") return demoCopy.timeline.needsKeeper;
  if (entry.status === "SETTLED") return demoCopy.timeline.settledNote;
  if (entry.status === "FUNDING") return demoCopy.timeline.fundingNote;
  return null;
}

// Cohorts n-1, n and n+1 side by side, each with the countdown to its next
// boundary. While n is ACTIVE you can deposit into n+1, buy cover in n, and
// collect from n-1, which is the whole two-sided cycle on one screen.
export function CohortTimeline({
  entries,
  now,
  policyCap,
}: {
  entries: TimelineEntry[];
  now: number;
  policyCap: number | undefined;
}) {
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{demoCopy.timeline.label}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
        {entries.map((entry) => {
          const detail = note(entry);
          return (
            <Card key={entry.id} variant={entry.status === "ACTIVE" ? "raised" : "default"} className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between gap-[8px]">
                <span className="text-[17px] font-semibold">{demoCopy.timeline.cohort(entry.id)}</span>
                <Badge label={demoCopy.timeline.status[entry.status]} tone={statusTone[entry.status]} />
              </div>
              {entry.boundary ? (
                <div>
                  <div className="text-[12px] text-foreground-muted">{demoCopy.timeline.boundary[entry.boundary.kind]}</div>
                  <div className="font-mono text-[28px] pt-[2px]">{formatCountdown(entry.boundary.at - now)}</div>
                </div>
              ) : null}
              {detail ? <p className="text-[13.5px] leading-[1.55] text-foreground-secondary">{detail}</p> : null}
              <div className="font-mono text-[12px] text-foreground-muted border-t border-border pt-[10px] flex flex-col gap-[2px]">
                <span>{demoCopy.timeline.policies(entry.policyCount, policyCap)}</span>
                <span>
                  {demoCopy.timeline.capital(formatUsdc(Number(formatUnits(entry.totalCapital, USDC_DECIMALS))))}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
