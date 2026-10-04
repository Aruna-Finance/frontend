"use client";

import React from "react";

interface ComparisonSectionProps {
  chCalmRef: React.RefObject<HTMLCanvasElement>;
  chWhipRef: React.RefObject<HTMLCanvasElement>;
  calmBarFill: React.RefObject<HTMLDivElement>;
  calmBarText: React.RefObject<HTMLSpanElement>;
  whipBarFill: React.RefObject<HTMLDivElement>;
  whipBarText: React.RefObject<HTMLSpanElement>;
  scrubThumb: React.RefObject<HTMLDivElement>;
  cmpTOut: React.RefObject<HTMLOutputElement>;
  calmRv: number;
  whipRv: number;
  onScrub: (v: number) => void;
}

export function ComparisonSection({
  chCalmRef,
  chWhipRef,
  calmBarFill,
  calmBarText,
  whipBarFill,
  whipBarText,
  scrubThumb,
  cmpTOut,
  calmRv,
  whipRv,
  onScrub,
}: ComparisonSectionProps) {
  return (
    <section className="border-t border-border py-[clamp(80px,12vw,160px)] bg-cream">
      <div className="px-[24px] lg:px-[40px] w-full max-w-[1600px] mx-auto">

        <div className="mb-[56px]">
          <h2 className="font-display text-[clamp(2.6rem,5vw,5.5rem)] leading-[0.95] font-normal tracking-[-0.04em] text-ink">
            Same path.<br />Different risk.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-[1px] bg-transparent">

          {/* calm */}
          <div className="bg-white min-h-[620px] p-[28px] lg:p-[36px]">
            <div className="flex justify-between items-start gap-[12px] mb-[24px]">
              <div className="font-display text-[clamp(2rem,2.8vw,2.8rem)] font-normal tracking-[-0.03em] text-ink">
                Calm drift
              </div>
              <div className="border border-cream-border px-[10px] py-[6px] font-mono text-[11px] whitespace-nowrap text-ink-subtle bg-cream shrink-0">
                realized {(calmRv * 100).toFixed(1)}% vol
              </div>
            </div>
            <canvas ref={chCalmRef} className="block w-full h-[400px] cursor-crosshair" />
            <div className="mt-[20px] flex items-center gap-[14px]">
              <span className="font-mono text-[10px] text-ink-subtle shrink-0">variance accrued</span>
              <div className="flex-1 h-[3px] bg-cream-border-soft overflow-hidden">
                <div ref={calmBarFill} className="h-full bg-ink-muted" />
              </div>
              <span ref={calmBarText} className="font-mono text-[11px] text-ink shrink-0">0.0000</span>
            </div>
            <p className="mt-[20px] text-[13px] text-ink-muted leading-[1.6]">
              Little variance accumulated. Little impermanent loss. No payout owed - and the premium reflected that up front.
            </p>
          </div>

          {/* whipsaw */}
          <div className="bg-white min-h-[620px] p-[28px] lg:p-[36px]">
            <div className="flex justify-between items-start gap-[12px] mb-[24px]">
              <div className="font-display text-[clamp(2rem,2.8vw,2.8rem)] font-normal tracking-[-0.03em] text-accent-dim">
                Whipsaw
              </div>
              <div className="border border-accent-dim/30 px-[10px] py-[6px] font-mono text-[11px] whitespace-nowrap text-accent-dim bg-accent-dim/[0.06] shrink-0">
                realized {(whipRv * 100).toFixed(1)}% vol
              </div>
            </div>
            <canvas ref={chWhipRef} className="block w-full h-[400px] cursor-crosshair" />
            <div className="mt-[20px] flex items-center gap-[14px]">
              <span className="font-mono text-[10px] text-ink-subtle shrink-0">variance accrued</span>
              <div className="flex-1 h-[3px] bg-cream-border-soft overflow-hidden">
                <div ref={whipBarFill} className="h-full bg-accent-dim" />
              </div>
              <span ref={whipBarText} className="font-mono text-[11px] text-accent-dim shrink-0">0.0000</span>
            </div>
            <p className="mt-[20px] text-[13px] text-ink-muted leading-[1.6]">
              Every swing is rebalanced against you. Variance is what drained the position, so variance is what the contract pays on.
            </p>
          </div>

        </div>

        {/* scrubber bar */}
        <div className="flex items-center gap-[16px] mt-[1px] px-[20px] py-[14px]">
          <div
            className="flex-1 relative h-[20px] flex items-center cursor-pointer"
            onPointerDown={e => {
              const r = e.currentTarget.getBoundingClientRect();
              const v = Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 1000);
              onScrub(v);
              const move = (ev: PointerEvent) => {
                const v2 = Math.round(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * 1000);
                onScrub(v2);
              };
              const up = () => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
              };
              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);
            }}
          >
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-cream-track" />
            <div
              ref={scrubThumb}
              className="absolute top-1/2 -translate-y-1/2 w-[10px] h-[10px] rotate-45 bg-accent-dim"
              style={{ left: "calc(0% - 5px)" }}
            />
          </div>
          <output ref={cmpTOut} className="shrink-0 font-mono text-[10px] text-ink-subtle min-w-[7em] text-right">
            day 0.0 / 7
          </output>
        </div>

      </div>
    </section>
  );
}
