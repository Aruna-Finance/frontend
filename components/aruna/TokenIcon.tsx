import Image from "next/image";
import { tokenIconPath } from "@/lib/contracts/token-icons";

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

// A known token's real logo, or a lettered circle for anything this testnet
// made up that doesn't stand in for a token we have an icon for - same
// fallback style as the unrecognized-wallet tiles in WalletModal.
export function TokenIcon({ symbol, size = 24, className = "" }: TokenIconProps) {
  const path = tokenIconPath(symbol);
  if (path) {
    return (
      <Image
        src={path}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={`rounded-full shrink-0 ${className}`}
      />
    );
  }
  const initial = symbol.replace(/^m/i, "").charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full shrink-0 bg-surface-raised border border-border font-display text-foreground-secondary ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {initial}
    </span>
  );
}
