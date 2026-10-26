import { useState } from "react";
import { GetLobbyDetailsDto } from "../../dtos/lobby_dto";

interface LobbyBrowserProps {
    lobbies: GetLobbyDetailsDto[] | null;
    onCreateLobbyClick: () => void;
    onJoinLobby: (lobby: GetLobbyDetailsDto, password?: string) => Promise<void> | void;
    onJoinById: (lobbyId: number, password?: string) => Promise<void> | void;
    onRefresh?: () => void;
}

export function LobbyBrowser({
    lobbies,
    onCreateLobbyClick,
    onJoinLobby,
    onJoinById,
    onRefresh,
}: LobbyBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Modal state for "Join by ID"
    const [isJoinByIdOpen, setIsJoinByIdOpen] = useState(false);
    const [joinIdInput, setJoinIdInput] = useState("");
    const [joinIdPassword, setJoinIdPassword] = useState("");
    const [joinIdError, setJoinIdError] = useState<string | null>(null);
    const [isJoiningById, setIsJoiningById] = useState(false);

    // Modal state for entering password for a password-protected listed lobby
    const [selectedProtectedLobby, setSelectedProtectedLobby] = useState<GetLobbyDetailsDto | null>(null);
    const [protectedLobbyPassword, setProtectedLobbyPassword] = useState("");
    const [protectedLobbyError, setProtectedLobbyError] = useState<string | null>(null);
    const [isJoiningProtected, setIsJoiningProtected] = useState(false);
    const [joiningLobbyId, setJoiningLobbyId] = useState<number | null>(null);

    const filteredLobbies = lobbies?.filter(
        (lobby) =>
            lobby.name.toLowerCase().includes(searchQuery.toLocaleLowerCase()) ||
            lobby.createdBy.toLowerCase().includes(searchQuery.toLocaleLowerCase())
    );

    const handleJoinClick = async (lobby: GetLobbyDetailsDto) => {
        if (lobby.hasPassword) {
            setSelectedProtectedLobby(lobby);
            setProtectedLobbyPassword("");
            setProtectedLobbyError(null);
        } else {
            setJoiningLobbyId(lobby.id);
            try {
                await onJoinLobby(lobby);
            } catch (err) {
                console.warn("Failed to join lobby:", err);
            } finally {
                setJoiningLobbyId(null);
            }
        }
    };

    const handleProtectedLobbySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProtectedLobby) return;
        if (!protectedLobbyPassword.trim()) {
            setProtectedLobbyError("Please enter the room password.");
            return;
        }

        try {
            setIsJoiningProtected(true);
            setProtectedLobbyError(null);
            await onJoinLobby(selectedProtectedLobby, protectedLobbyPassword.trim());
            setSelectedProtectedLobby(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to join room";
            setProtectedLobbyError(message);
            // If the room no longer exists, close modal so the notification popup & refreshed lobby list are visible
            if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("not exist") || message.toLowerCase().includes("closed")) {
                setSelectedProtectedLobby(null);
            }
        } finally {
            setIsJoiningProtected(false);
        }
    };

    const handleJoinByIdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const idNum = parseInt(joinIdInput.trim(), 10);
        if (isNaN(idNum) || idNum <= 0) {
            setJoinIdError("Please enter a valid numeric Lobby ID.");
            return;
        }

        try {
            setIsJoiningById(true);
            setJoinIdError(null);
            await onJoinById(idNum, joinIdPassword.trim() || undefined);
            setIsJoinByIdOpen(false);
            setJoinIdInput("");
            setJoinIdPassword("");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to join lobby";
            setJoinIdError(message);
            if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("not exist") || message.toLowerCase().includes("closed")) {
                setIsJoinByIdOpen(false);
            }
        } finally {
            setIsJoiningById(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Top Action Bar: Search + Join by ID + Create Lobby */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

                <div className="flex items-center gap-2.5">
                    {/* Refresh Lobbies Button */}
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/90 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-700 hover:text-white transition-all cursor-pointer shadow-md active:scale-95"
                            title="Refresh Lobbies"
                        >
                            <span className="text-base font-bold">↻</span>
                        </button>
                    )}

                    {/* Join by ID button */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsJoinByIdOpen(true);
                            setJoinIdInput("");
                            setJoinIdPassword("");
                            setJoinIdError(null);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/90 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-emerald-500/50 hover:bg-slate-700 hover:text-white transition-all shadow-md cursor-pointer"
                        title="Join by Lobby ID"
                    >
                        <span>🔑</span>
                        <span>Join by ID</span>
                    </button>

                    {/* Create Lobby Button */}
                    <button
                        onClick={onCreateLobbyClick}
                        className="group relative overflow-hidden flex-1 sm:w-44 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-emerald-950/40 transition-all duration-300 hover:shadow-emerald-500/25 hover:shadow-xl hover:cursor-pointer hover:bg-emerald-500"
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
                        <p className="mt-1 text-xs text-slate-400">Click &ldquo;Create Lobby&rdquo; above or enter a room ID via &ldquo;Join by ID&rdquo;.</p>
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
                                                    {lobby.hasPassword && (
                                                        <span className="flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                                                            <span>🔒</span>
                                                            <span>Protected</span>
                                                        </span>
                                                    )}
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
                                                disabled={isFull || joiningLobbyId === lobby.id}
                                                onClick={() => void handleJoinClick(lobby)}
                                                className="group/btn relative overflow-hidden bg-emerald-600 px-5 py-2 rounded-xl text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-emerald-500/20 cursor-pointer"
                                            >
                                                {/* Button micro-particles on hover */}
                                                {!isFull && joiningLobbyId !== lobby.id && (
                                                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100">
                                                        <span className="absolute left-2 bottom-0 h-2 w-2 rounded-full border border-emerald-200/80 bg-emerald-300/30 animate-particle-1" />
                                                        <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-2 w-2 border border-white/90 bg-emerald-200/40 animate-particle-3" />
                                                        <span className="absolute right-2 bottom-0 h-2 w-2 rounded-full bg-teal-100/80 shadow-sm animate-particle-5" />
                                                    </div>
                                                )}
                                                <span className="relative z-10 flex items-center gap-1.5">
                                                    {joiningLobbyId === lobby.id ? (
                                                        <>
                                                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            <span>Joining...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {lobby.hasPassword && <span>🔒</span>}
                                                            <span>{isFull ? "Full" : "Join Game"}</span>
                                                        </>
                                                    )}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Join Match by ID */}
            {isJoinByIdOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className="absolute inset-0" onClick={() => !isJoiningById && setIsJoinByIdOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-700/70 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔑</span>
                                <h3 className="text-base font-bold text-white">Join by Lobby ID</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsJoinByIdOpen(false)}
                                disabled={isJoiningById}
                                className="h-7 w-7 text-slate-400 hover:text-white cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {joinIdError && (
                            <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-400 flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{joinIdError}</span>
                            </div>
                        )}

                        <form onSubmit={handleJoinByIdSubmit} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                    Lobby ID #
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 104"
                                    value={joinIdInput}
                                    onChange={(e) => setJoinIdInput(e.target.value)}
                                    disabled={isJoiningById}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                    Room Password (If Protected)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Leave empty if public..."
                                    value={joinIdPassword}
                                    onChange={(e) => setJoinIdPassword(e.target.value)}
                                    disabled={isJoiningById}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsJoinByIdOpen(false)}
                                    disabled={isJoiningById}
                                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!joinIdInput.trim() || isJoiningById}
                                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
                                >
                                    {isJoiningById ? "Connecting..." : "Join Lobby"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Enter Password for Selected Protected Lobby */}
            {selectedProtectedLobby && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className="absolute inset-0" onClick={() => !isJoiningProtected && setSelectedProtectedLobby(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-amber-500/30 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔒</span>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Protected Room</h3>
                                    <p className="text-[11px] text-slate-400">{selectedProtectedLobby.name} (#{selectedProtectedLobby.id})</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedProtectedLobby(null)}
                                disabled={isJoiningProtected}
                                className="h-7 w-7 text-slate-400 hover:text-white cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {protectedLobbyError && (
                            <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-400 flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{protectedLobbyError}</span>
                            </div>
                        )}

                        <form onSubmit={handleProtectedLobbySubmit} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                    Room Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter password..."
                                    value={protectedLobbyPassword}
                                    onChange={(e) => setProtectedLobbyPassword(e.target.value)}
                                    disabled={isJoiningProtected}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedProtectedLobby(null)}
                                    disabled={isJoiningProtected}
                                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!protectedLobbyPassword.trim() || isJoiningProtected}
                                    className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-500 transition-all shadow-md shadow-amber-950/40 disabled:opacity-50 cursor-pointer"
                                >
                                    {isJoiningProtected ? "Verifying..." : "Unlock & Join"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
