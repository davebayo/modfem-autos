"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, Plus } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { BottomFooter } from "@/components/BottomFooter";
import { NavigationDrawer } from "@/components/NavigationDrawer";
import { useExchangeRate } from "@/lib/fx";
import { createSourcingRequest, useVehicles } from "@/lib/store";
import {
  calculateMaxCanadianBid,
  formatCAD,
  formatNGN,
  formatNGNCompact,
  formatPct,
} from "@/lib/pricing";
import { DestinationPort, ShippingMethod, SourcingRequest } from "@/lib/types";
import { DEALER_WHATSAPP_NUMBER } from "@/lib/config";

const BUDGET_MIN = 15_000_000;
const BUDGET_MAX = 250_000_000;
const BUDGET_STEP = 500_000;
const BUDGET_PRESETS = [35_000_000, 60_000_000, 95_000_000, 150_000_000];
const YEAR_OPTIONS = Array.from({ length: 2026 - 2018 + 1 }, (_, i) => 2026 - i);

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
    <div className="flex border border-white/20">
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 py-2.5 text-[10px] font-medium uppercase tracking-wide transition-colors ${
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

function FieldInput({
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
        className="border border-white/20 bg-transparent px-3 py-2.5 text-sm text-white focus:border-white/50 focus:outline-none"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-xs text-zinc-600">{label}</span>
      <span className="whitespace-nowrap font-mono text-xs text-zinc-950">
        {value}
      </span>
    </div>
  );
}

function ConfirmationView({
  confirmation,
  whatsappUrl,
}: {
  confirmation: SourcingRequest;
  whatsappUrl: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-zinc-400">
        Confirmed
      </p>
      <h2 className="mt-1 text-xl font-medium tracking-tight">
        Sourcing Mandate Dispatched
      </h2>
      <p className="mt-4 font-mono text-sm font-medium">{confirmation.id}</p>

      <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4">
        <Row label="Buyer" value={confirmation.buyer.name} />
        <Row
          label="Target Vehicle"
          value={`${confirmation.vehicleSpec.year} ${confirmation.vehicleSpec.make} ${confirmation.vehicleSpec.model}`}
        />
        <Row
          label="Max Canadian Bid"
          value={formatCAD(confirmation.financials.maxBidCAD)}
        />
        <Row
          label="All-In Budget"
          value={formatNGN(confirmation.financials.totalBudgetNGN)}
        />
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Our Canadian auction desk begins sourcing at Manheim Toronto / ADESA
        Montreal and notifies you the moment a match is found.
      </p>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex min-h-[44px] items-center justify-between border border-zinc-950 px-4 text-[10px] font-medium uppercase tracking-widest transition-colors hover:bg-zinc-950 hover:text-white"
      >
        Dispatch Mandate to Dealer WhatsApp
        <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
      </a>
    </div>
  );
}

export default function RequestPage() {
  const fx = useExchangeRate();
  const vehicles = useVehicles();
  const [menuOpen, setMenuOpen] = useState(false);

  const [totalBudgetNGN, setTotalBudgetNGN] = useState(60_000_000);
  const [year, setYear] = useState(2022);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("RoRo");
  const [destinationPort, setDestinationPort] =
    useState<DestinationPort>("Tin Can Island");

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trimOrColor, setTrimOrColor] = useState("");
  const [maxMileageKm, setMaxMileageKm] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<SourcingRequest | null>(null);

  const maxBid = useMemo(
    () =>
      calculateMaxCanadianBid({
        totalBudgetNGN,
        year,
        shippingMethod,
        destinationPort,
        exchangeRateCadToNgn: fx.rate,
      }),
    [totalBudgetNGN, year, shippingMethod, destinationPort, fx.rate]
  );

  const matchingVehicle = useMemo(
    () =>
      vehicles.find(
        (v) => v.status === "AVAILABLE" && v.basePriceCAD <= maxBid.maxBasePriceCAD
      ),
    [vehicles, maxBid.maxBasePriceCAD]
  );

  const feasibility = useMemo(() => {
    if (maxBid.maxBasePriceCAD >= 45_000) {
      return {
        label: "Strong Canadian Auction Budget",
        className: "border-emerald-600 text-emerald-700",
      };
    }
    if (maxBid.maxBasePriceCAD >= 20_000) {
      return {
        label: "Workable Budget for Selected Year",
        className: "border-amber-600 text-amber-700",
      };
    }
    return {
      label: "Tight Budget for Selected Year",
      className: "border-red-600 text-red-700",
    };
  }, [maxBid.maxBasePriceCAD]);

  const segments = [
    {
      label: "Vehicle in Canada",
      pct: maxBid.breakdown.baseCostPct,
      className: "bg-zinc-950",
    },
    {
      label: "Ocean Freight & Insurance",
      pct: maxBid.breakdown.shippingAndInsurancePct,
      className: "bg-zinc-500",
    },
    {
      label: "Nigerian Customs & Port",
      pct: maxBid.breakdown.customsAndClearingPct,
      className: "bg-zinc-300",
    },
  ];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (
      !make.trim() ||
      !model.trim() ||
      !buyerName.trim() ||
      !buyerEmail.trim() ||
      !buyerPhone.trim()
    ) {
      setSubmitError("Please complete all required fields.");
      return;
    }
    const request = createSourcingRequest({
      buyer: { name: buyerName, email: buyerEmail, phone: buyerPhone },
      vehicleSpec: {
        year,
        make,
        model,
        trimOrColor,
        maxMileageKm: Number(maxMileageKm) || 0,
      },
      financials: {
        totalBudgetNGN,
        maxBidCAD: maxBid.maxBasePriceCAD,
        shippingMethod,
        destinationPort,
        exchangeRateUsed: fx.rate,
      },
    });
    setSubmitError(null);
    setConfirmation(request);
  }

  const whatsappUrl = confirmation
    ? `https://wa.me/${DEALER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        [
          `Modfem Autos Sourcing Mandate — ${confirmation.id}`,
          `Buyer: ${confirmation.buyer.name} (${confirmation.buyer.phone})`,
          `Target: ${confirmation.vehicleSpec.year} ${confirmation.vehicleSpec.make} ${confirmation.vehicleSpec.model}`,
          `All-In Budget: ${formatNGN(confirmation.financials.totalBudgetNGN)}`,
          `Max Canadian Bid: ${formatCAD(confirmation.financials.maxBidCAD)}`,
        ].join("\n")
      )}`
    : "#";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <TopNav
        announcement="Custom Canadian Sourcing Concierge — Reverse Budget to Auction Bid"
        onOpenMenu={() => setMenuOpen(true)}
      />

      <div className="border-b border-white/10 px-4 py-8 sm:px-8 lg:py-10">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Direct Canadian Auction Access
        </p>
        <h1 className="mt-2 max-w-3xl text-2xl font-medium tracking-tight sm:text-3xl">
          Source Any Vehicle at Manheim Toronto, ADESA Montreal &amp; OEM Lease
          Return Auctions
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-light text-zinc-400">
          Tell us your total all-in Lagos budget and the vehicle you want —
          we reverse the landed-cost formula to show exactly what you can bid
          in Canada, then dispatch a sourcing mandate straight to our auction
          desk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4">
        <form
          onSubmit={handleSubmit}
          className="col-span-1 border-b border-white/10 px-4 py-8 sm:px-8 lg:col-span-2 lg:border-b-0 lg:border-r"
        >
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            Step 1 &mdash; All-In Nigerian Budget &amp; Logistics
          </p>

          <div className="mt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                Total All-In Budget (&#8362;)
              </span>
              <input
                type="number"
                value={totalBudgetNGN}
                onChange={(event) =>
                  setTotalBudgetNGN(
                    Math.min(
                      BUDGET_MAX,
                      Math.max(BUDGET_MIN, Number(event.target.value) || 0)
                    )
                  )
                }
                className="w-full border border-white/20 bg-transparent px-2 py-1.5 text-right font-mono text-sm text-white focus:border-white/50 focus:outline-none sm:w-40"
              />
            </div>
            <input
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={BUDGET_STEP}
              value={totalBudgetNGN}
              onChange={(event) => setTotalBudgetNGN(Number(event.target.value))}
              className="mt-3 w-full accent-white"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTotalBudgetNGN(preset)}
                  className={`border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                    totalBudgetNGN === preset
                      ? "border-white bg-white text-zinc-950"
                      : "border-white/20 text-zinc-400 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {formatNGNCompact(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                Target Model Year
              </span>
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="border border-white/20 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-white/50 focus:outline-none"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
              Customs Age Tier:{" "}
              <span className="text-zinc-300">{maxBid.breakdown.ageTier}</span>
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">
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
              <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">
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

          <div className="mt-6 flex items-center justify-between border border-white/20 px-4 py-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              Live Exchange Rate
            </span>
            <span className="font-mono text-sm">
              &#8362;{fx.rate.toLocaleString("en-NG")} / CAD
            </span>
          </div>

          <p className="mt-10 text-[10px] uppercase tracking-widest text-zinc-500">
            Step 2 &mdash; Target Vehicle Dossier &amp; Buyer Contact
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldInput label="Make" value={make} onChange={setMake} placeholder="e.g. Porsche" />
            <FieldInput
              label="Model"
              value={model}
              onChange={setModel}
              placeholder="e.g. Cayenne Coupe"
            />
            <FieldInput
              label="Preferred Trim / Exterior Color"
              value={trimOrColor}
              onChange={setTrimOrColor}
            />
            <FieldInput
              label="Maximum Mileage (km)"
              type="number"
              value={maxMileageKm}
              onChange={setMaxMileageKm}
            />
            <FieldInput label="Buyer Full Name" value={buyerName} onChange={setBuyerName} />
            <FieldInput
              label="Email"
              type="email"
              value={buyerEmail}
              onChange={setBuyerEmail}
            />
            <FieldInput
              label="Nigerian WhatsApp Number"
              value={buyerPhone}
              onChange={setBuyerPhone}
              placeholder="+234 80..."
            />
          </div>

          {submitError && (
            <p className="mt-4 text-xs text-red-400">{submitError}</p>
          )}

          {!confirmation && (
            <button
              type="submit"
              className="mt-8 flex min-h-[52px] w-full items-stretch bg-white text-zinc-950"
            >
              <span className="flex flex-1 items-center justify-center px-4 text-xs font-medium uppercase tracking-widest">
                Submit Auction Sourcing Mandate
              </span>
              <span className="flex items-center justify-center border-l border-zinc-200 px-4">
                <Plus className="h-4 w-4" strokeWidth={1.5} />
              </span>
            </button>
          )}
        </form>

        <div className="col-span-1 bg-white p-6 text-zinc-950 md:p-8 lg:col-span-2">
          {confirmation ? (
            <ConfirmationView confirmation={confirmation} whatsappUrl={whatsappUrl} />
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400">
                Live Purchasing Power
              </p>
              <p className="mt-4 text-[10px] uppercase tracking-widest text-zinc-400">
                Maximum Canadian Vehicle Price
              </p>
              <p className="mt-1 font-mono text-4xl font-medium tracking-tight sm:text-5xl">
                {formatCAD(maxBid.maxBasePriceCAD)}
              </p>
              <p className="font-mono text-sm text-zinc-500">
                &#8776; {formatNGN(maxBid.breakdown.basePriceNGN)} of your budget
              </p>

              <div
                className={`mt-4 inline-flex w-fit items-center gap-2 border px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest ${feasibility.className}`}
              >
                {feasibility.label}
              </div>

              {matchingVehicle && (
                <Link
                  href={`/track?id=${matchingVehicle.id}`}
                  className="mt-3 flex min-h-[44px] items-center justify-between border border-zinc-950 px-4 text-[10px] font-medium uppercase tracking-widest transition-colors hover:bg-zinc-950 hover:text-white"
                >
                  In Stock Now: {matchingVehicle.name}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                </Link>
              )}

              <div className="mt-8">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-400">
                  Budget Allocation
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
                      <span className={`h-2 w-2 shrink-0 ${segment.className}`} />
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

              <div className="mt-8 space-y-2 border-t border-zinc-200 pt-4">
                <Row
                  label="Recommended Auction Ceiling"
                  value={formatCAD(maxBid.recommendedAuctionCeilingCAD)}
                />
                <Row
                  label="Sourcing & Inspection Margin"
                  value={formatCAD(maxBid.sourcingFeeCAD)}
                />
                <Row
                  label="Ocean Freight & Insurance"
                  value={formatNGN(
                    maxBid.breakdown.freightNGN + maxBid.breakdown.insuranceNGN
                  )}
                />
                <Row
                  label="Customs & Port Clearing"
                  value={formatNGN(
                    maxBid.breakdown.customsDutyNGN +
                      maxBid.breakdown.nacLevyNGN +
                      maxBid.breakdown.statutoryTaxesNGN +
                      maxBid.breakdown.portClearingNGN
                  )}
                />
                <div className="flex items-end justify-between border-t-2 border-zinc-950 pt-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">
                    Total All-In Budget
                  </span>
                  <span className="font-mono text-lg font-medium">
                    {formatNGN(maxBid.breakdown.totalNGN)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <BottomFooter onOpenMenu={() => setMenuOpen(true)} />
      <NavigationDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
