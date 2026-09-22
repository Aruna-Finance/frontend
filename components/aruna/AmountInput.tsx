import type { AmountInputProps } from "@/types/aruna";

export function AmountInput({ id, label, value, unit, quickActions = [], onChange, meta }: AmountInputProps) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
        {label}
      </label>
      <div className="flex gap-[12px] items-center pt-[12px]">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="h-[56px] flex-grow px-[16px] rounded-button border border-border bg-canvas text-foreground font-mono text-[24px]"
        />
        <span className="font-mono text-[15px] text-foreground-muted">{unit}</span>
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={[
              "h-[44px] px-[14px] rounded-control text-[13px]",
              action.active
                ? "border border-accent bg-accent-soft text-foreground"
                : "border border-border text-foreground",
            ].join(" ")}
          >
            {action.label}
          </button>
        ))}
      </div>
      {meta ? (
        <div className="flex justify-between pt-[10px] font-mono text-[12px] text-foreground-muted">
          <span>{meta.start}</span>
          <span>{meta.end}</span>
        </div>
      ) : null}
    </div>
  );
}
