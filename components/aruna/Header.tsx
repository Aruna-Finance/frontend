import Link from "next/link";
import Image from "next/image";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button";
import { HideOnScrollHeader } from "./HideOnScrollHeader";
import { WalletButton } from "./WalletButton";
import { brandCopy, landingCopy } from "@/lib/content/copy";
import { primaryNavLinks } from "@/lib/nav";
import type { HeaderProps } from "@/types/aruna";

export function Header({
  variant = "app",
  navLinks = primaryNavLinks,
  secondaryAction,
  extra,
}: HeaderProps) {
  if (variant === "landing") {
    return (
      <HideOnScrollHeader className="border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-[12px] w-full max-w-[1440px] mx-auto px-[20px] sm:px-[48px] py-[14px] sm:py-0 sm:h-[72px]">
          <div className="flex items-center gap-[16px] sm:gap-[32px]">
            <div className="flex items-center gap-[8px]">
              <Image src="/images/logo.png" alt="" width={28} height={28} />
              <span className="font-display text-[26px] text-foreground">{brandCopy.name}</span>
            </div>
            <span className="hidden sm:inline font-mono text-[11px] tracking-[0.1em] text-foreground-muted">
              {brandCopy.chainTag}
            </span>
          </div>
          <div className="flex items-center gap-[10px] sm:gap-[12px]">
            <Button variant="primary" size="sm" href="/markets" newTab>
              {landingCopy.nav.useAruna}
              <ArrowUpRightIcon aria-hidden className="w-[16px] h-[16px]" />
            </Button>
          </div>
        </div>
      </HideOnScrollHeader>
    );
  }

  return (
    <header className="border-b border-border bg-header">
      <div className="flex flex-wrap items-center justify-between gap-[12px] w-full max-w-[1440px] mx-auto px-[20px] sm:px-[32px] py-[12px] sm:py-0 sm:h-[64px]">
        <div className="flex items-center gap-[18px] sm:gap-[30px]">
          <div className="flex items-center gap-[8px] font-display text-[24px] text-foreground">
            <Image src="/images/logo.png" alt="" width={24} height={24} />
            {brandCopy.name}
          </div>
          <nav className="flex flex-wrap gap-[14px] sm:gap-[22px] text-[14px]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.active
                    ? "text-foreground border-b-2 border-accent pb-[4px]"
                    : "text-foreground-muted"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-[10px]">
          {extra}
          {secondaryAction ? (
            <Button variant="ghost" size="sm" href={secondaryAction.href}>
              {secondaryAction.label}
            </Button>
          ) : null}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
