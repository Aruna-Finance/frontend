import type { NumberedStepProps } from "@/types/aruna";

const statusToneClasses = {
  default: "text-foreground-muted",
  done: "text-positive",
  pending: "text-accent",
};

export function NumberedStep({ index, status = "default", statusLabel, children }: NumberedStepProps) {
  return (
    <div className="flex gap-[14px] items-start">
      <span className="font-mono text-[12px] text-foreground-muted tabular-nums pt-[2px] flex-shrink-0">
        {String(index).padStart(2, "0")}
      </span>
      <div className="flex-grow">{children}</div>
      {statusLabel ? (
        <span
          className={`font-mono text-[10px] tracking-[0.08em] uppercase pt-[3px] flex-shrink-0 ${statusToneClasses[status]}`}
        >
          {statusLabel}
        </span>
      ) : null}
    </div>
  );
}
