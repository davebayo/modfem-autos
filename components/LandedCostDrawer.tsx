"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MessageCircle, Plus, Printer, X } from "lucide-react";
import Link from "next/link";
import { DestinationPort, ShippingMethod, Vehicle } from "@/lib/types";
import { calculateLandedCost, formatCAD, formatNGN, formatPct } from "@/lib/pricing";
import { useExchangeRate } from "@/lib/fx";
import { reserveVehicle, ReservationResult } from "@/lib/store";
import { DEALER_WHATSAPP_NUMBER } from "@/lib/config";

interface LandedCostDrawerProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

interface ConfirmationState extends ReservationResult {
  buyerPhone: string;
  quotedLandedNGN: number;
  exchangeRateCadToNgn: number;
  shippingMethod: ShippingMethod;
  destinationPort: DestinationPort;
}

interface BuyerFormState {
  name: string;
  email: string;
  phone: string;
}

const EMPTY_BUYER_FORM: BuyerFormState = { name: "", email: "", phone: "" };

function BreakdownRow({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-200 py-3">
      <div>
        <p className="text-sm text-zinc-600">{label}</p>
        {caption && (
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">
            {caption}
          </p>
        )}
      </div>
      <span className="whitespace-nowrap font-mono text-sm text-zinc-950">
        {value}
      </span>
    </div>
  );
}

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex border border-zinc-300">
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 py-2.5 text-[10px] font-medium uppercase tracking-wide transition-colors ${
            index > 0 ? "border-l border-zinc-300" : ""
          } ${
            value === option.value
              ? "bg-zinc-950 text-white"
              : "bg-white text-zinc-500"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function DrawerField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
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
        placeholder={placeholder}
        className="border border-zinc-300 px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
      />
    </label>
  );
}

export function LandedCostDrawer({
  vehicle,
  isOpen,
  onClose,
}: LandedCostDrawerProps) {
  const fx = useExchangeRate();
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("RoRo");
  const [destinationPort, setDestinationPort] =
    useState<DestinationPort>("Tin Can Island");
  const [phase, setPhase] = useState<"breakdown" | "buyer-form" | "confirmed">(
    "breakdown"
  );
  const [buyerForm, setBuyerForm] = useState<BuyerFormState>(EMPTY_BUYER_FORM);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null
  );

  const breakdown = calculateLandedCost(vehicle, {
    shippingMethod,
    destinationPort,
    exchangeRateCadToNgn: fx.rate,
  });

  function handleClose() {
    setPhase("breakdown");
    setBuyerForm(EMPTY_BUYER_FORM);
    setReserveError(null);
    onClose();
  }

  function handleReserveSubmit(event: FormEvent) {
    event.preventDefault();
    if (!buyerForm.name.trim() || !buyerForm.email.trim() || !buyerForm.phone.trim()) {
      setReserveError("Please complete all buyer dossier fields.");
      return;
    }
    const result = reserveVehicle(vehicle.id, buyerForm, {
      shippingMethod,
      destinationPort,
      quotedLandedNGN: breakdown.totalNGN,
    });
    if (!result) {
      setReserveError(
        "This vehicle could not be reserved — it may no longer be available."
      );
      return;
    }
    setConfirmation({
      ...result,
      buyerPhone: buyerForm.phone,
      quotedLandedNGN: breakdown.totalNGN,
      exchangeRateCadToNgn: breakdown.exchangeRateCadToNgn,
      shippingMethod,
      destinationPort,
    });
    setReserveError(null);
    setPhase("confirmed");
  }

  const segments = [
    {
      label: "Vehicle Base",
      pct: breakdown.baseCostPct,
      className: "bg-zinc-950",
    },
    {
      label: "Freight & Insurance",
      pct: breakdown.shippingAndInsurancePct,
      className: "bg-zinc-500",
    },
    {
      label: "Customs & Port Fees",
      pct: breakdown.customsAndClearingPct,
      className: "bg-zinc-300",
    },
  ];

  const depositNGN = confirmation ? confirmation.quotedLandedNGN * 0.3 : 0;
  const balanceNGN = confirmation ? confirmation.quotedLandedNGN * 0.7 : 0;
  const depositCAD = confirmation
    ? depositNGN / confirmation.exchangeRateCadToNgn
    : 0;
  const balanceCAD = confirmation
    ? balanceNGN / confirmation.exchangeRateCadToNgn
    : 0;

  const whatsappUrl = confirmation
    ? `https://wa.me/${DEALER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        [
          `Modfem Autos Reservation — ${confirmation.bookingReference}`,
          `Vehicle: ${vehicle.name}`,
          `VIN: ${vehicle.vin}`,
          `Buyer: ${confirmation.buyer.name} (${confirmation.buyerPhone})`,
          `Port: ${confirmation.shipment.arrivalPort} · ${confirmation.shipment.shippingMethod}`,
          `Quoted Landed Cost: ${formatNGN(confirmation.quotedLandedNGN)}`,
          `30% Deposit Due: ${formatNGN(depositNGN)}`,
        ].join("\n")
      )}`
    : "#";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/60 print:hidden"
          />

          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-white text-zinc-950 sm:max-w-md print:relative print:inset-auto print:h-auto print:max-w-none"
          >
            {phase === "confirmed" && confirmation ? (
              <div className="print-dossier flex h-full flex-col border-2 border-zinc-950">
                <div className="flex shrink-0 items-start justify-between border-b border-zinc-200 px-6 py-5 print:hidden sm:px-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400">
                      Confirmed
                    </p>
                    <h2 className="mt-1 text-xl font-medium tracking-tight">
                      Proforma Import Dossier
                    </h2>
                  </div>
                  <button type="button" onClick={handleClose}>
                    <X className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-8">
                  <p className="font-mono text-sm font-medium">
                    {confirmation.bookingReference}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4">
                    <BreakdownRow label="Buyer" value={confirmation.buyer.name} />
                    <BreakdownRow label="Email" value={confirmation.buyer.email} />
                    <BreakdownRow
                      label="Phone / WhatsApp"
                      value={confirmation.buyerPhone}
                    />
                    <BreakdownRow label="VIN" value={vehicle.vin} />
                    <BreakdownRow
                      label="Destination Port"
                      value={confirmation.shipment.arrivalPort}
                    />
                    <BreakdownRow
                      label="Shipping Mode"
                      value={confirmation.shipment.shippingMethod}
                    />
                  </div>

                  <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4">
                    <BreakdownRow
                      label="30% Canadian Acquisition Deposit"
                      value={`${formatCAD(depositCAD)} / ${formatNGN(depositNGN)}`}
                    />
                    <BreakdownRow
                      label="70% Port Clearing Balance"
                      value={`${formatCAD(balanceCAD)} / ${formatNGN(balanceNGN)}`}
                    />
                    <div className="flex items-end justify-between border-t-2 border-zinc-950 pt-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">
                        Total Quoted Landed Cost
                      </span>
                      <span className="font-mono text-xl font-medium tracking-tight">
                        {formatNGN(confirmation.quotedLandedNGN)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-[10px] uppercase tracking-wide text-zinc-400 print:mt-8">
                    Estimate only &mdash; final clearing costs confirmed by a
                    licensed Modfem Autos agent at Tin Can / Apapa.
                  </p>
                </div>

                <div className="shrink-0 border-t border-zinc-200 px-6 py-5 print:hidden sm:px-8">
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/track?vin=${vehicle.vin}`}
                      className="flex min-h-[44px] items-center justify-between border border-zinc-950 px-4 text-[10px] font-medium uppercase tracking-widest transition-colors hover:bg-zinc-950 hover:text-white"
                    >
                      Track Consignment on /track
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex min-h-[44px] items-center justify-between border border-zinc-950 px-4 text-[10px] font-medium uppercase tracking-widest transition-colors hover:bg-zinc-950 hover:text-white"
                    >
                      Print / Save Proforma PDF
                      <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[44px] items-center justify-between border border-zinc-950 px-4 text-[10px] font-medium uppercase tracking-widest transition-colors hover:bg-zinc-950 hover:text-white"
                    >
                      Dispatch to Dealer via WhatsApp
                      <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex shrink-0 items-start justify-between border-b border-zinc-200 px-6 py-5 sm:px-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400">
                      Landed Cost Estimate
                    </p>
                    <h2 className="mt-1 text-xl font-medium tracking-tight">
                      {vehicle.name}
                    </h2>
                  </div>
                  <button type="button" onClick={handleClose}>
                    <X className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-400">
                        Shipping Method
                      </p>
                      <ToggleGroup
                        value={shippingMethod}
                        onChange={setShippingMethod}
                        options={[
                          { label: "RoRo", value: "RoRo" },
                          { label: "Container", value: "Container" },
                        ]}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-400">
                        Destination Port
                      </p>
                      <ToggleGroup
                        value={destinationPort}
                        onChange={setDestinationPort}
                        options={[
                          { label: "Tin Can Island", value: "Tin Can Island" },
                          { label: "Apapa", value: "Apapa" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 border border-zinc-300 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-400">
                        Exchange Rate (
                        {fx.source === "live"
                          ? "Live"
                          : fx.source === "manual"
                            ? "Manual Override"
                            : "Fallback"}
                        )
                      </p>
                      <p className="mt-1 font-mono text-sm">
                        &#8362;{fx.rate.toLocaleString("en-NG")} / CAD
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fx.setOverride(fx.rate - 10)}
                        className="flex min-h-[36px] items-center border border-zinc-300 px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-950 hover:text-zinc-950"
                      >
                        &minus;10
                      </button>
                      <input
                        type="number"
                        value={fx.rate}
                        onChange={(event) =>
                          fx.setOverride(Number(event.target.value))
                        }
                        className="w-20 border border-zinc-300 px-2 py-1.5 text-center font-mono text-xs focus:border-zinc-950 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => fx.setOverride(fx.rate + 10)}
                        className="flex min-h-[36px] items-center border border-zinc-300 px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-950 hover:text-zinc-950"
                      >
                        +10
                      </button>
                      {fx.isOverridden && (
                        <button
                          type="button"
                          onClick={fx.resetOverride}
                          className="text-[10px] uppercase tracking-wide text-zinc-500 underline underline-offset-2"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-400">
                      Cost Composition
                    </p>
                    <div className="flex h-2 w-full border border-zinc-200">
                      {segments.map((segment) => (
                        <div
                          key={segment.label}
                          className={segment.className}
                          style={{ width: `${segment.pct}%` }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4">
                      {segments.map((segment) => (
                        <div key={segment.label} className="flex items-center gap-2">
                          <span className={`h-2 w-2 ${segment.className}`} />
                          <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                            {segment.label}{" "}
                            <span className="font-mono text-zinc-800">
                              {formatPct(segment.pct)}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <BreakdownRow
                      label="Canadian Base Price"
                      caption={`${formatCAD(breakdown.basePriceCAD)} @ ₦${breakdown.exchangeRateCadToNgn.toLocaleString(
                        "en-NG"
                      )}/CAD`}
                      value={formatNGN(breakdown.basePriceNGN)}
                    />
                    <BreakdownRow
                      label={`Ocean Freight — ${shippingMethod}`}
                      caption={formatCAD(breakdown.freightCAD)}
                      value={formatNGN(breakdown.freightNGN)}
                    />
                    <BreakdownRow
                      label="Marine Insurance"
                      caption="1.5% of Base + Freight"
                      value={formatNGN(breakdown.insuranceNGN)}
                    />
                    <BreakdownRow
                      label="CIF Value"
                      caption="Cost + Insurance + Freight"
                      value={formatNGN(breakdown.cifValueNGN)}
                    />
                    <BreakdownRow
                      label={`Nigerian Customs Duty — ${breakdown.dutyRatePct}%`}
                      caption={`${breakdown.ageTier} model${
                        breakdown.depreciationDiscountPct > 0
                          ? ` · ${breakdown.depreciationDiscountPct}% age depreciation on taxable base`
                          : ""
                      }`}
                      value={formatNGN(breakdown.customsDutyNGN)}
                    />
                    <BreakdownRow
                      label={`NAC Levy — ${breakdown.nacLevyRatePct}%`}
                      caption={`Taxable base ${formatNGN(breakdown.taxableCustomsBaseNGN)}`}
                      value={formatNGN(breakdown.nacLevyNGN)}
                    />
                    <BreakdownRow
                      label="VAT, CISS & ETLS"
                      caption="7.5% VAT + 1% CISS + 0.5% ETLS"
                      value={formatNGN(breakdown.statutoryTaxesNGN)}
                    />
                    <BreakdownRow
                      label="Port Clearing & Agency Fees"
                      caption={destinationPort}
                      value={formatNGN(breakdown.portClearingNGN)}
                    />
                  </div>

                  {vehicle.status === "AVAILABLE" && phase === "buyer-form" && (
                    <form
                      onSubmit={handleReserveSubmit}
                      className="mt-6 border border-zinc-950 p-4"
                    >
                      <p className="mb-4 text-[10px] uppercase tracking-widest text-zinc-500">
                        Buyer Dossier
                      </p>
                      <div className="flex flex-col gap-3">
                        <DrawerField
                          label="Full Name"
                          value={buyerForm.name}
                          onChange={(value) =>
                            setBuyerForm((f) => ({ ...f, name: value }))
                          }
                        />
                        <DrawerField
                          label="Email"
                          type="email"
                          value={buyerForm.email}
                          onChange={(value) =>
                            setBuyerForm((f) => ({ ...f, email: value }))
                          }
                        />
                        <DrawerField
                          label="Nigerian Phone / WhatsApp"
                          value={buyerForm.phone}
                          placeholder="+234 80..."
                          onChange={(value) =>
                            setBuyerForm((f) => ({ ...f, phone: value }))
                          }
                        />
                      </div>
                      {reserveError && (
                        <p className="mt-3 text-xs text-red-600">{reserveError}</p>
                      )}
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPhase("breakdown");
                            setReserveError(null);
                          }}
                          className="min-h-[44px] flex-1 border border-zinc-300 text-[10px] font-medium uppercase tracking-widest text-zinc-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="min-h-[44px] flex-1 bg-zinc-950 text-[10px] font-medium uppercase tracking-widest text-white"
                        >
                          Confirm Reservation
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="shrink-0 border-t border-zinc-200 px-6 py-5 sm:px-8">
                  <div className="flex items-end justify-between border-b-2 border-zinc-950 pb-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">
                      Total Landed Cost
                    </span>
                    <span className="font-mono text-2xl font-medium tracking-tight">
                      {formatNGN(breakdown.totalNGN)}
                    </span>
                  </div>

                  {vehicle.status === "AVAILABLE" ? (
                    phase !== "buyer-form" && (
                      <button
                        type="button"
                        onClick={() => setPhase("buyer-form")}
                        className="mt-4 flex min-h-[52px] w-full items-stretch bg-zinc-950 text-white"
                      >
                        <span className="flex flex-1 items-center justify-center px-4 text-xs font-medium uppercase tracking-widest">
                          Reserve &amp; Lock Quote (30% Deposit)
                        </span>
                        <span className="flex items-center justify-center border-l border-white/20 px-4">
                          <Plus className="h-4 w-4" strokeWidth={1.5} />
                        </span>
                      </button>
                    )
                  ) : (
                    <div className="mt-4 text-xs text-zinc-500">
                      This vehicle is currently{" "}
                      <strong className="text-zinc-950">{vehicle.status}</strong>{" "}
                      &mdash; contact your Modfem Autos agent for status updates.
                    </div>
                  )}
                  <p className="mt-3 text-[10px] uppercase tracking-wide text-zinc-400">
                    Estimate only &mdash; final clearing costs confirmed by a
                    licensed Modfem Autos agent at Tin Can / Apapa.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
