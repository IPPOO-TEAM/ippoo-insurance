export function HydrateFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
      <div
        className="w-10 h-10 rounded-full border-4 border-[#FF3B57]/20 border-t-[#FF3B57] animate-spin"
        aria-label="Chargement"
      />
    </div>
  );
}
