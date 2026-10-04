"use client";

import React from "react";
import { Button } from "@/components/aruna/Button";

interface HeroSectionProps {
  c3dRef: React.RefObject<HTMLCanvasElement>;
}

export function HeroSection({ c3dRef }: HeroSectionProps) {
  return (
    <section className="relative min-h-[calc(100svh-72px)] flex flex-col justify-center py-[18px] lg:py-[20px]">
      <div
        className="absolute top-[15%] left-[8%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(224,138,74,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative px-[16px] sm:px-[24px] lg:px-[28px] py-[28px] lg:py-[32px] w-full max-w-[1600px] mx-auto bg-pitch-raised">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,0.52fr)_minmax(0,1.48fr)] gap-[26px] lg:gap-[32px] items-stretch min-h-[clamp(600px,calc(100svh-112px),820px)]">

          <div className="flex flex-col justify-between pt-[8px] pb-0 lg:pt-[20px] lg:pb-0">
            <div className="flex flex-1 items-center">
              <div className="w-full max-w-[430px]">
                <h1 className="font-display text-[clamp(2rem,3.2vw,3.8rem)] leading-[0.98] font-normal tracking-[-0.015em]">
                  Cover priced<br />
                  by how{" "}
                  <em className="text-accent not-italic" style={{ animation: "wildPulse 3s ease-in-out infinite" }}>wildly</em>
                  <br />
                  price moves.
                </h1>
                <p className="text-foreground-muted text-[clamp(0.95rem,1.1vw,1.05rem)] mt-[40px] mb-0 max-w-[24em] leading-[1.7]">
                  Variance, not direction. Settlement reads realized variance directly from the pool's TWAP oracle.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-[10px] p-0 m-0 mt-[30px]">
              <Button href="/protect" className="!rounded-none">Protect a position</Button>
              <Button variant="ghost" href="/underwrite" className="!rounded-none">Underwrite</Button>
            </div>
          </div>

          <div className="bg-pitch relative overflow-hidden min-h-[520px] lg:min-h-0 flex flex-col">
            <canvas
              ref={c3dRef}
              className="block w-full flex-1 min-h-0 cursor-grab active:cursor-grabbing"
              aria-label="3D impermanent loss surface"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
