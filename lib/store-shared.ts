import {
  ArrivalPort,
  DestinationPort,
  Shipment,
  ShippingMethod,
  SourcingRequest,
  SourcingRequestStatus,
  TrackingLog,
  User,
  Vehicle,
  VehicleSpecs,
  VehicleStatus,
} from "./types";
import { calculateLandedCost, formatNGN } from "./pricing";
import { cloneSeed, StoreState, VehicleRecord } from "./seed-data";

export interface StoreSnapshot {
  vehicles: Vehicle[];
  users: User[];
  sourcingRequests: SourcingRequest[];
}

export function joinVehicle(record: VehicleRecord, state: StoreState): Vehicle {
  return {
    ...record,
    shipment: state.shipments.find((s) => s.vehicleId === record.id),
    trackingLogs: state.trackingLogs
      .filter((log) => log.vehicleId === record.id)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  };
}

export function computeSnapshot(state: StoreState): StoreSnapshot {
  return {
    vehicles: state.vehicles.map((record) => joinVehicle(record, state)),
    users: state.users,
    sourcingRequests: state.sourcingRequests,
  };
}

/** Converts a joined snapshot (as returned by GET /api/store) back into
 * the normalized shape the stores operate on internally. */
export function normalizeSnapshot(snapshot: StoreSnapshot): StoreState {
  const shipments: Shipment[] = [];
  const trackingLogs: TrackingLog[] = [];
  const vehicles: VehicleRecord[] = snapshot.vehicles.map((vehicle) => {
    const { shipment, trackingLogs: logs, ...record } = vehicle;
    if (shipment) shipments.push(shipment);
    trackingLogs.push(...logs);
    return record;
  });
  return {
    users: snapshot.users,
    vehicles,
    shipments,
    trackingLogs,
    sourcingRequests: snapshot.sourcingRequests,
  };
}

export function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MFA-${year}-${suffix}`;
}

export function generateSourcingReference(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MFM-${year}-${suffix}`;
}

export interface VehicleFilter {
  status?: VehicleStatus;
  make?: string;
  location?: string;
}

export interface NewVehicleInput {
  vin: string;
  year: number;
  make: string;
  model: string;
  basePriceCAD: number;
  location: string;
  status: VehicleStatus;
  specs: VehicleSpecs;
  frontImageUrl: string;
  rearImageUrl: string;
  thumbnailUrl: string;
}

export interface ReserveVehicleBuyer {
  name: string;
  email: string;
  phone: string;
}

export interface ReserveVehicleOptions {
  shippingMethod: ShippingMethod;
  destinationPort: DestinationPort;
  quotedLandedNGN: number;
}

export interface ReservationResult {
  vehicle: Vehicle;
  buyer: User;
  shipment: Shipment;
  trackingLog: TrackingLog;
  bookingReference: string;
}

// ---------------------------------------------------------------------------
// Pure state transitions. Every function here takes the current StoreState
// and returns a BRAND NEW StoreState (never mutates in place) — this is what
// both the client's useSyncExternalStore-based cache and the server's
// file-backed store rely on for correct change detection and persistence.
// ---------------------------------------------------------------------------

export function applyUpdateVehicleStatus(
  state: StoreState,
  vehicleId: string,
  status: VehicleStatus
): StoreState | undefined {
  if (!state.vehicles.some((v) => v.id === vehicleId)) return undefined;
  return {
    ...state,
    vehicles: state.vehicles.map((v) =>
      v.id === vehicleId ? { ...v, status } : v
    ),
  };
}

export function applySetVehicleOwner(
  state: StoreState,
  vehicleId: string,
  ownerId: string | undefined
): StoreState | undefined {
  if (!state.vehicles.some((v) => v.id === vehicleId)) return undefined;
  return {
    ...state,
    vehicles: state.vehicles.map((v) =>
      v.id === vehicleId ? { ...v, ownerId } : v
    ),
  };
}

export function applyAddTrackingLog(
  state: StoreState,
  vehicleId: string,
  entry: Omit<TrackingLog, "id" | "vehicleId">,
  logId?: string
): { state: StoreState; log: TrackingLog } {
  const log: TrackingLog = { id: logId ?? nextId("log"), vehicleId, ...entry };
  return {
    state: { ...state, trackingLogs: [...state.trackingLogs, log] },
    log,
  };
}

export function applyUpdateShipment(
  state: StoreState,
  vehicleId: string,
  updates: Partial<Omit<Shipment, "id" | "vehicleId">>
): { state: StoreState; shipment: Shipment } | undefined {
  const existing = state.shipments.find((s) => s.vehicleId === vehicleId);
  if (!existing) return undefined;
  const updated: Shipment = { ...existing, ...updates };
  return {
    state: {
      ...state,
      shipments: state.shipments.map((s) =>
        s.vehicleId === vehicleId ? updated : s
      ),
    },
    shipment: updated,
  };
}

export function applyCreateShipment(
  state: StoreState,
  vehicleId: string,
  shipment: Omit<Shipment, "id" | "vehicleId">,
  shipmentId?: string
): { state: StoreState; shipment: Shipment } {
  const newShipment: Shipment = {
    id: shipmentId ?? nextId("shipment"),
    vehicleId,
    ...shipment,
  };
  return {
    state: {
      ...state,
      shipments: [
        ...state.shipments.filter((s) => s.vehicleId !== vehicleId),
        newShipment,
      ],
    },
    shipment: newShipment,
  };
}

export function applyAddVehicle(
  state: StoreState,
  input: NewVehicleInput,
  recordId?: string
): { state: StoreState; record: VehicleRecord } {
  const record: VehicleRecord = {
    id: recordId ?? nextId("vehicle"),
    name: `${input.year} ${input.make} ${input.model}`,
    ...input,
  };
  return {
    state: { ...state, vehicles: [...state.vehicles, record] },
    record,
  };
}

export function applyResetStore(): StoreState {
  return cloneSeed();
}

export interface ReserveVehicleOverrides {
  bookingReference?: string;
  shipmentId?: string;
  trackingLogId?: string;
  newUserId?: string;
  timestamp?: string;
}

export function applyReserveVehicle(
  state: StoreState,
  vehicleId: string,
  buyer: ReserveVehicleBuyer,
  options: ReserveVehicleOptions,
  overrides: ReserveVehicleOverrides = {}
):
  | {
      state: StoreState;
      buyer: User;
      shipment: Shipment;
      trackingLog: TrackingLog;
      bookingReference: string;
    }
  | undefined {
  const vehicleRecord = state.vehicles.find((v) => v.id === vehicleId);
  if (!vehicleRecord || vehicleRecord.status !== "AVAILABLE") {
    return undefined;
  }

  const normalizedEmail = buyer.email.trim().toLowerCase();
  const existingUser = state.users.find(
    (u) => u.email.trim().toLowerCase() === normalizedEmail
  );
  const buyerUser: User =
    existingUser ?? {
      id: overrides.newUserId ?? nextId("user"),
      name: buyer.name,
      email: buyer.email,
      role: "CUSTOMER",
    };
  const users = existingUser ? state.users : [...state.users, buyerUser];

  const arrivalPort: ArrivalPort =
    options.destinationPort === "Apapa"
      ? "Apapa, Lagos"
      : "Tin Can Island, Lagos";
  const bookingReference = overrides.bookingReference ?? generateBookingReference();
  const breakdown = calculateLandedCost(vehicleRecord, {
    shippingMethod: options.shippingMethod,
    destinationPort: options.destinationPort,
  });

  const newShipment: Shipment = {
    id: overrides.shipmentId ?? nextId("shipment"),
    vehicleId,
    shippingMethod: options.shippingMethod,
    vesselName: "To Be Assigned",
    bookingNumber: bookingReference,
    departurePort: vehicleRecord.location,
    arrivalPort,
    departureDate: "",
    etaLagos: "",
    customsDutyNGN: breakdown.customsDutyNGN + breakdown.nacLevyNGN,
    clearingFeeNGN: breakdown.portClearingNGN,
    billOfLadingVerified: false,
  };

  const trackingLog: TrackingLog = {
    id: overrides.trackingLogId ?? nextId("log"),
    vehicleId,
    milestone: "PURCHASED_CANADA",
    title: "Reservation Locked",
    location: vehicleRecord.location,
    description: `Reservation locked & Proforma Import Dossier generated for buyer. Quoted landed cost: ${formatNGN(options.quotedLandedNGN)}.`,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    completed: true,
  };

  const nextState: StoreState = {
    ...state,
    users,
    vehicles: state.vehicles.map((v) =>
      v.id === vehicleId
        ? { ...v, status: "RESERVED" as VehicleStatus, ownerId: buyerUser.id }
        : v
    ),
    shipments: [
      ...state.shipments.filter((s) => s.vehicleId !== vehicleId),
      newShipment,
    ],
    trackingLogs: [...state.trackingLogs, trackingLog],
  };

  return {
    state: nextState,
    buyer: buyerUser,
    shipment: newShipment,
    trackingLog,
    bookingReference,
  };
}

export type NewSourcingRequestInput = Omit<
  SourcingRequest,
  "id" | "createdAt" | "status"
>;

export interface CreateSourcingRequestOverrides {
  id?: string;
  createdAt?: string;
}

export function applyCreateSourcingRequest(
  state: StoreState,
  input: NewSourcingRequestInput,
  overrides: CreateSourcingRequestOverrides = {}
): { state: StoreState; request: SourcingRequest } {
  const request: SourcingRequest = {
    id: overrides.id ?? generateSourcingReference(),
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    status: "NEW",
    ...input,
  };
  return {
    state: {
      ...state,
      sourcingRequests: [...state.sourcingRequests, request],
    },
    request,
  };
}

export function applyUpdateSourcingRequestStatus(
  state: StoreState,
  requestId: string,
  status: SourcingRequestStatus
): StoreState | undefined {
  if (!state.sourcingRequests.some((r) => r.id === requestId)) return undefined;
  return {
    ...state,
    sourcingRequests: state.sourcingRequests.map((r) =>
      r.id === requestId ? { ...r, status } : r
    ),
  };
}

// ---------------------------------------------------------------------------
// Typed action dispatch — the single vocabulary both the client's optimistic
// mutations and POST /api/store speak, so server and client can never drift
// on what a given action actually does.
// ---------------------------------------------------------------------------

export type StoreAction =
  | { action: "updateVehicleStatus"; vehicleId: string; status: VehicleStatus }
  | { action: "addVehicle"; input: NewVehicleInput; recordId?: string }
  | {
      action: "addTrackingLog";
      vehicleId: string;
      entry: Omit<TrackingLog, "id" | "vehicleId">;
      logId?: string;
    }
  | {
      action: "updateShipment";
      vehicleId: string;
      updates: Partial<Omit<Shipment, "id" | "vehicleId">>;
    }
  | {
      action: "createShipment";
      vehicleId: string;
      shipment: Omit<Shipment, "id" | "vehicleId">;
      shipmentId?: string;
    }
  | {
      action: "reserveVehicle";
      vehicleId: string;
      buyer: ReserveVehicleBuyer;
      options: ReserveVehicleOptions;
      overrides?: ReserveVehicleOverrides;
    }
  | {
      action: "createSourcingRequest";
      input: NewSourcingRequestInput;
      overrides?: CreateSourcingRequestOverrides;
    }
  | {
      action: "updateSourcingRequestStatus";
      requestId: string;
      status: SourcingRequestStatus;
    }
  | { action: "resetStore" }
  // Wholesale overwrite used only to push a client's full local state back
  // up when a cold-started, zero-DB server (e.g. a fresh Vercel lambda with
  // no DATABASE_URL) comes back with nothing but the pristine seed while the
  // browser's localStorage already has real demo mutations — see
  // syncWithServer() in lib/store.ts.
  | { action: "replaceState"; state: StoreState };

/** Applies a typed action to a StoreState, returning the resulting state
 * unconditionally (no-op actions — a bad id, an unavailable vehicle — just
 * return the state unchanged rather than throwing). Used server-side; the
 * client applies the same underlying apply* functions directly so it can
 * also recover their richer per-call return values (the new Vehicle, the
 * new TrackingLog, etc). */
export function applyStoreAction(state: StoreState, action: StoreAction): StoreState {
  switch (action.action) {
    case "updateVehicleStatus":
      return applyUpdateVehicleStatus(state, action.vehicleId, action.status) ?? state;
    case "addVehicle":
      return applyAddVehicle(state, action.input, action.recordId).state;
    case "addTrackingLog":
      return applyAddTrackingLog(
        state,
        action.vehicleId,
        action.entry,
        action.logId
      ).state;
    case "updateShipment":
      return (
        applyUpdateShipment(state, action.vehicleId, action.updates)?.state ?? state
      );
    case "createShipment":
      return applyCreateShipment(
        state,
        action.vehicleId,
        action.shipment,
        action.shipmentId
      ).state;
    case "reserveVehicle":
      return (
        applyReserveVehicle(
          state,
          action.vehicleId,
          action.buyer,
          action.options,
          action.overrides
        )?.state ?? state
      );
    case "createSourcingRequest":
      return applyCreateSourcingRequest(state, action.input, action.overrides).state;
    case "updateSourcingRequestStatus":
      return (
        applyUpdateSourcingRequestStatus(state, action.requestId, action.status) ??
        state
      );
    case "resetStore":
      return applyResetStore();
    case "replaceState":
      return action.state;
    default:
      return state;
  }
}
