import { sharedNavCopy } from "@/lib/content/copy";

export interface NavLinkItem {
  label: string;
  href: string;
  active?: boolean;
}

export const primaryNavLinks: NavLinkItem[] = [
  { label: sharedNavCopy.markets, href: "/markets" },
  { label: sharedNavCopy.protect, href: "/protect" },
  { label: sharedNavCopy.underwrite, href: "/underwrite" },
  { label: sharedNavCopy.proof, href: "/proof" },
];

export function withActiveNavLink(href: string): NavLinkItem[] {
  return primaryNavLinks.map((link) => ({ ...link, active: link.href === href }));
}
