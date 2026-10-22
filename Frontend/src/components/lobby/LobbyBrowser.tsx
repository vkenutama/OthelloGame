import { useEffect, useState } from "react";
import { GetLobbyDetailsDto } from "../../dtos/lobby_dto";

interface LobbyBrowserProps {
    lobbies: GetLobbyDetailsDto[] | null
}

export function LobbyBrowser({ lobbies }: LobbyBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredLobbies = lobbies?.filter(
        (lobby) =>
            lobby.name.toLowerCase().includes(searchQuery.toLocaleLowerCase()) ||
            lobby.createdBy.toLowerCase().includes(searchQuery.toLocaleLowerCase())
    );

    return (
        <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 ">
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


            {/* Lobbies here */}
            <div className="text-white gap-2">
                {lobbies?.length == 0 ? (<div>
                    No lobies found.
                </div>) :
                    (<div>
                        <p className="text-white mb-2 font-semibold">{filteredLobbies?.length} lobbies found</p>
                        {filteredLobbies?.map(({ id, name, createdBy, playersCount }) =>
                            <div
                                key={id}
                                className="flex items-center justify-between bg-slate-800/80 border border-slate-700/50 px-5 py-4 rounded-xl hover:bg-slate-700/80 transition-colors"
                            >
                                {/* Left: Info */}
                                <div className="flex flex-col">
                                    <p className="font-bold text-lg text-white">{name}</p>
                                    <p className="text-xs text-slate-400">Host: {createdBy}</p>
                                </div>

                                {/* Right: Counter & Button */}
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-semibold text-emerald-400">
                                        {playersCount} / 2
                                    </span>
                                    <button
                                        disabled={playersCount >= 2}
                                        className="bg-emerald-600 px-4 py-1.5 rounded-xl text-sm font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {playersCount >= 2 ? "Full" : "Join"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>)}
            </div>

        </div>

    )
}