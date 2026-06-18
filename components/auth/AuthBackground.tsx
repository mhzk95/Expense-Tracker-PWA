"use client";

export function AuthBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
      {/* Deep gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950" />

      {/* Aurora / Flowing organic meshes */}
      <div
        className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-transparent filter blur-[100px] animate-aurora-1 opacity-70"
      />

      <div
        className="absolute top-[20%] -right-[20%] w-[90vw] h-[90vw] rounded-full bg-gradient-to-bl from-rose-500/25 via-violet-500/15 to-transparent filter blur-[120px] animate-aurora-2 opacity-60"
      />

      <div
        className="absolute -bottom-[20%] left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-transparent filter blur-[110px] animate-aurora-3 opacity-60"
      />

      {/* Subtly moving light bloom focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(2,6,23,0.7))] z-[1]" />
    </div>
  );
}

