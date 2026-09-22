import type { NumberedStepProps } from "@/types/aruna";

const statusClasses = {
  default: "bg-accent-soft text-accent",
  done: "bg-positive-soft text-positive",
  pending: "border border-accent text-accent",
};

export function NumberedStep({ index, status = "default", children }: NumberedStepProps) {
  return (
    <div className="flex gap-[14px] items-start">
      <span
        className={[
          "w-[26px] h-[26px] rounded-full inline-flex items-center justify-center font-mono text-[13px] flex-shrink-0",
          statusClasses[status],
        ].join(" ")}
      >
        {status === "done" ? "✓" : index}
      </span>
      <div className="flex-grow">{children}</div>
    </div>
  );
}
