"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Search } from "lucide-react";
import { useVehicles } from "@/lib/store";
import { calculateLandedCost, formatCAD, formatNGN } from "@/lib/pricing";
import { useExchangeRate } from "@/lib/fx";
import {
  DestinationPort,
  ShippingMethod,
  Vehicle,
  VehicleStatus,
} from "@/lib/types";
import { TopNav } from "@/components/TopNav";
import { BottomFooter } from "@/components/BottomFooter";
import { NavigationDrawer } from "@/components/NavigationDrawer";
import { LandedCostDrawer } from "@/components/LandedCostDrawer";
import { StatusBadge } from "@/components/StatusBadge";

type StatusTab = "ALL" | VehicleStatus;
type PriceMode = "LANDED" | "BASE";

const STATUS_TABS: StatusTab[] = [
  "ALL",
  "AVAILABLE",
  "RESERVED",
  "IN_TRANSIT",
  "CLEARING",
];

function HeaderToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex border border-white/20">
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 px-2 py-2 text-[10px] font-medium uppercase tracking-wide transition-colors ${
            index > 0 ? "border-l border-white/20" : ""
          } ${
            value === option.value
              ? "bg-white text-zinc-950"
              : "bg-transparent text-zinc-400 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function VehicleCard({
  vehicle,
  shippingMethod,
  destinationPort,
  priceMode,
  exchangeRateCadToNgn,
  priority,
  onInspect,
}: {
  vehicle: Vehicle;
  shippingMethod: ShippingMethod;
  destinationPort: DestinationPort;
  priceMode: PriceMode;
  exchangeRateCadToNgn: number;
  priority?: boolean;
  onInspect: () => void;
}) {
  const breakdown = calculateLandedCost(vehicle, {
    shippingMethod,
    destinationPort,
    exchangeRateCadToNgn,
  });

  const headline =
    priceMode === "LANDED"
      ? formatNGN(breakdown.totalNGN)
      : formatCAD(breakdown.basePriceCAD);
  const headlineCaption = priceMode === "LANDED" ? "LANDED IN LAGOS" : "CANADA BASE";
  const secondary =
    priceMode === "LANDED"
      ? formatCAD(breakdown.basePriceCAD)
      : formatNGN(breakdown.totalNGN);
  const secondaryCaption = priceMode === "LANDED" ? "CANADA BASE" : "LANDED IN LAGOS";

  return (
    <div className="group flex flex-col border-b border-r border-white/10 bg-zinc-950">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
        <Image
          src={vehicle.thumbnailUrl}
          alt={vehicle.name}
          fill
          priority={priority}
          loading={priority ? "eager" : undefined}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover contrast-105 transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
        <div className="absolute left-4 top-4">
          <StatusBadge status={vehicle.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            {vehicle.location}
          </p>
          <h3 className="mt-1 text-lg font-medium tracking-tight text-white">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-zinc-500">
            VIN {vehicle.vin} &middot; {vehicle.specs.mileageKm.toLocaleString("en-CA")} KM
          </p>
        </div>

        <div className="flex items-end justify-between border-t border-white/10 pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              {headlineCaption}
            </p>
            <p className="font-mono text-xl font-medium tracking-tight text-white">
              {headline}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              {secondaryCaption}
            </p>
            <p className="font-mono text-xs text-zinc-400">{secondary}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onInspect}
        className="group flex items-stretch border-t border-white/10"
      >
        <span className="flex flex-1 items-center px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-white">
          Inspect Breakdown
        </span>
        <span className="flex items-center justify-center border-l border-white/10 px-4 py-4">
          <Plus className="h-4 w-4 text-white" strokeWidth={1.5} />
        </span>
      </button>
    </div>
  );
}

export default function InventoryPage() {
  const vehicles = useVehicles();
  const fx = useExchangeRate();
  const [statusFilter, setStatusFilter] = useState<StatusTab>("ALL");
  const [priceMode, setPriceMode] = useState<PriceMode>("LANDED");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("RoRo");
  const [destinationPort, setDestinationPort] =
    useState<DestinationPort>("Tin Can Island");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [inspectingVehicleId, setInspectingVehicleId] = useState<string | null>(
    null
  );
  const inspectingVehicle =
    vehicles.find((v) => v.id === inspectingVehicleId) ?? null;

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      if (statusFilter !== "ALL" && vehicle.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return (
        vehicle.make.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        String(vehicle.year).includes(query) ||
        vehicle.vin.toLowerCase().includes(query)
      );
    });
  }, [vehicles, statusFilter, search]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <TopNav
        announcement="4-Column Inventory Catalog — Live Landed Cost Across the Fleet"
        onOpenMenu={() => setMenuOpen(true)}
      />

      <div className="grid grid-cols-1 border-b border-white/10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="no-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto border-b border-white/10 p-4 sm:border-r sm:p-6 lg:border-b-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`shrink-0 border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                statusFilter === tab
                  ? "border-white bg-white text-zinc-950"
                  : "border-white/20 text-zinc-400 hover:border-white/40 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-col justify-center gap-2 border-b border-white/10 p-4 sm:border-b-0 sm:p-6 lg:border-r">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            Price Mode
          </p>
          <HeaderToggle
            value={priceMode}
            onChange={setPriceMode}
            options={[
              { label: "Landed in Lagos (₦)", value: "LANDED" },
              { label: "Canada Base ($ CAD)", value: "BASE" },
            ]}
          />
        </div>

        <div className="flex flex-col justify-center gap-2 border-b border-white/10 p-4 sm:border-b-0 sm:p-6 lg:border-r">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            Global Freight Baseline
          </p>
          <div className="flex flex-col gap-2">
            <HeaderToggle
              value={shippingMethod}
              onChange={setShippingMethod}
              options={[
                { label: "RoRo", value: "RoRo" },
                { label: "Container", value: "Container" },
              ]}
            />
            <HeaderToggle
              value={destinationPort}
              onChange={setDestinationPort}
              options={[
                { label: "Tin Can Island", value: "Tin Can Island" },
                { label: "Apapa", value: "Apapa" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 sm:p-6">
          <Search className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="SEARCH MAKE, MODEL, YEAR, VIN"
            className="w-full min-w-0 bg-transparent font-mono text-xs uppercase tracking-wide text-white placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {filteredVehicles.map((vehicle, index) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            shippingMethod={shippingMethod}
            destinationPort={destinationPort}
            priceMode={priceMode}
            exchangeRateCadToNgn={fx.rate}
            priority={index === 0}
            onInspect={() => setInspectingVehicleId(vehicle.id)}
          />
        ))}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full border-b border-r border-white/10 px-8 py-24 text-center text-xs uppercase tracking-widest text-zinc-500">
            No vehicles match these filters.
          </div>
        )}
      </div>

      <BottomFooter onOpenMenu={() => setMenuOpen(true)} />

      {inspectingVehicle && (
        <LandedCostDrawer
          vehicle={inspectingVehicle}
          isOpen={inspectingVehicle !== null}
          onClose={() => setInspectingVehicleId(null)}
        />
      )}
      <NavigationDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
