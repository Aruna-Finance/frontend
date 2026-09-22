import Link from "next/link";
import { WalletIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button";
import { brandCopy, landingCopy } from "@/lib/content/copy";
import { primaryNavLinks } from "@/lib/nav";
import type { HeaderProps } from "@/types/aruna";

export function Header({
  variant = "app",
  navLinks = primaryNavLinks,
  walletAddress,
  secondaryAction,
  extra,
}: HeaderProps) {
  if (variant === "landing") {
    return (
      <header className="flex flex-wrap items-center justify-between gap-[12px] px-[20px] sm:px-[48px] py-[14px] sm:py-0 sm:h-[72px] border-b border-border">
        <div className="flex items-center gap-[16px] sm:gap-[32px]">
          <span className="font-display text-[26px] text-foreground">{brandCopy.name}</span>
          <span className="hidden sm:inline font-mono text-[11px] tracking-[0.1em] text-foreground-muted">
            {brandCopy.chainTag}
          </span>
        </div>
        <div className="flex items-center gap-[10px] sm:gap-[12px]">
          <Button variant="ghost" size="sm" href="/markets">
            {landingCopy.nav.openApp}
          </Button>
          <Button variant="primary" size="sm" href="/protect" icon={<WalletIcon />}>
            {landingCopy.nav.connectWallet}
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-[12px] px-[20px] sm:px-[32px] py-[12px] sm:py-0 sm:h-[64px] border-b border-border bg-header">
      <div className="flex items-center gap-[18px] sm:gap-[30px]">
        <Link href="/" className="font-display text-[24px] text-foreground">
          {brandCopy.name}
        </Link>
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
        {walletAddress ? (
          <span className="inline-flex items-center h-[36px] px-[12px] rounded-control border border-border font-mono text-[12px] text-foreground-secondary">
            {walletAddress}
          </span>
        ) : null}
      </div>
    </header>
  );
}
