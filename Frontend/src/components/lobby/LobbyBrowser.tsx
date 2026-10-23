import { useState } from "react";
import { GetLobbyDetailsDto } from "../../dtos/lobby_dto";

interface LobbyBrowserProps {
    lobbies: GetLobbyDetailsDto[] | null;
    onCreateLobbyClick: () => void;
    onJoinLobby: (lobby: GetLobbyDetailsDto) => void;
}

export function LobbyBrowser({ lobbies, onCreateLobbyClick, onJoinLobby }: LobbyBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredLobbies = lobbies?.filter(
        (lobby) =>
            lobby.name.toLowerCase().includes(searchQuery.toLocaleLowerCase()) ||
            lobby.createdBy.toLowerCase().includes(searchQuery.toLocaleLowerCase())
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center gap-3">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Search by room or host name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-colors"
                    />
                </div>
                <div className="flex items-center">
                    <button 
                        onClick={onCreateLobbyClick}
                        className="group relative overflow-hidden w-44 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-emerald-950/40 transition-all duration-300 hover:shadow-emerald-500/25 hover:shadow-xl hover:cursor-pointer hover:bg-emerald-500"
                    >
                        {/* 🌀 Continuous Infinite Particle Stream */}
                        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <span className="absolute left-3 bottom-0 h-3.5 w-3.5 rounded-full border border-emerald-200/80 bg-emerald-300/30 animate-particle-1" />
                            <svg className="absolute left-10 bottom-0 h-3.5 w-3.5 text-teal-200/80 fill-current animate-particle-2" viewBox="0 0 24 24">
                                <polygon points="12 2, 22 22, 2 22" />
                            </svg>
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-2.5 w-2.5 border border-white/90 bg-emerald-200/40 animate-particle-3" />
                            <svg className="absolute right-10 bottom-0 h-4 w-4 text-emerald-100/80 fill-none stroke-current stroke-2 animate-particle-4" viewBox="0 0 24 24">
                                <polygon points="12 2, 22 22, 2 22" />
                            </svg>
                            <span className="absolute right-3 bottom-0 h-2.5 w-2.5 rounded-full bg-teal-100/80 shadow-sm shadow-teal-200 animate-particle-5" />
                        </div>

                        {/* 🔤 Text sitting in front */}
                        <span className="relative z-10 flex items-center justify-center gap-1.5 transition-colors duration-200">
                            <span className="text-base leading-none transition-transform duration-300 group-hover:-translate-y-0.5">+</span>
                            <span>Create Lobby</span>
                        </span>
                    </button>
                </div>
            </div>

            {/* Lobbies list */}
            <div className="text-white">
                {lobbies?.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-2xl">
                            🎮
                        </div>
                        <h4 className="text-base font-semibold text-white">No active matches</h4>
                        <p className="mt-1 text-xs text-slate-400">Click &ldquo;Create Lobby&rdquo; above to host an Othello match.</p>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                {filteredLobbies?.length || 0} active {filteredLobbies?.length === 1 ? "room" : "rooms"}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            {filteredLobbies?.map((lobby) => {
                                const isFull = lobby.playersCount >= 2;
                                return (
                                    <div
                                        key={lobby.id}
                                        className="group relative overflow-hidden flex items-center justify-between bg-slate-900/80 border border-slate-800/80 px-5 py-4 rounded-xl hover:border-emerald-500/40 hover:bg-slate-900/95 hover:shadow-xl hover:shadow-emerald-950/30 transition-all duration-300"
                                    >
                                        {/* 🌀 Background Floating Particles on Hover */}
                                        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            <span className="absolute left-10 bottom-0 h-3 w-3 rounded-full border border-emerald-400/50 bg-emerald-400/15 shadow-sm shadow-emerald-400/20 animate-hud-particle-1" />
                                            <span className="absolute left-1/4 bottom-0 h-2.5 w-2.5 border border-cyan-400/40 bg-cyan-400/15 rotate-45 animate-hud-particle-2" />
                                            <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-3.5 w-3.5 rounded-full border border-emerald-300/40 bg-emerald-500/10 animate-hud-particle-3" />
                                            <span className="absolute right-1/3 bottom-0 h-4 w-4 rounded-full border border-cyan-300/30 animate-hud-particle-4" />
                                            <span className="absolute right-16 bottom-0 h-2 w-2 rounded-full bg-emerald-400/60 shadow-sm shadow-emerald-400 animate-hud-particle-5" />
                                            <span className="absolute right-1/4 bottom-0 h-2.5 w-2.5 border border-emerald-400/40 bg-emerald-400/10 rotate-12 animate-hud-particle-6" />
                                        </div>

                                        {/* Left: Info */}
                                        <div className="relative z-10 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
                                                #{lobby.id}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-base text-white">{lobby.name}</p>
                                                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                                                        Public
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400">Host: <span className="text-slate-300 font-medium">{lobby.createdBy}</span></p>
                                            </div>
                                        </div>

                                        {/* Right: Counter & Button */}
                                        <div className="relative z-10 flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5 border border-slate-700/60">
                                                <span className={`h-2 w-2 rounded-full ${isFull ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
                                                <span className={`text-xs font-semibold ${isFull ? "text-amber-400" : "text-emerald-400"}`}>
                                                    {lobby.playersCount} / 2
                                                </span>
                                            </div>
                                            <button
                                                disabled={isFull}
                                                onClick={() => onJoinLobby(lobby)}
                                                className="group/btn relative overflow-hidden bg-emerald-600 px-5 py-2 rounded-xl text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-emerald-500/20"
                                            >
                                                {/* Button micro-particles on hover */}
                                                {!isFull && (
                                                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100">
                                                        <span className="absolute left-2 bottom-0 h-2 w-2 rounded-full border border-emerald-200/80 bg-emerald-300/30 animate-particle-1" />
                                                        <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-2 w-2 border border-white/90 bg-emerald-200/40 animate-particle-3" />
                                                        <span className="absolute right-2 bottom-0 h-2 w-2 rounded-full bg-teal-100/80 shadow-sm animate-particle-5" />
                                                    </div>
                                                )}
                                                <span className="relative z-10">{isFull ? "Full" : "Join Game"}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
