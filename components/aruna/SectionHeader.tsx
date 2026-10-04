import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  // One line saying what this section shows and why it matters.
  description?: string;
  // Optional right-aligned slot (a legend, a link).
  aside?: ReactNode;
}

// The heading that tells a reader what a block of the page is for, so data
// sections read differently from the action cards above them.
export function SectionHeader({ title, description, aside }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-[16px] pb-[14px]">
      <div className="min-w-0">
        <h2 className="text-[18px] font-semibold">{title}</h2>
        {description ? <p className="text-[14px] text-foreground-secondary pt-[4px] max-w-[640px]">{description}</p> : null}
      </div>
      {aside ? <div className="shrink-0 text-[13px] text-foreground-muted">{aside}</div> : null}
    </div>
  );
}
