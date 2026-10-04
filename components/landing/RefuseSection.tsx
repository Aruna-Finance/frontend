"use client";

import React from "react";

interface RefuseSectionProps {
  cCapRef: React.RefObject<HTMLCanvasElement>;
  cTwapRef: React.RefObject<HTMLCanvasElement>;
  cLiaRef: React.RefObject<HTMLCanvasElement>;
}

export function RefuseSection({ cCapRef, cTwapRef, cLiaRef }: RefuseSectionProps) {
  return (
    <section className="border-t border-on-accent/20 py-[clamp(80px,12vw,160px)] bg-accent">
      <div className="px-[24px] lg:px-[48px] w-full">

        <div className="mb-[56px]">
          <h2 className="font-display text-[clamp(2.6rem,5vw,5.5rem)] leading-[0.95] font-normal tracking-[-0.04em] text-on-accent">
            What we refuse to do.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-on-accent/15">

          <div className="bg-pitch-raised p-[36px] flex flex-col min-h-[380px]">
            <canvas ref={cCapRef} className="block w-full flex-1 mb-[28px]" />
            <h3 className="font-display text-[clamp(1.6rem,2.1vw,2.3rem)] font-normal leading-[1.05] tracking-[-0.03em]">
              If capacity isn't there,<br />the cover isn't sold.
            </h3>
          </div>

          <div className="bg-pitch-raised p-[36px] flex flex-col min-h-[380px]">
            <canvas ref={cTwapRef} className="block w-full flex-1 mb-[28px] bg-pitch-raised" />
            <h3 className="font-display text-[clamp(1.6rem,2.1vw,2.3rem)] font-normal leading-[1.05] tracking-[-0.03em]">
              A flash-loan wick can't<br />manufacture variance.
            </h3>
          </div>

          <div className="bg-pitch-raised p-[36px] flex flex-col min-h-[380px]">
            <canvas ref={cLiaRef} className="block w-full flex-1 mb-[28px]" />
            <h3 className="font-display text-[clamp(1.6rem,2.1vw,2.3rem)] font-normal leading-[1.05] tracking-[-0.03em]">
              The premium is your<br />maximum loss. Always.
            </h3>
          </div>

        </div>
      </div>
    </section>
  );
}
