import { NextResponse } from "next/server";

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

interface NhtsaResult {
  ModelYear?: string;
  Make?: string;
  Model?: string;
  Trim?: string;
  Series?: string;
  DisplacementL?: string;
  EngineCylinders?: string;
  FuelTypePrimary?: string;
  DriveType?: string;
  ErrorCode?: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vin: string }> }
) {
  const { vin } = await params;
  const normalized = (vin ?? "").trim().toUpperCase();

  if (!VIN_PATTERN.test(normalized)) {
    return NextResponse.json(
      {
        error:
          "VIN must be exactly 17 characters (letters and digits only — no I, O, or Q).",
      },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${normalized}?format=json`,
      { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(8000) }
    );

    if (!upstream.ok) {
      throw new Error(`NHTSA upstream responded ${upstream.status}`);
    }

    const payload = await upstream.json();
    const result: NhtsaResult | undefined = payload?.Results?.[0];

    if (!result || (!result.Make && !result.ModelYear)) {
      return NextResponse.json(
        { error: "NHTSA could not decode this VIN." },
        { status: 404 }
      );
    }

    const year = Number(result.ModelYear) || undefined;
    const make = result.Make?.trim() || undefined;
    const model = [result.Model, result.Trim || result.Series]
      .filter((part) => part && part.trim())
      .join(" ")
      .trim() || undefined;
    const engine = [
      result.DisplacementL ? `${result.DisplacementL}L` : null,
      result.EngineCylinders ? `${result.EngineCylinders}-Cyl` : null,
      result.FuelTypePrimary || null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
    const drivetrain = result.DriveType?.trim() || undefined;

    return NextResponse.json({
      vin: normalized,
      year,
      make,
      model,
      engine,
      drivetrain,
      source: "nhtsa",
    });
  } catch {
    return NextResponse.json(
      { error: "VIN decode failed — try again or enter details manually." },
      { status: 502 }
    );
  }
}
