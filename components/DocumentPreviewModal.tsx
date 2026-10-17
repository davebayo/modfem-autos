"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Printer, ShieldCheck, X } from "lucide-react";
import { Vehicle } from "@/lib/types";
import { calculateLandedCost, formatNGN } from "@/lib/pricing";

export type DocumentType = "EXPORT_CERT" | "BILL_OF_LADING" | "CUSTOMS_ASSESSMENT";

const DOCUMENT_TITLES: Record<DocumentType, string> = {
  EXPORT_CERT: "CARFAX & Canadian Export Certificate",
  BILL_OF_LADING: "Ocean Bill of Lading",
  CUSTOMS_ASSESSMENT: "NCS Customs Assessment & SONCAP Release",
};

interface DocumentPreviewModalProps {
  vehicle: Vehicle;
  documentType: DocumentType | null;
  onClose: () => void;
}

function DocRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <tr className="border-b border-zinc-200">
      <td className="whitespace-nowrap py-2 pr-4 text-xs text-zinc-500">{label}</td>
      <td
        className={`py-2 text-right text-xs text-zinc-950 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </td>
    </tr>
  );
}

export function DocumentPreviewModal({
  vehicle,
  documentType,
  onClose,
}: DocumentPreviewModalProps) {
  const isOpen = documentType !== null;
  const shipment = vehicle.shipment;
  const breakdown = calculateLandedCost(vehicle, {
    shippingMethod: shipment?.shippingMethod ?? "RoRo",
  });

  return (
    <AnimatePresence>
      {isOpen && documentType && (
        <>
          <motion.div
            key="doc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 print:hidden"
          />

          <motion.div
            key="doc-modal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="print-dossier fixed inset-2 z-50 mx-auto flex max-w-2xl flex-col border-2 border-zinc-950 bg-white text-zinc-950 sm:inset-4 md:inset-y-10 print:relative print:inset-0 print:max-w-none"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-zinc-200 px-4 py-4 print:hidden sm:px-8 sm:py-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400">
                  Official Document
                </p>
                <h2 className="mt-1 text-base font-medium tracking-tight sm:text-xl">
                  {DOCUMENT_TITLES[documentType]}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8">
              <div className="flex flex-col gap-3 border-b-2 border-zinc-950 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    Modfem Autos Document Registry
                  </p>
                  <h3 className="text-lg font-medium tracking-tight sm:text-2xl">
                    {DOCUMENT_TITLES[documentType]}
                  </h3>
                </div>
                <div className="flex w-fit shrink-0 items-center gap-2 border border-emerald-600 px-3 py-1.5 text-emerald-700">
                  <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="text-[10px] font-medium uppercase tracking-widest">
                    Digitally Verified
                  </span>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[280px] border-collapse text-sm">
                  <tbody>
                    <DocRow label="Vehicle" value={vehicle.name} />
                    <DocRow label="VIN" value={vehicle.vin} mono />
                    <DocRow
                      label="Booking Number"
                      value={shipment?.bookingNumber ?? "Not yet booked"}
                      mono
                    />
                    <DocRow
                      label="Vessel Name"
                      value={shipment?.vesselName ?? "To Be Assigned"}
                    />
                    <DocRow
                      label="Origin Port"
                      value={shipment?.departurePort ?? vehicle.location}
                    />
                    <DocRow
                      label="Destination Port"
                      value={shipment?.arrivalPort ?? "—"}
                    />
                    <DocRow
                      label="Shipping Mode"
                      value={shipment?.shippingMethod ?? "—"}
                    />
                  </tbody>
                </table>
              </div>

              <p className="mt-6 text-[10px] uppercase tracking-widest text-zinc-400">
                Customs Valuation Breakdown
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[280px] border-collapse text-sm">
                  <tbody>
                    <DocRow
                      label="CIF Value"
                      value={formatNGN(breakdown.cifValueNGN)}
                      mono
                    />
                    <DocRow
                      label="Customs Duty"
                      value={formatNGN(breakdown.customsDutyNGN)}
                      mono
                    />
                    <DocRow
                      label="NAC Levy"
                      value={formatNGN(breakdown.nacLevyNGN)}
                      mono
                    />
                    <DocRow
                      label="VAT, CISS & ETLS"
                      value={formatNGN(breakdown.statutoryTaxesNGN)}
                      mono
                    />
                    <DocRow
                      label="Port Clearing"
                      value={formatNGN(breakdown.portClearingNGN)}
                      mono
                    />
                    <tr className="border-t-2 border-zinc-950">
                      <td className="whitespace-nowrap py-2 text-xs font-medium uppercase tracking-wide">
                        Total Assessed Value
                      </td>
                      <td className="py-2 text-right font-mono text-sm font-medium">
                        {formatNGN(breakdown.totalNGN)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex flex-col gap-1 border-t border-zinc-200 pt-4 text-[10px] uppercase tracking-widest text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Document Ref: {documentType}-{vehicle.vin.slice(-6)}
                </span>
                <span suppressHydrationWarning>
                  Issued {new Date().toLocaleDateString("en-CA")}
                </span>
              </div>
            </div>

            <div className="shrink-0 border-t border-zinc-200 px-4 py-4 print:hidden sm:px-8 sm:py-5">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 border border-zinc-950 px-4 text-[10px] font-medium uppercase tracking-widest transition-colors hover:bg-zinc-950 hover:text-white"
              >
                Print / Download Official Copy
                <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
