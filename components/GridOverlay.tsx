export function GridOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 grid grid-cols-2 md:grid-cols-4">
      <div className="border-r border-white/10" />
      <div className="hidden border-r border-white/10 md:block" />
      <div className="hidden border-r border-white/10 md:block" />
      <div />
    </div>
  );
}
