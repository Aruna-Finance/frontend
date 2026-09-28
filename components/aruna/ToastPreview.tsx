"use client";

import { Button } from "./Button";
import { toast } from "@/lib/toast";
import { statesCopy } from "@/lib/content/copy";

// Reference triggers for the global toast, shown on /states next to the other
// state mockups. Real flows call `toast` from "@/lib/toast" directly.
export function ToastPreview() {
  const copy = statesCopy.toasts;

  return (
    <div className="rounded-card border border-border bg-surface p-[24px]">
      <div className="text-[15px] font-semibold">{copy.heading}</div>
      <p className="text-[14px] text-foreground-secondary pt-[6px]">{copy.subtitle}</p>
      <div className="flex flex-wrap gap-[10px] pt-[16px]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast.success(copy.successTitle, { description: copy.successDescription })}
        >
          {copy.successLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast.error(copy.errorTitle, { description: copy.errorDescription })}
        >
          {copy.errorLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            toast.success(copy.actionTitle, {
              description: copy.actionDescription,
              action: { label: copy.actionLink, href: "https://sepolia.arbiscan.io" },
            })
          }
        >
          {copy.actionLabel}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => toast.dismiss()}>
          {copy.clearLabel}
        </Button>
      </div>
    </div>
  );
}
