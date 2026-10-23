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
        
        {/* 🤖 Card 1: Play with AI (Dual Cyan/Blue Beams 180° Apart) */}
        <div
          onClick={() => onSelectMode("ai")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl p-[2px] shadow-2xl transition-all duration-300 hover:-translate-y-1.5"
        >
          {/* ✨ Outer Aura Blur (Dual 180° Opposing Cyan Glows) */}
          <div className="pointer-events-none absolute -inset-2 z-0 animate-rotate-border dual-glow-cyan opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-75" />

          {/* ⚡ Rotating Border Beam (Dual sharp 2px beams 180° opposite each other) */}
          <div className="pointer-events-none absolute -inset-[150%] z-0 animate-rotate-border dual-glow-cyan opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* 🎴 Inner Card Body */}
          <div className="relative z-10 h-full w-full overflow-hidden rounded-[14px] border border-slate-800 bg-slate-900/95 p-8 backdrop-blur-xl transition-colors duration-300 group-hover:border-transparent">
            
            {/* Subtle Static Corner Glow */}
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-2xl transition-all group-hover:bg-cyan-500/20" />

            {/* 🌀 Background Floating Geometric Particles for Card 1 (Cyan/Blue) */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <span className="absolute left-8 bottom-0 h-10 w-10 rounded-full border border-cyan-400/40 bg-cyan-400/10 animate-card-particle-1" />
              <svg className="absolute left-1/4 bottom-0 h-9 w-9 text-blue-400/30 fill-current animate-card-particle-2" viewBox="0 0 24 24">
                <polygon points="12 2, 22 22, 2 22" />
              </svg>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-8 w-8 border border-cyan-300/40 bg-cyan-500/10 rotate-45 animate-card-particle-3" />
              <svg className="absolute right-1/4 bottom-0 h-12 w-12 text-cyan-300/30 fill-none stroke-current stroke-2 animate-card-particle-4" viewBox="0 0 24 24">
                <polygon points="12 2, 22 22, 2 22" />
              </svg>
              <span className="absolute right-8 bottom-0 h-7 w-7 rounded-full border border-blue-400/40 bg-blue-400/20 shadow-md shadow-cyan-500/20 animate-card-particle-5" />
              <span className="absolute left-3/4 bottom-0 h-6 w-6 border border-cyan-200/40 bg-cyan-400/10 rotate-12 animate-card-particle-6" />
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
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

                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Sharpen your skills against the computer! Instant matches with intelligent AI algorithms.
                </p>
              </div>

              {/* Button */}
              <div className="mt-8">
                <button className="relative overflow-hidden w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition-all group-hover:from-cyan-500 group-hover:to-blue-500 group-hover:shadow-cyan-500/25">
                  
                  {/* Button Particles */}
                  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="absolute left-6 bottom-0 h-3.5 w-3.5 rounded-full border border-cyan-200/80 bg-cyan-300/30 animate-particle-1" />
                    <svg className="absolute left-24 bottom-0 h-3.5 w-3.5 text-blue-200/80 fill-current animate-particle-2" viewBox="0 0 24 24">
                      <polygon points="12 2, 22 22, 2 22" />
                    </svg>
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-2.5 w-2.5 border border-white/90 bg-cyan-200/40 animate-particle-3" />
                    <svg className="absolute right-24 bottom-0 h-4 w-4 text-cyan-100/80 fill-none stroke-current stroke-2 animate-particle-4" viewBox="0 0 24 24">
                      <polygon points="12 2, 22 22, 2 22" />
                    </svg>
                    <span className="absolute right-6 bottom-0 h-2.5 w-2.5 rounded-full bg-blue-100/80 shadow-sm shadow-blue-200 animate-particle-5" />
                  </div>

                  <span className="relative z-10 flex items-center justify-center gap-1.5 hover:cursor-pointer">
                    <span>Play vs AI</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 🌐 Card 2: Play Online (Dual Legendary Emerald & Gold Beams 180° Apart) */}
        <div
          onClick={() => onSelectMode("online")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl p-[2px] shadow-2xl transition-all duration-300 hover:-translate-y-1.5"
        >
          {/* ✨ Outer Aura Blur (Dual 180° Opposing Gold/Emerald Glows) */}
          <div className="pointer-events-none absolute -inset-2 z-0 animate-rotate-border dual-glow-emerald opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-75" />

          {/* ⚡ Rotating Border Beam (Dual sharp 2px beams 180° opposite each other) */}
          <div className="pointer-events-none absolute -inset-[150%] z-0 animate-rotate-border dual-glow-emerald opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* 🎴 Inner Card Body */}
          <div className="relative z-10 h-full w-full overflow-hidden rounded-[14px] border border-slate-800 bg-slate-900/95 p-8 backdrop-blur-xl transition-colors duration-300 group-hover:border-transparent">
            
            {/* Subtle Static Corner Glow */}
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />

            {/* 🌀 Background Floating Geometric Particles for Card 2 (Emerald/Teal) */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <span className="absolute left-8 bottom-0 h-10 w-10 rounded-full border border-emerald-400/40 bg-emerald-400/10 animate-card-particle-1" />
              <svg className="absolute left-1/4 bottom-0 h-9 w-9 text-teal-400/30 fill-current animate-card-particle-2" viewBox="0 0 24 24">
                <polygon points="12 2, 22 22, 2 22" />
              </svg>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-8 w-8 border border-emerald-300/40 bg-emerald-500/10 rotate-45 animate-card-particle-3" />
              <svg className="absolute right-1/4 bottom-0 h-12 w-12 text-emerald-300/30 fill-none stroke-current stroke-2 animate-card-particle-4" viewBox="0 0 24 24">
                <polygon points="12 2, 22 22, 2 22" />
              </svg>
              <span className="absolute right-8 bottom-0 h-7 w-7 rounded-full border border-teal-400/40 bg-teal-400/20 shadow-md shadow-emerald-500/20 animate-card-particle-5" />
              <span className="absolute left-3/4 bottom-0 h-6 w-6 border border-emerald-200/40 bg-emerald-400/10 rotate-12 animate-card-particle-6" />
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                {/* Badge */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-2xl text-emerald-400 shadow">
                    🌐
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    {onlinePlayerCount ? `${onlinePlayerCount} Online` : "Multiplayer"}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Play Online
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Compete with players from around the globe! Real-time rooms, custom lobbies, and competitive matches.
                </p>
              </div>

              {/* Button */}
              <div className="mt-8">
                <button className="relative overflow-hidden w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg transition-all group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:shadow-emerald-500/25">
                  
                  {/* Button Particles */}
                  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="absolute left-6 bottom-0 h-3.5 w-3.5 rounded-full border border-emerald-200/80 bg-emerald-300/30 animate-particle-1" />
                    <svg className="absolute left-24 bottom-0 h-3.5 w-3.5 text-teal-200/80 fill-current animate-particle-2" viewBox="0 0 24 24">
                      <polygon points="12 2, 22 22, 2 22" />
                    </svg>
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-2.5 w-2.5 border border-white/90 bg-emerald-200/40 animate-particle-3" />
                    <svg className="absolute right-24 bottom-0 h-4 w-4 text-emerald-100/80 fill-none stroke-current stroke-2 animate-particle-4" viewBox="0 0 24 24">
                      <polygon points="12 2, 22 22, 2 22" />
                    </svg>
                    <span className="absolute right-6 bottom-0 h-2.5 w-2.5 rounded-full bg-teal-100/80 shadow-sm shadow-teal-200 animate-particle-5" />
                  </div>

                  <span className="relative z-10 flex items-center justify-center gap-1.5 hover:cursor-pointer">
                    <span>Enter Online Lobbies</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
