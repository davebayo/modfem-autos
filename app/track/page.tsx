"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowRight, FileText, Lock, Plus } from "lucide-react";
import { getUserById, getVehicleByVinOrId, useVehicles } from "@/lib/store";
import { useExchangeRate } from "@/lib/fx";
import {
  arrivalPortToDestinationPort,
  calculateLandedCost,
  formatCAD,
  formatNGN,
} from "@/lib/pricing";
import { MILESTONE_SEQUENCE } from "@/lib/milestones";
import { Vehicle, VehicleStatus } from "@/lib/types";
import { TopNav } from "@/components/TopNav";
import { BottomFooter } from "@/components/BottomFooter";
import { NavigationDrawer } from "@/components/NavigationDrawer";
import { LandedCostDrawer } from "@/components/LandedCostDrawer";
import { StatusBadge } from "@/components/StatusBadge";
import { DocumentPreviewModal, DocumentType } from "@/components/DocumentPreviewModal";

interface DocumentDefinition {
  code: string;
  type: DocumentType;
  title: string;
  subtitle: string;
  requiredStatuses?: VehicleStatus[];
}

const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  {
    code: "01",
    type: "EXPORT_CERT",
    title: "CARFAX & Canadian Export Certificate",
    subtitle: "Verified Clean Title",
  },
  {
    code: "02",
    type: "BILL_OF_LADING",
    title: "Ocean Bill of Lading (BOL)",
    subtitle: "Available once in transit",
    requiredStatuses: ["IN_TRANSIT", "CLEARING", "DELIVERED"],
  },
  {
    code: "03",
    type: "CUSTOMS_ASSESSMENT",
    title: "NCS Customs Assessment & SONCAP Release",
    subtitle: "Available once clearing",
    requiredStatuses: ["CLEARING", "DELIVERED"],
  },
];

function DocumentVault({
  vehicle,
  onOpenDocument,
}: {
  vehicle: Vehicle;
  onOpenDocument: (type: DocumentType) => void;
}) {
  return (
    <div className="mt-6 border-t border-zinc-200 pt-4">
      <p className="mb-3 text-[10px] uppercase tracking-widest text-zinc-400">
        Verified Export &amp; Customs Dossier
      </p>
      <div className="flex flex-col divide-y divide-zinc-200 border border-zinc-200">
        {DOCUMENT_DEFINITIONS.map((doc) => {
          const available =
            !doc.requiredStatuses || doc.requiredStatuses.includes(vehicle.status);
          return (
            <button
              key={doc.type}
              type="button"
              disabled={!available}
              onClick={() => available && onOpenDocument(doc.type)}
              className={`flex items-center justify-between px-4 py-3 text-left transition-colors ${
                available ? "hover:bg-zinc-50" : "cursor-not-allowed opacity-40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-zinc-400">{doc.code}</span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-950">
                    {doc.title}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                    {doc.subtitle}
                  </p>
                </div>
              </div>
              {available ? (
                <FileText className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.5} />
              ) : (
                <Lock className="h-4 w-4 shrink-0 text-zinc-300" strokeWidth={1.5} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const DEMO_CHIPS: { id: string; label: string }[] = [
  { id: "bmw-x7-m60i", label: "BMW X7 M60i — In Transit" },
  { id: "toyota-land-cruiser-300", label: "Land Cruiser 300 — Clearing" },
  { id: "range-rover-autobiography-p530", label: "Range Rover — Reserved" },
];

function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex < 2) return email;
  const visible = email.slice(0, 2);
  const domain = email.slice(atIndex);
  return `${visible}${"*".repeat(Math.max(atIndex - 2, 3))}${domain}`;
}

function VehicleDossier({ vehicle }: { vehicle: Vehicle }) {
  const owner = vehicle.ownerId ? getUserById(vehicle.ownerId) : undefined;
  const destination = vehicle.shipment?.arrivalPort ?? "Not yet booked";

  return (
    <div className="col-span-1 flex flex-col gap-6 border-b border-r border-white/10 px-4 py-8 sm:px-8">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
        <Image
          src={vehicle.thumbnailUrl}
          alt={vehicle.name}
          fill
          sizes="(min-width: 1024px) 25vw, 100vw"
          className="object-cover contrast-105"
        />
      </div>

      <div>
        <StatusBadge status={vehicle.status} />
        <h2 className="mt-3 text-xl font-medium tracking-tight text-white">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h2>
        <p className="mt-1 font-mono text-[11px] text-zinc-500">
          VIN {vehicle.vin}
        </p>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Route
        </p>
        <p className="mt-2 text-sm text-zinc-300">{vehicle.location}</p>
        <div className="my-1 ml-[3px] h-3 border-l border-dashed border-white/20" />
        <p className="text-sm text-white">{destination}</p>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Buyer Assignment
        </p>
        {owner ? (
          <div className="mt-2">
            <p className="text-sm text-white">{owner.name}</p>
            <p className="font-mono text-xs text-zinc-500">
              {maskEmail(owner.email)}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            Unassigned — available for purchase.
          </p>
        )}
      </div>
    </div>
  );
}

function MilestoneTimeline({ vehicle }: { vehicle: Vehicle }) {
  const logsByCode = useMemo(
    () => new Map(vehicle.trackingLogs.map((log) => [log.milestone, log])),
    [vehicle.trackingLogs]
  );

  let currentIndex = -1;
  MILESTONE_SEQUENCE.forEach((stage, index) => {
    if (currentIndex !== -1) return;
    const log = logsByCode.get(stage.code);
    if (!log || !log.completed) currentIndex = index;
  });
  const allCompleted = currentIndex === -1;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">
        Trans-Atlantic Milestone Timeline
      </p>
      <div className="mt-6 flex flex-col">
        {MILESTONE_SEQUENCE.map((stage, index) => {
          const log = logsByCode.get(stage.code);
          const isCompleted = allCompleted || index < currentIndex;
          const isCurrent = !allCompleted && index === currentIndex;
          const isFuture = !isCompleted && !isCurrent;
          const isLast = index === MILESTONE_SEQUENCE.length - 1;

          return (
            <div key={stage.code} className="flex gap-4">
              <div className="flex flex-col items-center">
                {isCompleted && <span className="h-3 w-3 shrink-0 bg-white" />}
                {isCurrent && (
                  <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                  </span>
                )}
                {isFuture && (
                  <span className="h-3 w-3 shrink-0 border border-zinc-600" />
                )}
                {!isLast && (
                  <span
                    className={`mt-1 w-px flex-1 ${
                      isCompleted
                        ? "bg-white/20"
                        : "border-l border-dashed border-zinc-700"
                    }`}
                    style={{ minHeight: "2.5rem" }}
                  />
                )}
              </div>

              <div
                className={`flex-1 pb-8 ${
                  isCurrent
                    ? "-mt-2 border border-emerald-400/40 bg-emerald-400/5 px-4 py-3"
                    : ""
                }`}
              >
                <p
                  className={`text-sm font-medium uppercase tracking-wide ${
                    isFuture ? "text-zinc-600" : "text-white"
                  }`}
                >
                  {stage.title}
                </p>
                {log ? (
                  <>
                    <p className="mt-1 font-mono text-[11px] text-zinc-400">
                      {new Date(log.timestamp).toLocaleString("en-CA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{log.location}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {log.description}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-zinc-600">
                    {stage.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ManifestRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-zinc-600">{label}</span>
      <span
        className={`whitespace-nowrap text-xs text-zinc-950 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ManifestCard({
  vehicle,
  onInspect,
  onOpenDocument,
}: {
  vehicle: Vehicle;
  onInspect: () => void;
  onOpenDocument: (type: DocumentType) => void;
}) {
  const fx = useExchangeRate();
  const shipment = vehicle.shipment;
  const destinationPort = shipment
    ? arrivalPortToDestinationPort(shipment.arrivalPort)
    : "Tin Can Island";
  const breakdown = calculateLandedCost(vehicle, {
    shippingMethod: shipment?.shippingMethod ?? "RoRo",
    destinationPort,
    exchangeRateCadToNgn: fx.rate,
  });

  return (
    <div className="col-span-1 border-b border-r border-white/10 bg-white p-6 text-zinc-950">
      <p className="text-[10px] uppercase tracking-widest text-zinc-400">
        Maritime &amp; Customs Manifest
      </p>
      <p className="mt-1 font-mono text-sm font-medium">
        {shipment?.bookingNumber ?? "NOT YET BOOKED"}
      </p>

      <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4">
        <ManifestRow label="Vessel" value={shipment?.vesselName ?? "—"} mono={false} />
        <ManifestRow
          label="Shipping Mode"
          value={shipment?.shippingMethod ?? "—"}
          mono={false}
        />
        <ManifestRow
          label="Departure Date"
          value={shipment?.departureDate ?? "—"}
        />
        <ManifestRow label="ETA Lagos" value={shipment?.etaLagos ?? "—"} />
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-zinc-600">Bill of Lading</span>
          <span
            className={`border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
              shipment?.billOfLadingVerified
                ? "border-emerald-600 text-emerald-700"
                : "border-zinc-300 text-zinc-500"
            }`}
          >
            {shipment?.billOfLadingVerified ? "Verified" : "Pending"}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4">
        <ManifestRow
          label="Vehicle Base"
          value={`${formatCAD(breakdown.basePriceCAD)} / ${formatNGN(
            breakdown.basePriceNGN
          )}`}
        />
        <ManifestRow
          label="Freight & Insurance"
          value={`${formatCAD(
            breakdown.freightCAD + breakdown.insuranceCAD
          )} / ${formatNGN(breakdown.freightNGN + breakdown.insuranceNGN)}`}
        />
        <ManifestRow
          label="Duty + Port Clearing"
          value={formatNGN(
            breakdown.customsDutyNGN +
              breakdown.nacLevyNGN +
              breakdown.portClearingNGN
          )}
        />
      </div>

      <div className="mt-6 flex items-end justify-between border-t-2 border-zinc-950 pt-4">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">
          Total Landed
        </span>
        <span className="font-mono text-xl font-medium tracking-tight">
          {formatNGN(breakdown.totalNGN)}
        </span>
      </div>

      <button
        type="button"
        onClick={onInspect}
        className="mt-6 flex w-full items-stretch border border-zinc-950"
      >
        <span className="flex flex-1 items-center justify-center px-4 py-3 text-[10px] font-medium uppercase tracking-widest">
          Inspect Full Breakdown
        </span>
        <span className="flex items-center justify-center border-l border-zinc-950 px-3 py-3">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
        </span>
      </button>

      <DocumentVault vehicle={vehicle} onOpenDocument={onOpenDocument} />
    </div>
  );
}

function TrackPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDocument, setOpenDocument] = useState<DocumentType | null>(null);
  const [selectedId, setSelectedId] = useState<string>(() => {
    const candidate =
      searchParams.get("vin") ||
      searchParams.get("id") ||
      searchParams.get("vehicleId");
    if (candidate) {
      const found = getVehicleByVinOrId(candidate);
      if (found) return found.id;
    }
    return "bmw-x7-m60i";
  });

  const vehicles = useVehicles();
  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedId),
    [vehicles, selectedId]
  );

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const found = getVehicleByVinOrId(query);
    if (found) {
      setSelectedId(found.id);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <TopNav
        announcement="Trans-Atlantic VIN & Shipment Tracker — Live Milestone Feed"
        onOpenMenu={() => setMenuOpen(true)}
      />

      <div className="grid grid-cols-1 border-b border-white/10 md:grid-cols-4">
        <form
          onSubmit={handleSearch}
          className="col-span-1 flex items-stretch border-b border-white/10 md:col-span-2 md:border-b-0 md:border-r"
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ENTER 17-CHAR VIN, VEHICLE ID, OR BOOKING NUMBER"
            className="min-w-0 flex-1 bg-transparent px-4 py-5 font-mono text-xs uppercase tracking-wide text-white placeholder:text-zinc-500 focus:outline-none sm:px-8"
          />
          <button type="submit" className="flex shrink-0 items-stretch bg-white">
            <span className="flex items-center px-4 text-[10px] font-medium uppercase tracking-widest text-zinc-950 sm:px-6">
              <span className="sm:hidden">Track</span>
              <span className="hidden sm:inline">Track Consignment</span>
            </span>
            <span className="flex items-center justify-center border-l border-zinc-200 px-4">
              <ArrowRight className="h-4 w-4 text-zinc-950" strokeWidth={1.5} />
            </span>
          </button>
        </form>

        <div className="col-span-1 flex flex-wrap items-center gap-2 px-4 py-5 sm:px-8 md:col-span-2">
          <span className="mr-2 text-[10px] uppercase tracking-widest text-zinc-500">
            Active Shipments
          </span>
          {DEMO_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setSelectedId(chip.id);
                setNotFound(false);
                setQuery("");
              }}
              className={`border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                selectedId === chip.id
                  ? "border-white bg-white text-zinc-950"
                  : "border-white/20 text-zinc-400 hover:border-white/40 hover:text-white"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {notFound && (
        <div className="border-b border-white/10 px-4 py-4 text-xs uppercase tracking-widest text-amber-400 sm:px-8">
          No consignment found for &ldquo;{query}&rdquo;. Try a VIN, vehicle
          ID, or booking number.
        </div>
      )}

      {vehicle ? (
        <div className="grid grid-cols-1 border-l border-t border-white/10 lg:grid-cols-4">
          <VehicleDossier vehicle={vehicle} />
          <div className="col-span-1 border-b border-r border-white/10 px-4 py-8 sm:px-8 lg:col-span-2">
            <MilestoneTimeline vehicle={vehicle} />
          </div>
          <ManifestCard
            vehicle={vehicle}
            onInspect={() => setDrawerOpen(true)}
            onOpenDocument={(type) => setOpenDocument(type)}
          />
        </div>
      ) : (
        <div className="px-4 py-24 text-center text-xs uppercase tracking-widest text-zinc-500 sm:px-8">
          Select or search for a consignment to view its tracking record.
        </div>
      )}

      <BottomFooter onOpenMenu={() => setMenuOpen(true)} />

      {vehicle && (
        <LandedCostDrawer
          vehicle={vehicle}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
      {vehicle && (
        <DocumentPreviewModal
          vehicle={vehicle}
          documentType={openDocument}
          onClose={() => setOpenDocument(null)}
        />
      )}
      <NavigationDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <TrackPageContent />
    </Suspense>
  );
}
