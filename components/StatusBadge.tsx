import { VehicleStatus } from "@/lib/types";

const STATUS_DOT_COLOR: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-emerald-400",
  RESERVED: "bg-amber-400",
  IN_TRANSIT: "bg-sky-400",
  CLEARING: "bg-orange-400",
  DELIVERED: "bg-zinc-400",
};

export function StatusBadge({ status }: { status: VehicleStatus }) {
  const dotColor = STATUS_DOT_COLOR[status];
  return (
    <div className="inline-flex w-fit items-center gap-2 border border-white/20 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-300">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotColor} opacity-75`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`}
        />
      </span>
      {status.replace("_", " ")}
    </div>
  );
}
