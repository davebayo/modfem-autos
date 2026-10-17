"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LINKS = [
  { number: "01", label: "SHOWROOM", href: "/" },
  { number: "02", label: "INVENTORY CATALOG", href: "/inventory" },
  { number: "03", label: "VIN & SHIPMENT TRACKER", href: "/track" },
  { number: "04", label: "DEALER ADMIN", href: "/admin" },
  { number: "05", label: "CUSTOM SOURCING CONCIERGE", href: "/request" },
];

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
          />

          <motion.div
            key="nav-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col justify-between overflow-y-auto overscroll-contain border-l border-white/15 bg-zinc-950 text-white sm:max-w-md"
          >
            <div>
              <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-zinc-950 px-8 py-6">
                <span className="font-panchang text-sm font-black uppercase tracking-widest">
                  MODFEM AUTOS
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              <nav className="flex flex-col">
                {LINKS.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className={`flex items-center gap-4 border-b border-white/10 px-8 py-6 transition-colors ${
                        active
                          ? "bg-white text-zinc-950"
                          : "text-white hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`font-mono text-xs ${
                          active ? "text-zinc-500" : "text-zinc-500"
                        }`}
                      >
                        {link.number}
                      </span>
                      <span className="text-sm font-medium uppercase tracking-widest">
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-white/10 px-8 py-6 text-[10px] uppercase tracking-widest text-zinc-500">
              Canada &mdash; Lagos Import Desk
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
