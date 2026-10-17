import {
  ArrivalPort,
  CustomsAgeTier,
  DestinationPort,
  LandedCostBreakdown,
  ShippingMethod,
  Vehicle,
} from "./types";
import { DEFAULT_FX_RATE_NGN_PER_CAD } from "./config";

export const EXCHANGE_RATE_NGN_PER_CAD = DEFAULT_FX_RATE_NGN_PER_CAD;

const OCEAN_FREIGHT_CAD: Record<ShippingMethod, number> = {
  RoRo: 1_850,
  Container: 3_400,
};

const MARINE_INSURANCE_RATE = 0.015;

const VAT_RATE = 0.075;
const CISS_RATE = 0.01;
const ETLS_RATE = 0.005;

const PORT_CLEARING_FEES_NGN: Record<DestinationPort, number> = {
  "Tin Can Island": 1_450_000,
  Apapa: 1_620_000,
};

interface AgeTier {
  label: CustomsAgeTier;
  depreciationDiscountPct: number;
  dutyRatePct: number;
  nacLevyRatePct: number;
}

function getAgeTier(year: number): AgeTier {
  if (year >= 2023) {
    return {
      label: "2023-2026",
      depreciationDiscountPct: 0,
      dutyRatePct: 20,
      nacLevyRatePct: 15,
    };
  }
  if (year >= 2020) {
    return {
      label: "2020-2022",
      depreciationDiscountPct: 10,
      dutyRatePct: 20,
      nacLevyRatePct: 10,
    };
  }
  return {
    label: "PRE-2020",
    depreciationDiscountPct: 25,
    dutyRatePct: 20,
    nacLevyRatePct: 5,
  };
}

export interface LandedCostOptions {
  shippingMethod?: ShippingMethod;
  destinationPort?: DestinationPort;
  exchangeRateCadToNgn?: number;
}

export function calculateLandedCost(
  vehicle: Pick<Vehicle, "id" | "year" | "basePriceCAD">,
  options: LandedCostOptions = {}
): LandedCostBreakdown {
  const shippingMethod = options.shippingMethod ?? "RoRo";
  const destinationPort = options.destinationPort ?? "Tin Can Island";
  const exchangeRateCadToNgn =
    options.exchangeRateCadToNgn ?? EXCHANGE_RATE_NGN_PER_CAD;

  const basePriceCAD = vehicle.basePriceCAD;
  const freightCAD = OCEAN_FREIGHT_CAD[shippingMethod];
  const insuranceCAD = (basePriceCAD + freightCAD) * MARINE_INSURANCE_RATE;
  const cifValueCAD = basePriceCAD + freightCAD + insuranceCAD;
  const cifValueNGN = cifValueCAD * exchangeRateCadToNgn;

  const ageTier = getAgeTier(vehicle.year);
  const taxableCustomsBaseNGN =
    cifValueNGN * (1 - ageTier.depreciationDiscountPct / 100);
  const customsDutyNGN = taxableCustomsBaseNGN * (ageTier.dutyRatePct / 100);
  const nacLevyNGN = taxableCustomsBaseNGN * (ageTier.nacLevyRatePct / 100);

  const dutyPaidValueNGN = cifValueNGN + customsDutyNGN + nacLevyNGN;
  const vatNGN = dutyPaidValueNGN * VAT_RATE;
  const cissNGN = dutyPaidValueNGN * CISS_RATE;
  const etlsNGN = dutyPaidValueNGN * ETLS_RATE;
  const statutoryTaxesNGN = vatNGN + cissNGN + etlsNGN;

  const portClearingNGN = PORT_CLEARING_FEES_NGN[destinationPort];

  const totalNGN = dutyPaidValueNGN + statutoryTaxesNGN + portClearingNGN;
  const totalCAD = totalNGN / exchangeRateCadToNgn;

  const baseCostNGN = basePriceCAD * exchangeRateCadToNgn;
  const shippingAndInsuranceNGN =
    (freightCAD + insuranceCAD) * exchangeRateCadToNgn;
  const customsAndClearingNGN =
    customsDutyNGN + nacLevyNGN + statutoryTaxesNGN + portClearingNGN;

  return {
    vehicleId: vehicle.id,
    shippingMethod,
    destinationPort,
    exchangeRateCadToNgn,

    basePriceCAD,
    basePriceNGN: baseCostNGN,

    freightCAD,
    freightNGN: freightCAD * exchangeRateCadToNgn,

    insuranceCAD,
    insuranceNGN: insuranceCAD * exchangeRateCadToNgn,

    cifValueCAD,
    cifValueNGN,

    ageTier: ageTier.label,
    depreciationDiscountPct: ageTier.depreciationDiscountPct,
    dutyRatePct: ageTier.dutyRatePct,
    nacLevyRatePct: ageTier.nacLevyRatePct,
    taxableCustomsBaseNGN,

    customsDutyNGN,
    nacLevyNGN,

    vatNGN,
    cissNGN,
    etlsNGN,
    statutoryTaxesNGN,

    portClearingNGN,

    totalNGN,
    totalCAD,

    baseCostPct: (baseCostNGN / totalNGN) * 100,
    shippingAndInsurancePct: (shippingAndInsuranceNGN / totalNGN) * 100,
    customsAndClearingPct: (customsAndClearingNGN / totalNGN) * 100,
  };
}

export function formatNGN(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

export function formatNGNCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  return formatNGN(amount);
}

export function formatCAD(amount: number): string {
  return `CAD $${Math.round(amount).toLocaleString("en-CA")}`;
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function arrivalPortToDestinationPort(
  arrivalPort: ArrivalPort
): DestinationPort {
  return arrivalPort.startsWith("Apapa") ? "Apapa" : "Tin Can Island";
}

// Modeled as Modfem Autos' Canadian sourcing & auction-inspection margin —
// kept off the top of the buyer's theoretical max bid as a safety buffer so
// the recommended auction ceiling isn't a knife-edge number.
const SOURCING_FEE_RATE = 0.03;

export interface MaxCanadianBidParams {
  totalBudgetNGN: number;
  year: number;
  shippingMethod?: ShippingMethod;
  destinationPort?: DestinationPort;
  exchangeRateCadToNgn?: number;
}

export interface MaxCanadianBidResult {
  maxBasePriceCAD: number;
  breakdown: LandedCostBreakdown;
  sourcingFeeCAD: number;
  recommendedAuctionCeilingCAD: number;
}

/**
 * Reverses calculateLandedCost(): for a fixed year/shippingMethod/
 * destinationPort/exchangeRateCadToNgn, totalNGN is an exactly linear
 * (affine) function of basePriceCAD — every step from freight through VAT
 * is either a fixed constant or a multiplication by a constant factor, so
 * totalNGN = m * basePriceCAD + b for some slope m and intercept b.
 *
 * Rather than re-deriving and hand-duplicating m and b from the formula
 * (and risking drift if calculateLandedCost ever changes), we measure them
 * directly by probing calculateLandedCost at two points — this keeps
 * calculateLandedCost as the single source of truth for the pricing model
 * while still solving the inversion exactly (the probe is algebra, not an
 * approximation: two points exactly determine a line).
 */
export function calculateMaxCanadianBid(
  params: MaxCanadianBidParams
): MaxCanadianBidResult {
  const options: LandedCostOptions = {
    shippingMethod: params.shippingMethod,
    destinationPort: params.destinationPort,
    exchangeRateCadToNgn: params.exchangeRateCadToNgn,
  };

  const PROBE_CAD = 1_000_000;
  const totalAtZero = calculateLandedCost(
    { id: "probe", year: params.year, basePriceCAD: 0 },
    options
  ).totalNGN;
  const totalAtProbe = calculateLandedCost(
    { id: "probe", year: params.year, basePriceCAD: PROBE_CAD },
    options
  ).totalNGN;

  const slope = (totalAtProbe - totalAtZero) / PROBE_CAD; // m: NGN per CAD of base price
  const intercept = totalAtZero; // b: fixed NGN cost at basePriceCAD = 0 (freight+insurance+duty+tax+port, all at base=0)

  const rawMaxBasePriceCAD = (params.totalBudgetNGN - intercept) / slope;
  const maxBasePriceCAD = Math.max(0, rawMaxBasePriceCAD);

  const breakdown = calculateLandedCost(
    { id: "max-bid", year: params.year, basePriceCAD: maxBasePriceCAD },
    options
  );

  const sourcingFeeCAD = maxBasePriceCAD * SOURCING_FEE_RATE;
  const recommendedAuctionCeilingCAD = Math.max(
    0,
    maxBasePriceCAD - sourcingFeeCAD
  );

  return {
    maxBasePriceCAD,
    breakdown,
    sourcingFeeCAD,
    recommendedAuctionCeilingCAD,
  };
}
