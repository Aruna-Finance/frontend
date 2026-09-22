import { Button } from "./Button";
import type { StateCardProps, Tone } from "@/types/aruna";

const toneTextClasses: Record<Tone, string> = {
  accent: "text-accent",
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-foreground-muted",
};

const toneBorderClasses: Record<Tone, string> = {
  accent: "border-border-warning",
  positive: "border-border",
  negative: "border-border-danger",
  neutral: "border-border",
};

export function StateCard({ title, tag, tone = "neutral", message, actions = [], footnote }: StateCardProps) {
  return (
    <div className={["rounded-card border bg-surface p-[24px]", toneBorderClasses[tone]].join(" ")}>
      <div className="flex justify-between items-center">
        <span className="text-[15px] font-semibold">{title}</span>
        <span className={["font-mono text-[11px]", toneTextClasses[tone]].join(" ")}>{tag}</span>
      </div>
      <div className="bg-canvas rounded-control p-[16px] mt-[14px]">
        <div className="text-[14px] text-foreground">{message}</div>
        {actions.length > 0 ? (
          <div className="flex gap-[10px] pt-[14px]">
            {actions.map((action) => (
              <Button key={action.label} variant={action.variant ?? "ghost"} size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {footnote ? <div className="text-[13px] text-foreground-muted pt-[12px]">{footnote}</div> : null}
    </div>
  );
}
