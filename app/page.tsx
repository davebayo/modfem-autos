"use client";

import { useEffect, useState } from "react";
import { ANNOUNCEMENTS } from "@/lib/vehicles";
import { useVehicles } from "@/lib/store";
import { calculateLandedCost, formatNGNCompact } from "@/lib/pricing";
import { ViewAngle } from "@/lib/types";
import { GridOverlay } from "@/components/GridOverlay";
import { VehicleStageArt } from "@/components/VehicleStageArt";
import { TopNav } from "@/components/TopNav";
import { HeroContent } from "@/components/HeroContent";
import { NextInStockCard } from "@/components/NextInStockCard";
import { BottomFooter } from "@/components/BottomFooter";
import { LandedCostDrawer } from "@/components/LandedCostDrawer";
import { NavigationDrawer } from "@/components/NavigationDrawer";

const CYCLE_MS = 5000;

export default function Home() {
  const vehicles = useVehicles();
  const [vehicleIndex, setVehicleIndex] = useState(0);
  const [angle, setAngle] = useState<ViewAngle>("front");
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setAngle((prev) => (prev === "front" ? "rear" : "front"));
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const vehicle = vehicles[vehicleIndex];
  const nextVehicle = vehicles[(vehicleIndex + 1) % vehicles.length];
  const headlineCost = calculateLandedCost(vehicle).totalNGN;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zinc-950 lg:h-screen">
      <VehicleStageArt vehicle={vehicle} angle={angle} />
      <GridOverlay />

      <div className="relative z-20 flex h-full flex-col">
        <TopNav
          announcement={ANNOUNCEMENTS[announcementIndex]}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main className="relative flex flex-1 flex-col justify-between overflow-hidden lg:block">
          <div className="flex flex-1 items-center lg:grid lg:h-full lg:grid-cols-4">
            <HeroContent
              vehicle={vehicle}
              landedCostLabel={formatNGNCompact(headlineCost)}
              onOpenDrawer={() => setDrawerOpen(true)}
            />
          </div>

          <NextInStockCard
            vehicle={nextVehicle}
            onSelect={() =>
              setVehicleIndex((prev) => (prev + 1) % vehicles.length)
            }
          />
        </main>

        <BottomFooter onOpenMenu={() => setMenuOpen(true)} />
      </div>

      <LandedCostDrawer
        vehicle={vehicle}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <NavigationDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
