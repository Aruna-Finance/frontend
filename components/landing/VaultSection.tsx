"use client";

import React from "react";

interface VaultState {
  vol: string;
  pay: string;
  lp: string;
  uw: string;
  note: string;
}

interface VaultSectionProps {
  cvaultRef: React.RefObject<HTMLCanvasElement>;
  vault: VaultState;
  onVolChange: (v: number) => void;
}

export function VaultSection({ cvaultRef, vault, onVolChange }: VaultSectionProps) {
  const rows: [string, string, boolean][] = [
    ["Payout to LP", vault.pay, false],
    ["LP net", vault.lp, true],
    ["Underwriter net", vault.uw, true],
  ];

  return (
    <section className="py-[clamp(80px,12vw,160px)] bg-pitch">
      <div className="px-[24px] lg:px-[48px] w-full">

        <div className="mb-[56px]">
          <h2 className="font-display text-[clamp(2.6rem,5vw,5.5rem)] leading-[0.95] font-normal tracking-[-0.04em]">
            Variance decides<br />what comes out.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] bg-border gap-[1px]">
          <canvas
            ref={cvaultRef}
            className="block w-full h-[500px] bg-pitch"
            aria-label="Vault flow simulation"
          />
          <div className="bg-pitch p-[28px] flex flex-col gap-[20px]">
            <div>
              <div className="font-mono text-[9px] tracking-[0.14em] text-foreground-muted mb-[8px]">
                REALIZED VOL THIS CYCLE
              </div>
              <div className="font-display text-[4rem] font-normal leading-[1] tracking-[-0.04em] text-accent">
                {vault.vol}
              </div>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={0.1}
              defaultValue={63.7}
              onChange={e => onVolChange(+e.target.value)}
              className="w-full cursor-pointer"
            />
            <div className="flex flex-col gap-0 border-t border-border pt-[16px]">
              {rows.map(([k, v, signed]) => (
                <div key={k} className="flex justify-between items-center py-[11px] border-b border-border">
                  <span className="text-[13px] text-foreground-muted">{k}</span>
                  <strong className={`font-mono text-[13px] tabular-nums ${signed && v.startsWith("+") ? "text-accent" : ""}`}>
                    {v}
                  </strong>
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] text-foreground-muted leading-[1.6] mt-auto">
              {vault.note}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
