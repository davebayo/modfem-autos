export type Role = "CUSTOMER" | "ADMIN";

export type ShippingMethod = "RoRo" | "Container";

export type VehicleStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "IN_TRANSIT"
  | "CLEARING"
  | "DELIVERED";

export type ViewAngle = "front" | "rear";

export type MilestoneCode =
  | "PURCHASED_CANADA"
  | "EXPORT_INSPECTION"
  | "AT_PORT_HALIFAX"
  | "ON_VESSEL_ATLANTIC"
  | "ARRIVED_LAGOS_PORT"
  | "CUSTOMS_CLEARANCE"
  | "READY_FOR_DELIVERY";

export type ArrivalPort = "Tin Can Island, Lagos" | "Apapa, Lagos";

export type DestinationPort = "Tin Can Island" | "Apapa";

export type CustomsAgeTier = "2023-2026" | "2020-2022" | "PRE-2020";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface VehicleSpecs {
  engine: string;
  mileageKm: number;
  drivetrain: string;
  exteriorColor: string;
}

export interface TrackingLog {
  id: string;
  vehicleId: string;
  milestone: MilestoneCode;
  title: string;
  location: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface Shipment {
  id: string;
  vehicleId: string;
  shippingMethod: ShippingMethod;
  vesselName: string;
  bookingNumber: string;
  departurePort: string;
  arrivalPort: ArrivalPort;
  departureDate: string;
  etaLagos: string;
  customsDutyNGN: number;
  clearingFeeNGN: number;
  billOfLadingVerified: boolean;
}

export interface Vehicle {
  id: string;
  vin: string;
  name: string;
  year: number;
  make: string;
  model: string;
  basePriceCAD: number;
  location: string;
  status: VehicleStatus;
  specs: VehicleSpecs;
  ownerId?: string;
  shipment?: Shipment;
  trackingLogs: TrackingLog[];
  frontImageUrl: string;
  rearImageUrl: string;
  thumbnailUrl: string;
}

export type SourcingRequestStatus =
  | "NEW"
  | "SOURCING_AT_AUCTION"
  | "MATCH_FOUND"
  | "CONVERTED";

export interface SourcingRequestBuyer {
  name: string;
  email: string;
  phone: string;
}

export interface SourcingRequestVehicleSpec {
  year: number;
  make: string;
  model: string;
  trimOrColor: string;
  maxMileageKm: number;
}

export interface SourcingRequestFinancials {
  totalBudgetNGN: number;
  maxBidCAD: number;
  shippingMethod: ShippingMethod;
  destinationPort: DestinationPort;
  exchangeRateUsed: number;
}

export interface SourcingRequest {
  id: string;
  createdAt: string;
  status: SourcingRequestStatus;
  buyer: SourcingRequestBuyer;
  vehicleSpec: SourcingRequestVehicleSpec;
  financials: SourcingRequestFinancials;
  dealerNotes?: string;
}

export interface LandedCostBreakdown {
  vehicleId: string;
  shippingMethod: ShippingMethod;
  destinationPort: DestinationPort;
  exchangeRateCadToNgn: number;

  basePriceCAD: number;
  basePriceNGN: number;

  freightCAD: number;
  freightNGN: number;

  insuranceCAD: number;
  insuranceNGN: number;

  cifValueCAD: number;
  cifValueNGN: number;

  ageTier: CustomsAgeTier;
  depreciationDiscountPct: number;
  dutyRatePct: number;
  nacLevyRatePct: number;
  taxableCustomsBaseNGN: number;

  customsDutyNGN: number;
  nacLevyNGN: number;

  vatNGN: number;
  cissNGN: number;
  etlsNGN: number;
  statutoryTaxesNGN: number;

  portClearingNGN: number;

  totalNGN: number;
  totalCAD: number;

  baseCostPct: number;
  shippingAndInsurancePct: number;
  customsAndClearingPct: number;
}
