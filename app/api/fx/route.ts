import { NextResponse } from "next/server";
import { DEFAULT_FX_RATE_NGN_PER_CAD } from "@/lib/config";

export const FALLBACK_RATE_NGN_PER_CAD = DEFAULT_FX_RATE_NGN_PER_CAD;

// Small spread over the raw market rate to model a dealer's buy/sell margin.
const DEALER_SPREAD = 1.015;

const UPSTREAM_URL = "https://open.er-api.com/v6/latest/CAD";

export async function GET() {
  try {
    const upstream = await fetch(UPSTREAM_URL, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    if (!upstream.ok) {
      throw new Error(`FX upstream responded ${upstream.status}`);
    }

    const payload = await upstream.json();
    const ngnRate = payload?.rates?.NGN;

    if (typeof ngnRate !== "number" || !Number.isFinite(ngnRate)) {
      throw new Error("Malformed FX payload");
    }

    return NextResponse.json({
      rate: Math.round(ngnRate * DEALER_SPREAD),
      source: "live" as const,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      rate: FALLBACK_RATE_NGN_PER_CAD,
      source: "fallback" as const,
      updatedAt: new Date().toISOString(),
    });
  }
}
