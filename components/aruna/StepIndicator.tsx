import type { StepIndicatorProps } from "@/types/aruna";

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-[12px] font-mono text-[12px] text-foreground-muted">
      {steps.map((step, index) => (
        <span key={step} className="flex items-center gap-[12px]">
          <span className={index === currentIndex ? "text-accent" : undefined}>
            {index + 1} · {step}
          </span>
          {index < steps.length - 1 ? <span>—</span> : null}
        </span>
      ))}
    </div>
  );
}
