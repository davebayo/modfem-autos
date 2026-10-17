"use client";

import { Plus } from "lucide-react";
import { Vehicle } from "@/lib/types";

interface HeroContentProps {
  vehicle: Vehicle;
  landedCostLabel: string;
  onOpenDrawer: () => void;
}

export function HeroContent({
  vehicle,
  landedCostLabel,
  onOpenDrawer,
}: HeroContentProps) {
  return (
    <div className="flex max-w-xl flex-col gap-4 px-4 sm:gap-6 sm:px-8 lg:col-span-2 lg:col-start-1">
      <div className="inline-flex w-fit items-center gap-2 border border-white/20 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Located in {vehicle.location}
      </div>

      <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl lg:text-5xl">
        {vehicle.name}
      </h1>

      <p className="max-w-md text-base font-light leading-relaxed text-zinc-300 sm:text-lg md:text-xl">
        Independently inspected and sourced from a verified Canadian dealer
        network. Fully landed, duty-paid, and cleared for delivery in Lagos.
      </p>

      <button
        type="button"
        onClick={onOpenDrawer}
        className="group flex w-full items-stretch bg-white text-black sm:w-fit"
      >
        <span className="flex flex-1 items-center justify-center px-6 py-4 text-xs font-medium tracking-wide sm:flex-none sm:justify-start">
          Inspect Landed Cost ({landedCostLabel})
        </span>
        <span className="flex items-center justify-center border-l border-zinc-200 px-4 py-4">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
        </span>
      </button>
    </div>
  );
}
