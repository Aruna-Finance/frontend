import type { ReactNode } from "react";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";
import type { Tone } from "@/types/aruna";

export interface RoleCardStat {
  label: string;
  value: ReactNode;
  tone?: Tone;
  // Explains the label or carries the full figure behind a shortened value.
  hint?: string;
}

interface RoleCardProps {
  // The role this card is for, e.g. "Liquidity provider".
  role: string;
  // The action in plain words, e.g. "Protect your LP position".
  title: string;
  // One sentence on what the user gets.
  description: string;
  stats: RoleCardStat[];
  // Plain statement of the risk or limit that applies to this role.
  note?: string;
  cta: { label: string; href: string; disabled?: boolean };
  // Why the CTA is unavailable right now, shown above the button.
  ctaNote?: string;
}

const toneClasses: Record<Tone, string> = {
  accent: "text-accent",
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-foreground",
};

// One of the two things a visitor can do in a market. It is the only place a
// market page asks the visitor to act, and it is framed (accent top rule, a
// button inside the card) so it reads as a choice, not as another data panel.
export function RoleCard({ role, title, description, stats, note, cta, ctaNote }: RoleCardProps) {
  return (
    <section className="flex flex-col bg-pitch-raised border border-border border-t-2 border-t-accent p-[24px] gap-[20px]">
      <div>
        <div className="text-[11px] tracking-[0.07em] uppercase text-accent">{role}</div>
        <h2 className="font-display text-[24px] font-normal pt-[8px]">{title}</h2>
        <p className="text-[14px] leading-[1.6] text-foreground-secondary pt-[8px]">{description}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-[20px] gap-y-[16px]">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {stat.hint ? <Tooltip content={stat.hint}>{stat.label}</Tooltip> : stat.label}
            </dt>
            <dd className={["font-mono text-[18px] pt-[6px] truncate", toneClasses[stat.tone ?? "neutral"]].join(" ")}>
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {note ? <p className="text-[13px] leading-[1.6] text-foreground-muted border-t border-border pt-[14px]">{note}</p> : null}

      <div className="mt-auto flex flex-col gap-[10px]">
        {ctaNote ? <p className="text-[13px] text-foreground-secondary">{ctaNote}</p> : null}
        <Button href={cta.href} disabled={cta.disabled} className="w-full">
          {cta.label}
        </Button>
      </div>
    </section>
  );
}
