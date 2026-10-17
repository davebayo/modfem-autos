"use client";

import { Menu } from "lucide-react";

interface BottomFooterProps {
  onOpenMenu: () => void;
}

export function BottomFooter({ onOpenMenu }: BottomFooterProps) {
  return (
    <footer className="flex h-14 shrink-0 items-center justify-between gap-4 border-t border-white/10 px-4 md:h-16 md:px-8">
      <p className="min-w-0 truncate text-xs text-zinc-400">
        &copy; 2026 Modfem Autos. Vehicles independently inspected prior to
        export &mdash; landed cost is an estimate pending final agent
        clearance.
      </p>
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-white"
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </footer>
  );
}
