interface ModeSelectionProps {
  onSelectMode: (mode: "ai" | "online") => void;
  onlinePlayerCount?: number;
}

export function ModeSelection({ onSelectMode, onlinePlayerCount }: ModeSelectionProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Title Section */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Select Game Mode
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Train against smart AI or step into the global arena to challenge real players.
        </p>
      </div>

      {/* 2-Card Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        
        {/* 🤖 Card 1: Play with AI */}
        <div
          onClick={() => onSelectMode("ai")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:bg-slate-900/90 hover:shadow-cyan-500/10 hover:shadow-2xl"
        >
          {/* Subtle Glow Background Effect */}
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-2xl transition-all group-hover:bg-cyan-500/20" />

          {/* Badge */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-2xl text-cyan-400 shadow">
              🤖
            </div>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
              Singleplayer
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
            Solo Player
          </h2>

          <p>Sharpen your skills against the computer!</p>

          {/* Button */}
          <div className="mt-8">
            <button className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition-all group-hover:from-cyan-500 group-hover:to-blue-500 group-hover:shadow-cyan-500/25">
              Play vs AI →
            </button>
          </div>
        </div>

        {/* 🌐 Card 2: Play Online */}
        <div
          onClick={() => onSelectMode("online")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-slate-900/90 hover:shadow-emerald-500/10 hover:shadow-2xl"
        >
          {/* Subtle Glow Background Effect */}
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />

          {/* Badge */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-2xl text-emerald-400 shadow">
              🌐
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              Multiplayer
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
            Play Online
          </h2>

          <p>Compete with players from around the globe!</p>

          {/* Button */}
          <div className="mt-8">
            <button className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg transition-all group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:shadow-emerald-500/25">
              Enter Online Lobbies →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}