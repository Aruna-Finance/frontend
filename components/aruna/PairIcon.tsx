import { TokenIcon } from "./TokenIcon";

interface PairIconProps {
  symbol0: string;
  symbol1: string;
  size?: number;
  className?: string;
}

// Two overlapping token icons, Uniswap-pair style. The ring color assumes a
// bg-surface (or close) backdrop, which is what every place this renders on
// (cards, table rows) uses.
export function PairIcon({ symbol0, symbol1, size = 24, className = "" }: PairIconProps) {
  const overlap = Math.round(size * 0.6);
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size + overlap, height: size }}
    >
      <span className="absolute left-0 top-0 rounded-full ring-2 ring-surface">
        <TokenIcon symbol={symbol0} size={size} />
      </span>
      <span className="absolute top-0 rounded-full ring-2 ring-surface" style={{ left: overlap }}>
        <TokenIcon symbol={symbol1} size={size} />
      </span>
    </span>
  );
}
