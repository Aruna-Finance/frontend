"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import type { HeaderNavLink, HeaderSecondaryAction } from "@/types/aruna";

interface SidebarProps {
  navLinks: HeaderNavLink[];
  extra?: ReactNode;
  secondaryAction?: HeaderSecondaryAction;
}

export function Sidebar({ navLinks, extra, secondaryAction }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* hamburger trigger */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-[36px] h-[36px] text-foreground-secondary hover:text-foreground transition-colors"
      >
        <Bars3Icon className="w-[20px] h-[20px]" />
      </button>

      {/* backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-pitch-raised z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* top row */}
        <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-border shrink-0">
          <span className="font-mono text-[11px] tracking-[0.12em] text-foreground-muted uppercase">Menu</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-[36px] h-[36px] text-foreground-secondary hover:text-foreground transition-colors"
          >
            <XMarkIcon className="w-[20px] h-[20px]" />
          </button>
        </div>

        {/* cohort chip / extra */}
        {extra && (
          <div className="px-[24px] py-[16px] border-b border-border shrink-0">
            {extra}
          </div>
        )}

        {/* nav links */}
        <nav className="flex flex-col flex-1 px-[24px] py-[8px] overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={[
                "py-[16px] text-[15px] border-b border-border last:border-b-0 transition-colors",
                link.active
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-foreground",
              ].join(" ")}
            >
              {link.label}
            </Link>
          ))}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              onClick={() => setOpen(false)}
              className="py-[16px] text-[15px] text-foreground-muted hover:text-foreground transition-colors border-b border-border last:border-b-0"
            >
              {secondaryAction.label}
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
