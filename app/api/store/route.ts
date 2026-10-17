import { NextResponse } from "next/server";
import { applyStoreActionPersisted, getStoreState } from "@/lib/db";
import { computeSnapshot, StoreAction } from "@/lib/store-shared";

const VALID_ACTIONS = new Set<StoreAction["action"]>([
  "updateVehicleStatus",
  "addVehicle",
  "addTrackingLog",
  "updateShipment",
  "createShipment",
  "reserveVehicle",
  "createSourcingRequest",
  "updateSourcingRequestStatus",
  "resetStore",
  "replaceState",
]);

export async function GET() {
  const state = await getStoreState();
  return NextResponse.json(computeSnapshot(state));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("action" in body) ||
    typeof (body as { action: unknown }).action !== "string" ||
    !VALID_ACTIONS.has((body as { action: StoreAction["action"] }).action)
  ) {
    return NextResponse.json({ error: "Unknown or missing action." }, { status: 400 });
  }

  const action = body as StoreAction;

  if (action.action === "replaceState") {
    const s = action.state;
    const hasValidShape =
      s &&
      typeof s === "object" &&
      Array.isArray(s.vehicles) &&
      Array.isArray(s.users) &&
      Array.isArray(s.shipments) &&
      Array.isArray(s.trackingLogs) &&
      Array.isArray(s.sourcingRequests);
    if (!hasValidShape) {
      return NextResponse.json({ error: "Invalid state payload." }, { status: 400 });
    }
  }

  const nextState = await applyStoreActionPersisted(action);
  return NextResponse.json(computeSnapshot(nextState));
}
