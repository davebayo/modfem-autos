"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Vehicle } from "@/lib/types";
import { formatCAD } from "@/lib/pricing";

interface NextInStockCardProps {
  vehicle: Vehicle;
  onSelect: () => void;
}

export function NextInStockCard({ vehicle, onSelect }: NextInStockCardProps) {
  return (
    <>
      {/* Mobile / tablet: compact horizontal card, docked in normal flow above the footer. */}
      <button
        type="button"
        onClick={onSelect}
        className="relative mx-4 mb-3 flex h-24 items-center justify-between gap-4 bg-white p-3 text-left text-zinc-950 shadow-2xl lg:hidden"
      >
        <div className="relative h-full w-20 shrink-0 overflow-hidden bg-zinc-100">
          <Image
            src={vehicle.thumbnailUrl}
            alt={vehicle.name}
            fill
            sizes="80px"
            className="object-cover contrast-105"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Next in Stock
          </p>
          <p className="truncate text-sm font-semibold tracking-tight text-zinc-900">
            {vehicle.name}
          </p>
          <p className="truncate font-mono text-xs text-zinc-600">
            {formatCAD(vehicle.basePriceCAD)} &middot; {vehicle.status}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={1.5} />
      </button>

      {/* Desktop: tall floating card, docked flush to the right viewport edge. */}
      <button
        type="button"
        onClick={onSelect}
        className="absolute right-0 top-1/2 hidden h-[380px] w-[340px] -translate-y-1/2 flex-col bg-white p-6 text-left text-zinc-950 shadow-2xl lg:flex"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide">
            Explore Next in Stock
          </span>
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </div>

        <div className="relative my-4 h-44 w-full overflow-hidden bg-zinc-100">
          <Image
            src={vehicle.thumbnailUrl}
            alt={vehicle.name}
            fill
            sizes="340px"
            className="h-44 w-full object-cover contrast-105"
          />
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
          <div>
            <p className="text-sm font-semibold tracking-tight text-zinc-900">
              {vehicle.name}
            </p>
            <p className="font-mono text-xs text-zinc-600">
              {formatCAD(vehicle.basePriceCAD)}
            </p>
          </div>
          <span className="border border-zinc-300 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-600">
            {vehicle.status}
          </span>
        </div>
      </button>
    </>
  );
}
