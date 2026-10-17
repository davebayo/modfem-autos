"use client";

import { useEffect, useState } from "react";
import { DEFAULT_FX_RATE_NGN_PER_CAD } from "./config";

export const FALLBACK_RATE_NGN_PER_CAD = DEFAULT_FX_RATE_NGN_PER_CAD;

export type FxSource = "live" | "fallback" | "manual";

interface FetchedFxState {
  rate: number;
  source: "live" | "fallback";
  updatedAt: string;
}

export interface ExchangeRate {
  /** The effective rate to use for pricing — the manual override when set, otherwise the fetched rate. */
  rate: number;
  /** The rate last fetched from /api/fx, ignoring any manual override. */
  baseRate: number;
  source: FxSource;
  updatedAt: string;
  isOverridden: boolean;
  setOverride: (rate: number) => void;
  resetOverride: () => void;
}

/**
 * Defaults to the static fallback rate on SSR and the first client render
 * (no hydration mismatch possible — nothing here reads window/network
 * before mount), then fetches /api/fx once mounted. A manual override lets
 * the UI stress-test a custom parallel-market rate without touching the
 * live fetched value underneath.
 */
export function useExchangeRate(): ExchangeRate {
  const [fetched, setFetched] = useState<FetchedFxState>({
    rate: FALLBACK_RATE_NGN_PER_CAD,
    source: "fallback",
    updatedAt: "",
  });
  const [override, setOverrideState] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/fx")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data?.rate === "number" && Number.isFinite(data.rate)) {
          setFetched({
            rate: data.rate,
            source: data.source === "live" ? "live" : "fallback",
            updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : "",
          });
        }
      })
      .catch(() => {
        // Keep the fallback rate already in state.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    rate: override ?? fetched.rate,
    baseRate: fetched.rate,
    source: override !== null ? "manual" : fetched.source,
    updatedAt: fetched.updatedAt,
    isOverridden: override !== null,
    setOverride: (rate: number) => setOverrideState(Number.isFinite(rate) ? rate : null),
    resetOverride: () => setOverrideState(null),
  };
}
