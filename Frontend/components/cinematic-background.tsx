"use client";

export function CinematicBackground() {
  
  const posterColors = [
    "from-red-900/30 to-red-950/20",
    "from-blue-900/30 to-blue-950/20",
    "from-amber-900/30 to-amber-950/20",
    "from-emerald-900/30 to-emerald-950/20",
    "from-indigo-900/30 to-indigo-950/20",
    "from-rose-900/30 to-rose-950/20",
  ];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
      
      {}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-primary/8 to-transparent blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary/5 via-transparent to-primary/5 blur-3xl" />
      
      {}
      <div className="absolute inset-0 grid grid-cols-6 gap-2 opacity-[0.15] blur-lg">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-[2/3] rounded-lg bg-gradient-to-br ${posterColors[i % posterColors.length]}`}
          />
        ))}
      </div>
      
      {}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />
      
      {}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
    </div>
  );
}
