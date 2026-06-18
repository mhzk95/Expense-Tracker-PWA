"use client";

export function AuthBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
      {/* Deep gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950" />

      {/* Aurora / Flowing organic meshes */}
      <div
        className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-transparent mix-blend-screen filter blur-[140px] animate-aurora-1"
      />

      <div
        className="absolute top-[30%] -right-[20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-bl from-rose-500/10 via-violet-500/10 to-transparent mix-blend-screen filter blur-[160px] animate-aurora-2"
      />

      <div
        className="absolute -bottom-[20%] left-[15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-amber-500/10 via-orange-500/10 to-transparent mix-blend-screen filter blur-[130px] animate-aurora-3"
      />

      {/* Subtly moving light bloom focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(2,6,23,0.6))] z-[1]" />
    </div>
  );
}

