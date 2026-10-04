import Link from "next/link";
import Image from "next/image";
import { GradientWordmark } from "@/components/aruna/GradientWordmark";
import { brandCopy } from "@/lib/content/copy";
import { primaryNavLinks } from "@/lib/nav";

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="w-full max-w-[1440px] mx-auto px-[24px] lg:px-[48px]">

        <div className="py-[40px] flex flex-col md:flex-row md:justify-between gap-[32px]">
          <div className="flex flex-col gap-[10px] max-w-[320px]">
            <div className="flex items-center gap-[8px]">
              <Image src="/images/logo.png" alt="" width={22} height={22} />
              <span className="font-display text-[22px] text-foreground">{brandCopy.name}</span>
            </div>
            <span className="font-mono text-[11px] tracking-[0.1em] text-foreground-muted">
              IMPERMANENT LOSS COVER · UNISWAP V3
            </span>
          </div>
          <nav className="flex flex-wrap gap-x-[32px] gap-y-[10px] text-[14px]">
            {primaryNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-secondary hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-border py-[20px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[8px] sm:gap-[16px]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-[4px] sm:gap-[16px]">
            <span className="font-mono text-[12px] text-foreground-muted">
              © {new Date().getFullYear()} Aruna
            </span>
            <span className="font-mono text-[12px] text-foreground-muted">
              Cover is capped by vault capacity. Read the settlement method before buying.
            </span>
          </div>
          <div className="flex gap-[16px]">
            <Link
              href="/proof"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-foreground-muted hover:text-foreground transition-colors"
            >
              Settlement proof
            </Link>
            <Link
              href="/states"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-foreground-muted hover:text-foreground transition-colors"
            >
              UI states
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
