import { PrismaClient } from "@prisma/client";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import {
  ArrivalPort,
  DestinationPort,
  MilestoneCode,
  Role,
  Shipment,
  ShippingMethod,
  SourcingRequest,
  SourcingRequestStatus,
  TrackingLog,
  VehicleStatus,
} from "./types";
import { cloneSeed, StoreState, VehicleRecord } from "./seed-data";
import { applyStoreAction, StoreAction } from "./store-shared";

/**
 * Dual-driver persistence: if DATABASE_URL is configured, every read/write
 * goes through Prisma against Postgres. If it isn't, we fall back to the
 * zero-config, file-locked data/db.json engine — so `npm run dev`, CI, and
 * Playwright all keep working with no external dependency.
 *
 * Both drivers are deliberately "read the full relational state as a
 * StoreState, run it through the SAME pure applyStoreAction reducer used by
 * the client and the file store, then persist the full result back" — this
 * keeps lib/store-shared.ts as the single source of truth for business
 * logic (never re-implemented per-driver) at the cost of rewriting the
 * whole dataset on every mutation. That's the right tradeoff at this app's
 * scale (a handful of vehicles/shipments/requests); a high-volume
 * production system would replace writeStateToDatabase with targeted
 * per-entity upserts instead.
 */

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

// ---------------------------------------------------------------------------
// Prisma driver
// ---------------------------------------------------------------------------

let prismaClient: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

function destinationPortToPrisma(port: DestinationPort): "TinCanIsland" | "Apapa" {
  return port === "Tin Can Island" ? "TinCanIsland" : "Apapa";
}

function destinationPortFromPrisma(port: "TinCanIsland" | "Apapa"): DestinationPort {
  return port === "TinCanIsland" ? "Tin Can Island" : "Apapa";
}

async function readStateFromDatabase(): Promise<StoreState> {
  const prisma = getPrisma();
  const [users, vehicles, shipments, trackingLogs, sourcingRequests] = await Promise.all([
    prisma.user.findMany(),
    prisma.vehicle.findMany(),
    prisma.shipment.findMany(),
    prisma.trackingLog.findMany(),
    prisma.sourcingRequest.findMany(),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as Role,
    })),
    vehicles: vehicles.map(
      (v): VehicleRecord => ({
        id: v.id,
        vin: v.vin,
        name: v.name,
        year: v.year,
        make: v.make,
        model: v.model,
        basePriceCAD: v.basePriceCAD,
        location: v.location,
        status: v.status as VehicleStatus,
        specs: {
          engine: v.engine,
          mileageKm: v.mileageKm,
          drivetrain: v.drivetrain,
          exteriorColor: v.exteriorColor,
        },
        ownerId: v.ownerId ?? undefined,
        frontImageUrl: v.frontImageUrl,
        rearImageUrl: v.rearImageUrl,
        thumbnailUrl: v.thumbnailUrl,
      })
    ),
    shipments: shipments.map(
      (s): Shipment => ({
        id: s.id,
        vehicleId: s.vehicleId,
        shippingMethod: s.shippingMethod as ShippingMethod,
        vesselName: s.vesselName,
        bookingNumber: s.bookingNumber,
        departurePort: s.departurePort,
        arrivalPort: s.arrivalPort as ArrivalPort,
        departureDate: s.departureDate,
        etaLagos: s.etaLagos,
        customsDutyNGN: s.customsDutyNGN,
        clearingFeeNGN: s.clearingFeeNGN,
        billOfLadingVerified: s.billOfLadingVerified,
      })
    ),
    trackingLogs: trackingLogs.map(
      (t): TrackingLog => ({
        id: t.id,
        vehicleId: t.vehicleId,
        milestone: t.milestone as MilestoneCode,
        title: t.title,
        location: t.location,
        description: t.description,
        timestamp: t.timestamp.toISOString(),
        completed: t.completed,
      })
    ),
    sourcingRequests: sourcingRequests.map(
      (r): SourcingRequest => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        status: r.status as SourcingRequestStatus,
        buyer: { name: r.buyerName, email: r.buyerEmail, phone: r.buyerPhone },
        vehicleSpec: {
          year: r.specYear,
          make: r.specMake,
          model: r.specModel,
          trimOrColor: r.specTrimOrColor,
          maxMileageKm: r.specMaxMileageKm,
        },
        financials: {
          totalBudgetNGN: r.totalBudgetNGN,
          maxBidCAD: r.maxBidCAD,
          shippingMethod: r.shippingMethod as ShippingMethod,
          destinationPort: destinationPortFromPrisma(r.destinationPort),
          exchangeRateUsed: r.exchangeRateUsed,
        },
        dealerNotes: r.dealerNotes ?? undefined,
      })
    ),
  };
}

/** Exported directly for prisma/seed.ts, which wants to write the canonical
 * SEED_STATE straight to Postgres without going through the read-modify-
 * write action pipeline (there's nothing to "modify" — a seed replaces
 * everything). */
export async function writeStateToDatabase(state: StoreState): Promise<void> {
  const prisma = getPrisma();
  await prisma.$transaction([
    // Children first (FK-safe delete order)...
    prisma.trackingLog.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.sourcingRequest.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.user.deleteMany(),

    // ...then parents first (FK-safe create order).
    prisma.user.createMany({
      data: state.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
      })),
    }),
    prisma.vehicle.createMany({
      data: state.vehicles.map((v) => ({
        id: v.id,
        vin: v.vin,
        name: v.name,
        year: v.year,
        make: v.make,
        model: v.model,
        basePriceCAD: v.basePriceCAD,
        location: v.location,
        status: v.status,
        engine: v.specs.engine,
        mileageKm: v.specs.mileageKm,
        drivetrain: v.specs.drivetrain,
        exteriorColor: v.specs.exteriorColor,
        frontImageUrl: v.frontImageUrl,
        rearImageUrl: v.rearImageUrl,
        thumbnailUrl: v.thumbnailUrl,
        ownerId: v.ownerId ?? null,
      })),
    }),
    prisma.shipment.createMany({
      data: state.shipments.map((s) => ({
        id: s.id,
        vehicleId: s.vehicleId,
        shippingMethod: s.shippingMethod,
        vesselName: s.vesselName,
        bookingNumber: s.bookingNumber,
        departurePort: s.departurePort,
        arrivalPort: s.arrivalPort,
        departureDate: s.departureDate,
        etaLagos: s.etaLagos,
        customsDutyNGN: s.customsDutyNGN,
        clearingFeeNGN: s.clearingFeeNGN,
        billOfLadingVerified: s.billOfLadingVerified,
      })),
    }),
    prisma.trackingLog.createMany({
      data: state.trackingLogs.map((t) => ({
        id: t.id,
        vehicleId: t.vehicleId,
        milestone: t.milestone,
        title: t.title,
        location: t.location,
        description: t.description,
        timestamp: new Date(t.timestamp),
        completed: t.completed,
      })),
    }),
    prisma.sourcingRequest.createMany({
      data: state.sourcingRequests.map((r) => ({
        id: r.id,
        createdAt: new Date(r.createdAt),
        status: r.status,
        buyerName: r.buyer.name,
        buyerEmail: r.buyer.email,
        buyerPhone: r.buyer.phone,
        specYear: r.vehicleSpec.year,
        specMake: r.vehicleSpec.make,
        specModel: r.vehicleSpec.model,
        specTrimOrColor: r.vehicleSpec.trimOrColor,
        specMaxMileageKm: r.vehicleSpec.maxMileageKm,
        totalBudgetNGN: r.financials.totalBudgetNGN,
        maxBidCAD: r.financials.maxBidCAD,
        shippingMethod: r.financials.shippingMethod,
        destinationPort: destinationPortToPrisma(r.financials.destinationPort),
        exchangeRateUsed: r.financials.exchangeRateUsed,
        dealerNotes: r.dealerNotes ?? null,
      })),
    }),
  ]);
}

// ---------------------------------------------------------------------------
// JSON file driver (zero-config fallback)
//
// On Vercel (and any other read-only-root serverless host), the project
// directory is mounted read-only (EROFS) — writes to ./data/db.json fail
// every time. We prefer os.tmpdir() (the one writable path serverless
// guarantees) whenever VERCEL=1, and we also fail over to it mid-flight if
// a write anywhere else throws EROFS/EACCES/EPERM, so this degrades
// gracefully even when that env var isn't set but the filesystem still
// turns out to be read-only. If even tmpdir access fails, every read/write
// falls back to an in-memory globalThis cache so the app keeps serving
// (ephemeral per cold start, but never a 500) instead of throwing.
// ---------------------------------------------------------------------------

const PROJECT_DATA_DIR = path.join(process.cwd(), "data");
const PROJECT_DB_PATH = path.join(PROJECT_DATA_DIR, "db.json");
const TMP_DB_PATH = path.join(os.tmpdir(), "modfem-autos-db.json");

function isRunningOnVercel(): boolean {
  return process.env.VERCEL === "1";
}

function isFsAccessError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException)?.code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

// Mutable: starts at the writable path for the current host, and permanently
// fails over to the tmpdir path the first time a write proves it unwritable.
let activeDbPath = isRunningOnVercel() ? TMP_DB_PATH : PROJECT_DB_PATH;

declare global {
  var __modfemStore: StoreState | undefined;
}

async function writeStateToJsonFileAt(
  dbPath: string,
  state: StoreState
): Promise<void> {
  // dbPath is resolved at runtime (project dir vs. os.tmpdir(), decided by
  // live fs probing above) — these calls can't be statically scoped to a
  // literal subfolder, which would otherwise make Turbopack trace and bundle
  // the entire project as server output. turbopackIgnore opts out of that
  // tracing for what is, at runtime, a plain Node fs call.
  await mkdir(/* turbopackIgnore: true */ path.dirname(dbPath), { recursive: true });
  // Atomic write: write to a temp file, then rename over the real one, so a
  // crash or concurrent read mid-write can never observe a half-written file.
  const tmpPath = `${dbPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(/* turbopackIgnore: true */ tmpPath, JSON.stringify(state, null, 2), "utf-8");
  await rename(/* turbopackIgnore: true */ tmpPath, dbPath);
}

async function writeStateToJsonFile(state: StoreState): Promise<void> {
  // Keep the in-memory cache fresh first — even total filesystem failure
  // still serves consistent state for the lifetime of this warm instance.
  globalThis.__modfemStore = state;

  try {
    await writeStateToJsonFileAt(activeDbPath, state);
    return;
  } catch (err) {
    if (activeDbPath === TMP_DB_PATH || !isFsAccessError(err)) {
      // Already on the writable fallback, or the failure wasn't a
      // read-only/permission error worth failing over for — nothing more to
      // try on disk; the in-memory cache above is the last resort.
      return;
    }
  }

  // The project path proved unwritable (EROFS/EACCES/EPERM) — fail over to
  // tmpdir for this and every future call in this process.
  activeDbPath = TMP_DB_PATH;
  try {
    await writeStateToJsonFileAt(TMP_DB_PATH, state);
  } catch {
    // tmpdir write failed too — in-memory cache above still has the state.
  }
}

async function readStateFromJsonFile(): Promise<StoreState> {
  if (globalThis.__modfemStore) return globalThis.__modfemStore;

  try {
    const raw = await readFile(/* turbopackIgnore: true */ activeDbPath, "utf-8");
    const state = JSON.parse(raw) as StoreState;
    globalThis.__modfemStore = state;
    return state;
  } catch (err) {
    if (isFsAccessError(err) && activeDbPath !== TMP_DB_PATH) {
      activeDbPath = TMP_DB_PATH;
      return readStateFromJsonFile();
    }
    // No file yet at this path (ENOENT, the normal first-run case) or it's
    // unreadable for some other reason — seed fresh state and persist it
    // (writeStateToJsonFile never throws, so this is always safe).
    const seeded = cloneSeed();
    await writeStateToJsonFile(seeded);
    return seeded;
  }
}

// ---------------------------------------------------------------------------
// Public API — driver-agnostic, serialized against concurrent requests
// within this server process.
// ---------------------------------------------------------------------------

let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn, fn);
  queue = result.catch(() => undefined);
  return result;
}

async function readState(): Promise<StoreState> {
  return isDatabaseConfigured() ? readStateFromDatabase() : readStateFromJsonFile();
}

async function writeState(state: StoreState): Promise<void> {
  return isDatabaseConfigured()
    ? writeStateToDatabase(state)
    : writeStateToJsonFile(state);
}

export async function getStoreState(): Promise<StoreState> {
  return withLock(readState);
}

export async function applyStoreActionPersisted(
  action: StoreAction
): Promise<StoreState> {
  return withLock(async () => {
    const current = await readState();
    const next = applyStoreAction(current, action);
    await writeState(next);
    return next;
  });
}
