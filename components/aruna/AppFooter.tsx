import Link from "next/link";
import Image from "next/image";
import { brandCopy } from "@/lib/content/copy";
import { primaryNavLinks } from "@/lib/nav";

export function AppFooter() {
  return (
    <footer className="bg-pitch-raised mt-auto">
      <div className="w-full max-w-[1440px] mx-auto px-[24px] lg:px-[32px]">

        <div className="py-[32px] flex flex-col md:flex-row md:justify-between gap-[24px]">
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center gap-[8px]">
              <Image src="/images/logo.png" alt="" width={20} height={20} />
              <span className="font-display text-[20px] text-foreground">{brandCopy.name}</span>
            </div>
            <span className="font-mono text-[11px] tracking-[0.1em] text-foreground-muted">
              IMPERMANENT LOSS COVER · UNISWAP V3
            </span>
          </div>
          <nav className="flex flex-wrap gap-x-[28px] gap-y-[10px] text-[13px]">
            {primaryNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-border py-[16px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[6px] sm:gap-[12px]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-[4px] sm:gap-[12px]">
            <span className="font-mono text-[11px] text-foreground-muted">
              © {new Date().getFullYear()} Aruna
            </span>
            <span className="font-mono text-[11px] text-foreground-muted">
              Cover is capped by vault capacity. Read the settlement method before buying.
            </span>
          </div>
          <Link
            href="/proof"
            className="text-[12px] text-foreground-muted hover:text-foreground transition-colors"
          >
            Settlement proof
          </Link>
        </div>

      </div>
    </footer>
  );
}
