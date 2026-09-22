import type { AcknowledgeCheckboxProps } from "@/types/aruna";

export function AcknowledgeCheckbox({ id, checked, onChange, children }: AcknowledgeCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex gap-[12px] items-start text-[14.5px] leading-[1.6] text-foreground-secondary cursor-pointer"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        className="w-[20px] h-[20px] mt-[1px] accent-accent"
      />
      <span>{children}</span>
    </label>
  );
}
