"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExchangeRate } from "@/lib/fx";

interface TopNavProps {
  announcement?: string;
  onOpenMenu?: () => void;
}

const NAV_LINKS = [
  { label: "SHOWROOM", href: "/" },
  { label: "INVENTORY", href: "/inventory" },
  { label: "TRACK", href: "/track" },
  { label: "SOURCING", href: "/request" },
  { label: "ADMIN", href: "/admin" },
];

export function TopNav({
  announcement = "Live Customs Exchange Rate: $1 CAD = ₦1,180",
  onOpenMenu,
}: TopNavProps) {
  const pathname = usePathname();
  const fx = useExchangeRate();

  const fxDotColor =
    fx.source === "live"
      ? "bg-emerald-400"
      : fx.source === "manual"
        ? "bg-amber-400"
        : "bg-zinc-500";

  return (
    <header className="shrink-0 border-b border-white/10">
      <div className="grid h-16 grid-cols-2 md:h-20 md:grid-cols-4">
        <div className="flex flex-col justify-center px-4 md:px-8">
          <span className="font-panchang text-lg font-black uppercase tracking-widest text-white">
            MODFEM AUTOS
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-zinc-500 md:block">
            Canada &rarr; Nigeria
          </span>
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 md:hidden">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${fxDotColor}`} />
            &#8362;{fx.rate.toLocaleString("en-NG")}/CAD
          </span>
        </div>

        <div className="col-span-2 hidden items-center overflow-hidden pl-8 md:flex">
          <AnimatePresence mode="wait">
            <motion.span
              key={announcement}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="truncate text-xs font-light uppercase tracking-wider text-zinc-300"
            >
              {announcement}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-end gap-3 px-4 md:flex-col md:items-end md:justify-center md:gap-2 md:px-8">
          <nav className="hidden items-center gap-3 md:flex">
            {NAV_LINKS.map((link, index) => {
              const active = pathname === link.href;
              return (
                <div key={link.href} className="flex items-center gap-3">
                  <Link
                    href={link.href}
                    className={`text-[10px] uppercase tracking-widest transition-colors ${
                      active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {link.label}
                  </Link>
                  {index < NAV_LINKS.length - 1 && (
                    <span className="text-zinc-700">/</span>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${fxDotColor}`} />
              FX &#8362;{fx.rate.toLocaleString("en-NG")}/CAD
            </span>
            <button
              type="button"
              className="flex items-center gap-2 text-xs font-medium text-white"
            >
              <span>Destination: Lagos (Tin Can)</span>
              <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white md:hidden"
          >
            Lagos
            <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
          </button>

          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="Open menu"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-white md:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden border-t border-white/10 px-4 py-2 md:hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={announcement}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="block truncate text-[10px] font-light uppercase tracking-wider text-zinc-400"
          >
            {announcement}
          </motion.span>
        </AnimatePresence>
      </div>
    </header>
  );
}
