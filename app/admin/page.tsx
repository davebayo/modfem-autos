"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, Plus, RotateCcw } from "lucide-react";
import {
  addTrackingLog,
  addVehicle,
  createShipment,
  getAllVehicles,
  getUserById,
  resetStore,
  updateShipment,
  updateSourcingRequestStatus,
  updateVehicleStatus,
  useSourcingRequests,
  useVehicles,
} from "@/lib/store";
import {
  arrivalPortToDestinationPort,
  calculateLandedCost,
  formatCAD,
  formatNGN,
  formatNGNCompact,
} from "@/lib/pricing";
import {
  ArrivalPort,
  MilestoneCode,
  ShippingMethod,
  SourcingRequest,
  SourcingRequestStatus,
  Vehicle,
  VehicleStatus,
} from "@/lib/types";
import { MILESTONE_SEQUENCE } from "@/lib/milestones";
import { ADMIN_PASSCODE } from "@/lib/config";
import { TopNav } from "@/components/TopNav";
import { BottomFooter } from "@/components/BottomFooter";
import { NavigationDrawer } from "@/components/NavigationDrawer";

type AdminMode = "LOGISTICS" | "ADD_INVENTORY" | "SOURCING_MANDATES";

const SOURCING_STATUS_OPTIONS: SourcingRequestStatus[] = [
  "NEW",
  "SOURCING_AT_AUCTION",
  "MATCH_FOUND",
  "CONVERTED",
];

const STATUS_OPTIONS: VehicleStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "IN_TRANSIT",
  "CLEARING",
  "DELIVERED",
];

const SHIPPING_OPTIONS: ShippingMethod[] = ["RoRo", "Container"];
const ARRIVAL_PORT_OPTIONS: ArrivalPort[] = [
  "Tin Can Island, Lagos",
  "Apapa, Lagos",
];

const SAMPLE_VINS = [
  { label: "Mercedes-Benz", vin: "4JGFB4KE1NA123456" },
  { label: "BMW", vin: "5UX53DP04P9L12345" },
  { label: "Lexus", vin: "2T2HZMDA8MC345678" },
];

const IMAGE_PRESETS = [
  {
    label: "Studio A",
    url: "https://images.unsplash.com/photo-1773866796453-27ced06f8984?auto=format&fit=crop&w=2000&q=85",
  },
  {
    label: "Studio B",
    url: "https://images.unsplash.com/photo-1731988666894-482242ceae2f?auto=format&fit=crop&w=2000&q=85",
  },
  {
    label: "Studio C",
    url: "https://images.unsplash.com/photo-1653641305372-a084f9b78858?auto=format&fit=crop&w=2000&q=85",
  },
  {
    label: "Studio D",
    url: "https://images.unsplash.com/photo-1753030505007-98ceef668415?auto=format&fit=crop&w=2000&q=85",
  },
  {
    label: "Studio E",
    url: "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=2000&q=85",
  },
];

function tabClass(active: boolean): string {
  return `flex-1 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest transition-colors ${
    active ? "bg-white text-zinc-950" : "bg-transparent text-zinc-400 hover:text-white"
  }`;
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`border border-white/20 bg-transparent px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-white/20 bg-zinc-950 px-3 py-2 text-xs uppercase tracking-wide text-white focus:border-white/50 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option || "none"} value={option}>
            {option || "No Change"}
          </option>
        ))}
      </select>
    </label>
  );
}

function ManifestPreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-zinc-600">{label}</span>
      <span className="whitespace-nowrap font-mono text-xs text-zinc-950">
        {value}
      </span>
    </div>
  );
}

interface ShipmentFormState {
  shippingMethod: ShippingMethod;
  vesselName: string;
  bookingNumber: string;
  departurePort: string;
  arrivalPort: ArrivalPort;
  departureDate: string;
  etaLagos: string;
  billOfLadingVerified: boolean;
}

const EMPTY_SHIPMENT_FORM: ShipmentFormState = {
  shippingMethod: "RoRo",
  vesselName: "",
  bookingNumber: "",
  departurePort: "",
  arrivalPort: "Tin Can Island, Lagos",
  departureDate: "",
  etaLagos: "",
  billOfLadingVerified: false,
};

function shipmentFormFromVehicle(
  vehicle: Vehicle | undefined
): ShipmentFormState {
  if (!vehicle?.shipment) return EMPTY_SHIPMENT_FORM;
  const s = vehicle.shipment;
  return {
    shippingMethod: s.shippingMethod,
    vesselName: s.vesselName,
    bookingNumber: s.bookingNumber,
    departurePort: s.departurePort,
    arrivalPort: s.arrivalPort,
    departureDate: s.departureDate,
    etaLagos: s.etaLagos,
    billOfLadingVerified: s.billOfLadingVerified,
  };
}

interface MilestoneFormState {
  code: MilestoneCode;
  location: string;
  description: string;
  advanceStatus: VehicleStatus | "";
}

const EMPTY_MILESTONE_FORM: MilestoneFormState = {
  code: "PURCHASED_CANADA",
  location: "",
  description: "",
  advanceStatus: "",
};

interface VehicleFormState {
  year: string;
  make: string;
  model: string;
  vin: string;
  basePriceCAD: string;
  location: string;
  mileageKm: string;
  engine: string;
  drivetrain: string;
  exteriorColor: string;
  status: VehicleStatus;
  imageUrl: string;
}

const DEFAULT_FORM_YEAR = 2026;

function emptyVehicleForm(): VehicleFormState {
  return {
    year: String(DEFAULT_FORM_YEAR),
    make: "",
    model: "",
    vin: "",
    basePriceCAD: "",
    location: "",
    mileageKm: "",
    engine: "",
    drivetrain: "",
    exteriorColor: "",
    status: "AVAILABLE",
    imageUrl: IMAGE_PRESETS[0].url,
  };
}

const AUTH_STORAGE_KEY = "modfem.admin.unlocked";
const DEALER_PASSCODE = ADMIN_PASSCODE;

function AdminAuthGate({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  error: string | null;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm border border-white/15 p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Modfem Autos
        </p>
        <h1 className="mt-1 text-xl font-medium tracking-tight text-white">
          Dealer Console Access
        </h1>
        <p className="mt-2 text-xs text-zinc-400">
          Enter the dealer passcode to unlock logistics, milestone dispatch, and
          inventory intake.
        </p>

        <form onSubmit={onSubmit} className="mt-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              Passcode
            </span>
            <input
              type="password"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="border border-white/20 bg-transparent px-3 py-2.5 font-mono text-sm text-white focus:border-white/50 focus:outline-none"
              autoFocus
            />
          </label>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            className="mt-4 flex w-full items-stretch bg-white text-zinc-950"
          >
            <span className="flex flex-1 items-center justify-center px-4 py-3 text-[10px] font-medium uppercase tracking-widest">
              Unlock Dealer Console
            </span>
            <span className="flex items-center justify-center border-l border-zinc-200 px-3">
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </span>
          </button>
        </form>

        <button
          type="button"
          onClick={() => onChange(DEALER_PASSCODE)}
          className="mt-4 inline-flex items-center gap-2 border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:border-white/30 hover:text-zinc-300"
        >
          Demo Code: {DEALER_PASSCODE}
        </button>
      </div>
    </div>
  );
}

function nextNotificationId(): string {
  return `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

interface NotificationEntry {
  id: string;
  subject: string;
  buyerName: string;
  buyerEmail: string;
  emailBody: string;
  whatsappMessage: string;
  timestamp: string;
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [mode, setMode] = useState<AdminMode>("LOGISTICS");
  const [menuOpen, setMenuOpen] = useState(false);
  const vehicles = useVehicles();
  const sourcingRequests = useSourcingRequests();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    () => vehicles[0]?.id ?? ""
  );
  const [shipmentForm, setShipmentForm] = useState<ShipmentFormState>(() =>
    shipmentFormFromVehicle(vehicles.find((v) => v.id === selectedVehicleId))
  );
  const [milestoneForm, setMilestoneForm] =
    useState<MilestoneFormState>(EMPTY_MILESTONE_FORM);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(
    emptyVehicleForm()
  );
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [decodingVin, setDecodingVin] = useState(false);
  const [vinDecodeError, setVinDecodeError] = useState<string | null>(null);
  const [vinDecodeSuccess, setVinDecodeSuccess] = useState<string | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true") {
      // Restoring a session-scoped unlock from sessionStorage — the gate
      // always renders first (both on the server and this first client
      // render) so there is no hydration mismatch; this effect only ever
      // flips the UI forward, after mount, never during the render itself.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnlocked(true);
    }
  }, []);

  function handleUnlock(event: FormEvent) {
    event.preventDefault();
    if (passcodeInput.trim().toUpperCase() === DEALER_PASSCODE) {
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
      setUnlocked(true);
      setAuthError(null);
    } else {
      setAuthError("Incorrect passcode. Contact your Modfem Autos system administrator.");
    }
  }

  function handleLock() {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setUnlocked(false);
    setPasscodeInput("");
  }

  function dispatchNotification(vehicle: Vehicle, eventLabel: string, detail: string) {
    if (!vehicle.ownerId) return;
    const buyer = getUserById(vehicle.ownerId);
    if (!buyer) return;
    const trackUrl = `${window.location.origin}/track?id=${vehicle.id}`;
    const subject = `Modfem Autos Update — ${vehicle.name} (${eventLabel})`;
    const emailBody = `Dear ${buyer.name},\n\n${detail}\n\nTrack your consignment: ${trackUrl}\n\n— Modfem Autos Import Desk`;
    const whatsappMessage = `Modfem Autos Update: ${vehicle.name}\n${detail}\nTrack: ${trackUrl}`;
    setNotifications((list) =>
      [
        {
          id: nextNotificationId(),
          subject,
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          emailBody,
          whatsappMessage,
          timestamp: new Date().toISOString(),
        },
        ...list,
      ].slice(0, 5)
    );
  }

  function selectVehicle(vehicle: Vehicle | undefined) {
    setSelectedVehicleId(vehicle?.id ?? "");
    setShipmentForm(shipmentFormFromVehicle(vehicle));
    setMilestoneForm(EMPTY_MILESTONE_FORM);
  }

  const totalBaseCAD = useMemo(
    () => vehicles.reduce((sum, v) => sum + v.basePriceCAD, 0),
    [vehicles]
  );
  const totalLandedNGN = useMemo(
    () => vehicles.reduce((sum, v) => sum + calculateLandedCost(v).totalNGN, 0),
    [vehicles]
  );
  const inTransitCount = vehicles.filter((v) => v.status === "IN_TRANSIT").length;
  const clearingCount = vehicles.filter((v) => v.status === "CLEARING").length;

  const previewBreakdown = useMemo(() => {
    const year = Number(vehicleForm.year) || DEFAULT_FORM_YEAR;
    const basePriceCAD = Number(vehicleForm.basePriceCAD) || 0;
    return calculateLandedCost({ id: "preview", year, basePriceCAD });
  }, [vehicleForm.year, vehicleForm.basePriceCAD]);

  function handleStatusChange(vehicleId: string, status: VehicleStatus) {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    updateVehicleStatus(vehicleId, status);
    if (vehicle) {
      dispatchNotification(
        vehicle,
        "Status Change",
        `Your vehicle's status has been updated to ${status.replace("_", " ")}.`
      );
    }
  }

  function handleReset() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Reset all demo data to its original seed state? This cannot be undone."
      )
    ) {
      return;
    }
    resetStore();
    selectVehicle(getAllVehicles()[0]);
  }

  function handleSaveShipment(event: FormEvent) {
    event.preventDefault();
    if (!selectedVehicle) return;
    const breakdown = calculateLandedCost(selectedVehicle, {
      shippingMethod: shipmentForm.shippingMethod,
      destinationPort: arrivalPortToDestinationPort(shipmentForm.arrivalPort),
    });
    const payload = {
      ...shipmentForm,
      customsDutyNGN: breakdown.customsDutyNGN + breakdown.nacLevyNGN,
      clearingFeeNGN: breakdown.portClearingNGN,
    };
    if (selectedVehicle.shipment) {
      updateShipment(selectedVehicle.id, payload);
    } else {
      createShipment(selectedVehicle.id, payload);
    }
  }

  function handleDispatchMilestone(event: FormEvent) {
    event.preventDefault();
    if (!selectedVehicle) return;
    const definition = MILESTONE_SEQUENCE.find((m) => m.code === milestoneForm.code);
    const milestoneTitle = definition?.title ?? milestoneForm.code;
    const milestoneDescription =
      milestoneForm.description || definition?.description || "";
    addTrackingLog(selectedVehicle.id, {
      milestone: milestoneForm.code,
      title: milestoneTitle,
      location: milestoneForm.location || selectedVehicle.location,
      description: milestoneDescription,
      timestamp: new Date().toISOString(),
      completed: true,
    });
    dispatchNotification(
      selectedVehicle,
      "Milestone Update",
      `${milestoneTitle} — ${milestoneDescription}`
    );
    if (milestoneForm.advanceStatus) {
      updateVehicleStatus(selectedVehicle.id, milestoneForm.advanceStatus);
    }
    setMilestoneForm(EMPTY_MILESTONE_FORM);
  }

  async function handleDecodeVin() {
    const vin = vehicleForm.vin.trim().toUpperCase();
    if (vin.length !== 17) {
      setVinDecodeError("Enter a full 17-character VIN first.");
      setVinDecodeSuccess(null);
      return;
    }
    setDecodingVin(true);
    setVinDecodeError(null);
    setVinDecodeSuccess(null);
    try {
      const res = await fetch(`/api/vin/${vin}`);
      const data = await res.json();
      if (!res.ok) {
        setVinDecodeError(data?.error ?? "VIN decode failed.");
        return;
      }
      setVehicleForm((f) => ({
        ...f,
        vin,
        year: data.year ? String(data.year) : f.year,
        make: data.make ?? f.make,
        model: data.model ?? f.model,
        engine: data.engine ?? f.engine,
        drivetrain: data.drivetrain ?? f.drivetrain,
      }));
      setVinDecodeSuccess(
        "VIN decoded — Year, Make, Model, Engine & Drivetrain populated."
      );
    } catch {
      setVinDecodeError("VIN decode failed — check your connection and try again.");
    } finally {
      setDecodingVin(false);
    }
  }

  function handleConvertToInventory(request: SourcingRequest) {
    setVehicleForm((f) => ({
      ...f,
      year: String(request.vehicleSpec.year),
      make: request.vehicleSpec.make,
      model: request.vehicleSpec.model,
      basePriceCAD: String(Math.round(request.financials.maxBidCAD)),
    }));
    setMode("ADD_INVENTORY");
  }

  function handleAddVehicle(event: FormEvent) {
    event.preventDefault();
    const year = Number(vehicleForm.year);
    const basePriceCAD = Number(vehicleForm.basePriceCAD);
    const mileageKm = Number(vehicleForm.mileageKm) || 0;
    if (!vehicleForm.vin || !vehicleForm.make || !vehicleForm.model || !basePriceCAD || !year) {
      return;
    }

    const created = addVehicle({
      vin: vehicleForm.vin.toUpperCase(),
      year,
      make: vehicleForm.make,
      model: vehicleForm.model,
      basePriceCAD,
      location: vehicleForm.location || "Ontario, Canada",
      status: vehicleForm.status,
      specs: {
        engine: vehicleForm.engine || "—",
        mileageKm,
        drivetrain: vehicleForm.drivetrain || "—",
        exteriorColor: vehicleForm.exteriorColor || "—",
      },
      frontImageUrl: vehicleForm.imageUrl,
      rearImageUrl: vehicleForm.imageUrl,
      thumbnailUrl: vehicleForm.imageUrl,
    });

    setVehicleForm({ ...emptyVehicleForm(), imageUrl: vehicleForm.imageUrl });
    setAddedMessage(`${created.name} added to inventory.`);
  }

  if (!unlocked) {
    return (
      <AdminAuthGate
        value={passcodeInput}
        onChange={setPasscodeInput}
        onSubmit={handleUnlock}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <TopNav
        announcement="Dealer Admin — Logistics, Milestones & Inventory Intake"
        onOpenMenu={() => setMenuOpen(true)}
      />

      <div className="grid grid-cols-2 border-b border-white/10 lg:grid-cols-4">
        <div className="col-span-2 flex items-center border-b border-white/10 p-4 lg:border-b-0 lg:border-r lg:px-8 lg:py-5">
          <div className="flex w-full border border-white/20">
            <button
              type="button"
              onClick={() => setMode("LOGISTICS")}
              className={tabClass(mode === "LOGISTICS")}
            >
              01 / Logistics &amp; Milestone Dispatch
            </button>
            <button
              type="button"
              onClick={() => setMode("ADD_INVENTORY")}
              className={`border-l border-white/20 ${tabClass(mode === "ADD_INVENTORY")}`}
            >
              02 / Add Canadian Inventory
            </button>
            <button
              type="button"
              onClick={() => setMode("SOURCING_MANDATES")}
              className={`border-l border-white/20 ${tabClass(mode === "SOURCING_MANDATES")}`}
            >
              03 / Sourcing Mandates ({sourcingRequests.length})
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-1 border-r border-white/10 p-4 lg:px-8 lg:py-5">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            Total Inventory Value
          </p>
          <p className="font-mono text-sm text-white">{formatCAD(totalBaseCAD)}</p>
          <p className="font-mono text-xs text-zinc-500">
            {formatNGNCompact(totalLandedNGN)} landed
          </p>
        </div>

        <div className="flex flex-col gap-3 p-4 lg:px-8 lg:py-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              Pipeline
            </p>
            <p className="font-mono text-sm text-white">
              {inTransitCount} In Transit &middot; {clearingCount} Clearing
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex min-h-[40px] items-center gap-2 border border-white/20 px-3 text-[10px] uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              Reset Demo Data
            </button>
            <button
              type="button"
              onClick={handleLock}
              className="flex min-h-[40px] items-center gap-2 border border-white/20 px-3 text-[10px] uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
            >
              <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
              Lock Console
            </button>
          </div>
        </div>
      </div>

      {mode === "LOGISTICS" && (
        <div className="grid grid-cols-1 border-l border-t border-white/10 lg:grid-cols-4">
          <div className="col-span-1 border-b border-r border-white/10 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 lg:px-8">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                Inventory &amp; Status Roster
              </p>
              <p className="font-mono text-[10px] text-zinc-500">
                {vehicles.length} Vehicles
              </p>
            </div>
            <div className="divide-y divide-white/10">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectVehicle(v)}
                  className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors lg:px-8 ${
                    selectedVehicleId === v.id ? "bg-white/5" : "hover:bg-white/5"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-500">{v.vin}</p>
                  </div>
                  <select
                    value={v.status}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      handleStatusChange(v.id, event.target.value as VehicleStatus)
                    }
                    className="shrink-0 border border-white/20 bg-zinc-950 px-2 py-1.5 text-[10px] uppercase tracking-wide text-white"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-1 border-b border-r border-white/10 px-4 py-6 lg:col-span-2 lg:px-8">
            {selectedVehicle ? (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                      Editing
                    </p>
                    <h3 className="mt-1 text-lg font-medium tracking-tight text-white">
                      {selectedVehicle.year} {selectedVehicle.make}{" "}
                      {selectedVehicle.model}
                    </h3>
                  </div>
                  <Link
                    href={`/track?id=${selectedVehicle.id}`}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-white"
                  >
                    View Live on /track <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </Link>
                </div>

                <form
                  onSubmit={handleSaveShipment}
                  className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-2"
                >
                  <p className="sm:col-span-2 text-[10px] uppercase tracking-widest text-zinc-500">
                    Shipment Editor
                  </p>
                  <FieldSelect
                    label="Shipping Method"
                    value={shipmentForm.shippingMethod}
                    onChange={(v) =>
                      setShipmentForm((f) => ({ ...f, shippingMethod: v as ShippingMethod }))
                    }
                    options={SHIPPING_OPTIONS}
                  />
                  <FieldSelect
                    label="Arrival Port"
                    value={shipmentForm.arrivalPort}
                    onChange={(v) =>
                      setShipmentForm((f) => ({ ...f, arrivalPort: v as ArrivalPort }))
                    }
                    options={ARRIVAL_PORT_OPTIONS}
                  />
                  <FieldInput
                    label="Vessel Name"
                    value={shipmentForm.vesselName}
                    onChange={(v) => setShipmentForm((f) => ({ ...f, vesselName: v }))}
                  />
                  <FieldInput
                    label="Booking Number"
                    value={shipmentForm.bookingNumber}
                    onChange={(v) => setShipmentForm((f) => ({ ...f, bookingNumber: v }))}
                    mono
                  />
                  <FieldInput
                    label="Departure Port"
                    value={shipmentForm.departurePort}
                    onChange={(v) => setShipmentForm((f) => ({ ...f, departurePort: v }))}
                  />
                  <FieldInput
                    label="Departure Date"
                    type="date"
                    value={shipmentForm.departureDate}
                    onChange={(v) => setShipmentForm((f) => ({ ...f, departureDate: v }))}
                  />
                  <FieldInput
                    label="ETA Lagos"
                    type="date"
                    value={shipmentForm.etaLagos}
                    onChange={(v) => setShipmentForm((f) => ({ ...f, etaLagos: v }))}
                  />
                  <label className="col-span-2 flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={shipmentForm.billOfLadingVerified}
                      onChange={(event) =>
                        setShipmentForm((f) => ({
                          ...f,
                          billOfLadingVerified: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 border border-white/20 bg-zinc-950"
                    />
                    Bill of Lading Verified
                  </label>
                  <button
                    type="submit"
                    className="col-span-2 mt-2 border border-white bg-white px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-zinc-950"
                  >
                    {selectedVehicle.shipment ? "Update Shipment" : "Create Shipment"}
                  </button>
                </form>

                <form
                  onSubmit={handleDispatchMilestone}
                  className="mt-8 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-2"
                >
                  <p className="sm:col-span-2 text-[10px] uppercase tracking-widest text-zinc-500">
                    Append Tracking Milestone
                  </p>
                  <FieldSelect
                    label="Milestone"
                    value={milestoneForm.code}
                    onChange={(v) =>
                      setMilestoneForm((f) => ({ ...f, code: v as MilestoneCode }))
                    }
                    options={MILESTONE_SEQUENCE.map((m) => m.code)}
                  />
                  <FieldSelect
                    label="Advance Status To"
                    value={milestoneForm.advanceStatus}
                    onChange={(v) =>
                      setMilestoneForm((f) => ({
                        ...f,
                        advanceStatus: v as VehicleStatus | "",
                      }))
                    }
                    options={["", ...STATUS_OPTIONS]}
                  />
                  <FieldInput
                    label="Location"
                    value={milestoneForm.location}
                    onChange={(v) => setMilestoneForm((f) => ({ ...f, location: v }))}
                  />
                  <FieldInput
                    label="Description"
                    value={milestoneForm.description}
                    onChange={(v) => setMilestoneForm((f) => ({ ...f, description: v }))}
                  />
                  <button
                    type="submit"
                    className="col-span-2 mt-2 flex items-center justify-center gap-2 border border-emerald-400 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-emerald-400 transition-colors hover:bg-emerald-400/10"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Dispatch Milestone
                  </button>
                </form>
              </>
            ) : (
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Select a vehicle from the roster.
              </p>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="col-span-1 border-b border-r border-white/10 px-4 py-6 lg:col-span-4 lg:px-8">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Notification Dispatch Log
                </p>
                <button
                  type="button"
                  onClick={() => setNotifications([])}
                  className="text-[10px] uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-400"
                >
                  Clear
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {notifications.map((n) => (
                  <div key={n.id} className="border border-white/10 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-medium text-white">{n.subject}</p>
                      <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                        {new Date(n.timestamp).toLocaleTimeString("en-CA")}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">
                      Email + WhatsApp &rarr; {n.buyerName} &lt;{n.buyerEmail}&gt;
                    </p>
                    <p className="mt-2 whitespace-pre-line break-words text-xs text-zinc-400">
                      {n.emailBody}
                    </p>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(n.whatsappMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 border border-emerald-500/40 px-3 py-1.5 text-[10px] uppercase tracking-widest text-emerald-400 transition-colors hover:bg-emerald-500/10"
                    >
                      Send Milestone Alert via WhatsApp
                      <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "ADD_INVENTORY" && (
        <div className="grid grid-cols-1 border-l border-t border-white/10 lg:grid-cols-4">
          <form
            onSubmit={handleAddVehicle}
            className="col-span-1 grid grid-cols-1 gap-4 border-b border-r border-white/10 px-4 py-8 sm:grid-cols-2 lg:col-span-3 lg:px-8"
          >
            <p className="sm:col-span-2 text-[10px] uppercase tracking-widest text-zinc-500">
              Vehicle Intake
            </p>
            <FieldInput
              label="Year"
              type="number"
              value={vehicleForm.year}
              onChange={(v) => setVehicleForm((f) => ({ ...f, year: v }))}
            />
            <FieldInput
              label="Make"
              value={vehicleForm.make}
              onChange={(v) => setVehicleForm((f) => ({ ...f, make: v }))}
            />
            <FieldInput
              label="Model"
              value={vehicleForm.model}
              onChange={(v) => setVehicleForm((f) => ({ ...f, model: v }))}
            />
            <div className="sm:col-span-2 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                VIN (17 characters)
              </span>
              <div className="flex items-stretch gap-2">
                <input
                  value={vehicleForm.vin}
                  onChange={(event) =>
                    setVehicleForm((f) => ({
                      ...f,
                      vin: event.target.value.toUpperCase().slice(0, 17),
                    }))
                  }
                  className="flex-1 border border-white/20 bg-transparent px-3 py-2 font-mono text-xs text-white focus:border-white/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleDecodeVin}
                  disabled={decodingVin || vehicleForm.vin.length !== 17}
                  className="flex items-stretch bg-white text-zinc-950 transition-opacity disabled:opacity-40"
                >
                  <span className="flex items-center px-4 text-[10px] font-medium uppercase tracking-widest">
                    {decodingVin ? "Decoding…" : "Decode VIN"}
                  </span>
                  <span className="flex items-center justify-center border-l border-zinc-200 px-3">
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                  Sample VINs:
                </span>
                {SAMPLE_VINS.map((sample) => (
                  <button
                    key={sample.vin}
                    type="button"
                    onClick={() =>
                      setVehicleForm((f) => ({ ...f, vin: sample.vin }))
                    }
                    className="border border-white/20 px-2 py-1 font-mono text-[10px] text-zinc-400 transition-colors hover:border-white/40 hover:text-white"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
              {vinDecodeError && (
                <p className="text-xs text-red-400">{vinDecodeError}</p>
              )}
              {vinDecodeSuccess && (
                <p className="text-xs text-emerald-400">{vinDecodeSuccess}</p>
              )}
            </div>
            <FieldInput
              label="Base Price (CAD)"
              type="number"
              value={vehicleForm.basePriceCAD}
              onChange={(v) => setVehicleForm((f) => ({ ...f, basePriceCAD: v }))}
            />
            <FieldInput
              label="Location in Canada"
              value={vehicleForm.location}
              onChange={(v) => setVehicleForm((f) => ({ ...f, location: v }))}
            />
            <FieldInput
              label="Mileage (km)"
              type="number"
              value={vehicleForm.mileageKm}
              onChange={(v) => setVehicleForm((f) => ({ ...f, mileageKm: v }))}
            />
            <FieldInput
              label="Engine"
              value={vehicleForm.engine}
              onChange={(v) => setVehicleForm((f) => ({ ...f, engine: v }))}
            />
            <FieldInput
              label="Drivetrain"
              value={vehicleForm.drivetrain}
              onChange={(v) => setVehicleForm((f) => ({ ...f, drivetrain: v }))}
            />
            <FieldInput
              label="Exterior Color"
              value={vehicleForm.exteriorColor}
              onChange={(v) => setVehicleForm((f) => ({ ...f, exteriorColor: v }))}
            />
            <FieldSelect
              label="Initial Status"
              value={vehicleForm.status}
              onChange={(v) => setVehicleForm((f) => ({ ...f, status: v as VehicleStatus }))}
              options={STATUS_OPTIONS}
            />
            <FieldInput
              label="Image URL"
              value={vehicleForm.imageUrl}
              onChange={(v) => setVehicleForm((f) => ({ ...f, imageUrl: v }))}
              mono
            />

            <div className="sm:col-span-2">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">
                Preset Studio Photos
              </p>
              <div className="flex flex-wrap gap-2">
                {IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setVehicleForm((f) => ({ ...f, imageUrl: preset.url }))
                    }
                    className={`relative h-14 w-20 overflow-hidden border ${
                      vehicleForm.imageUrl === preset.url
                        ? "border-white"
                        : "border-white/20"
                    }`}
                  >
                    <Image
                      src={preset.url}
                      alt={preset.label}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="sm:col-span-2 mt-4 border border-white bg-white px-4 py-3 text-[10px] font-medium uppercase tracking-widest text-zinc-950"
            >
              Publish to Inventory
            </button>
            {addedMessage && (
              <p className="sm:col-span-2 text-[10px] uppercase tracking-widest text-emerald-400">
                {addedMessage}
              </p>
            )}
          </form>

          <div className="col-span-1 border-b border-r border-white/10 bg-white p-6 text-zinc-950">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400">
              Live Nigerian Landed Cost Preview
            </p>
            <p className="mt-4 font-mono text-2xl font-medium tracking-tight">
              {formatNGN(previewBreakdown.totalNGN)}
            </p>
            <p className="font-mono text-xs text-zinc-500">
              {formatCAD(previewBreakdown.basePriceCAD)} base
            </p>

            <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4">
              <ManifestPreviewRow label="Age Tier" value={previewBreakdown.ageTier} />
              <ManifestPreviewRow
                label="Customs Duty"
                value={`${previewBreakdown.dutyRatePct}%`}
              />
              <ManifestPreviewRow
                label="NAC Levy"
                value={`${previewBreakdown.nacLevyRatePct}%`}
              />
              <ManifestPreviewRow
                label="Duty + Levy (NGN)"
                value={formatNGN(
                  previewBreakdown.customsDutyNGN + previewBreakdown.nacLevyNGN
                )}
              />
              <ManifestPreviewRow
                label="VAT + CISS + ETLS"
                value={formatNGN(previewBreakdown.statutoryTaxesNGN)}
              />
              <ManifestPreviewRow
                label="Port Clearing"
                value={formatNGN(previewBreakdown.portClearingNGN)}
              />
            </div>
          </div>
        </div>
      )}

      {mode === "SOURCING_MANDATES" && (
        <div className="grid grid-cols-1 border-l border-t border-white/10">
          <div className="flex items-center justify-between border-b border-r border-white/10 px-4 py-4 lg:px-8">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              Custom Sourcing Mandates
            </p>
            <p className="font-mono text-[10px] text-zinc-500">
              {sourcingRequests.length} Requests
            </p>
          </div>
          {sourcingRequests.length === 0 ? (
            <div className="border-b border-r border-white/10 px-4 py-12 text-center text-xs uppercase tracking-widest text-zinc-500 lg:px-8">
              No sourcing mandates yet.
            </div>
          ) : (
            <div className="divide-y divide-white/10 border-b border-r border-white/10">
              {sourcingRequests.map((request) => (
                <div
                  key={request.id}
                  className="grid grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-2 lg:grid-cols-6 lg:items-center lg:px-8"
                >
                  <div>
                    <p className="font-mono text-xs text-zinc-500">{request.id}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">
                      {new Date(request.createdAt).toLocaleDateString("en-CA")}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">
                      {request.buyer.name}
                    </p>
                    <p className="truncate text-[10px] text-zinc-500">
                      {request.buyer.email}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-500">
                      {request.buyer.phone}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">
                      {request.vehicleSpec.year} {request.vehicleSpec.make}{" "}
                      {request.vehicleSpec.model}
                    </p>
                    <p className="truncate text-[10px] text-zinc-500">
                      {request.vehicleSpec.trimOrColor}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Max {request.vehicleSpec.maxMileageKm.toLocaleString("en-CA")} km
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                      Total NGN Budget
                    </p>
                    <p className="font-mono text-xs text-white">
                      {formatNGN(request.financials.totalBudgetNGN)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                      Max Canadian Bid
                    </p>
                    <p className="font-mono text-sm font-medium text-emerald-400">
                      {formatCAD(request.financials.maxBidCAD)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <select
                      value={request.status}
                      onChange={(event) =>
                        updateSourcingRequestStatus(
                          request.id,
                          event.target.value as SourcingRequestStatus
                        )
                      }
                      className="border border-white/20 bg-zinc-950 px-2 py-1.5 text-[10px] uppercase tracking-wide text-white"
                    >
                      {SOURCING_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleConvertToInventory(request)}
                      className="flex min-h-[36px] items-center justify-center gap-2 border border-white/20 px-3 text-[10px] uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
                    >
                      Convert to Inventory
                      <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomFooter onOpenMenu={() => setMenuOpen(true)} />
      <NavigationDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
