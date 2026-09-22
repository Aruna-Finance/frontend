import Link from "next/link";
import type { ButtonProps } from "@/types/aruna";

const sizeClasses = {
  default: "h-[48px] px-[22px] text-[14px] gap-[10px]",
  sm: "h-[44px] px-[16px] text-[13px] gap-[8px]",
};

const variantClasses = {
  primary: "bg-accent text-on-accent font-semibold hover:bg-accent-hover",
  ghost: "border border-border text-foreground",
};

const disabledClasses =
  "border border-border text-foreground-muted bg-transparent cursor-not-allowed hover:bg-transparent";

export function Button({
  children,
  variant = "primary",
  size = "default",
  href,
  disabled = false,
  type = "button",
  onClick,
  icon,
  className = "",
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center rounded-button transition-colors",
    sizeClasses[size],
    disabled ? disabledClasses : variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon ? (
        <span className="inline-flex w-[18px] h-[18px] shrink-0 [&>svg]:w-full [&>svg]:h-full">{icon}</span>
      ) : null}
      {children}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
