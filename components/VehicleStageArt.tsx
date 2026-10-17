"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Vehicle, ViewAngle } from "@/lib/types";

interface VehicleStageArtProps {
  vehicle: Vehicle;
  angle: ViewAngle;
}

export function VehicleStageArt({ vehicle, angle }: VehicleStageArtProps) {
  const imageUrl = angle === "front" ? vehicle.frontImageUrl : vehicle.rearImageUrl;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950">
      <AnimatePresence>
        <motion.div
          key={`${vehicle.id}-${angle}`}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.05 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{
            opacity: { duration: 1, ease: "easeInOut" },
            scale: { duration: 5, ease: "easeOut" },
          }}
          className="absolute inset-0 h-screen w-screen"
        >
          <Image
            src={imageUrl}
            alt={`${vehicle.name} — ${angle === "front" ? "front three-quarter" : "rear"} view`}
            fill
            priority
            sizes="100vw"
            className="h-screen w-screen object-cover object-center brightness-90 contrast-105"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-zinc-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/50" />
    </div>
  );
}
