import React, { useState } from "react";
import { ViewMode } from "../App";


interface NavbarProps {
    isConnected: boolean;
    playerName: string;
    onPlayerNameChange: (name: string) => void
    toHomeScreen: (viewMode: ViewMode) => void
    currentScreen: ViewMode
}

export function Navbar({ isConnected, playerName, onPlayerNameChange, toHomeScreen, currentScreen }: NavbarProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(playerName);

    const handleSave = () => {
        if (tempName.trim() && onPlayerNameChange) {
            onPlayerNameChange(tempName.trim());
        }

        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setTempName(playerName)
            setIsEditing(false);
        }

    }

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

                {/* 1. Left Side: Logo & Game Title */}
                <div className="flex items-center gap-3 hover:cursor-pointer" onClick={() => { toHomeScreen("menu") }}>
                    <div className="bg-emerald-100 p-1 rounded-full">
                        <img src="/othello_icon.png" alt="" className="h-10 rounded-full" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-extrabold tracking-wider text-white text-lg">OTHELLO</span>
                        </div>

                    </div>
                </div>

                {/* 2. Right Side: Connection Badge & Player Chip */}
                <div className="flex items-center gap-4">

                    {/* SignalR Connection Status Badge (Collapses to ping dot, expands right-to-left on hover) */}
                    <div
                        className={`group flex items-center cursor-pointer rounded-full h-8 px-2.5 text-xs font-medium border transition-all duration-300 ${isConnected
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/20"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/20"
                            }`}
                        title={isConnected ? "Server Connected" : "SignalR Disconnected"}
                    >
                        {/* Text expanding smoothly from right to left */}
                        <div className="grid grid-cols-[0fr] transition-all duration-300 ease-out group-hover:grid-cols-[1fr]">
                            <div className="overflow-hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:pr-2">
                                <span className="whitespace-nowrap inline-block transform translate-x-2 transition-transform duration-300 ease-out group-hover:translate-x-0">
                                    {isConnected ? "Connected" : "Disconnected"}
                                </span>
                            </div>
                        </div>

                        {/* Animated Pulsing Dot */}
                        <span className="relative flex h-2 w-2 shrink-0">
                            {isConnected && (
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            )}
                            <span
                                className={`relative inline-flex h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-rose-500"
                                    }`}
                            />
                        </span>
                    </div>

                    {isEditing ?
                        <div className="flex border-emerald-500/50 bg-slate-800 rounded-full gap-1.5 text-white pl-3 p-1 shadow-lg py-3 px-3">
                            <input
                                type="text"
                                onChange={(e) => setTempName(e.target.value)}
                                value={tempName}
                                className="w-24 bg-transparent text-sm font-medium text-white outline-none pl-2"
                                maxLength={15}
                                onKeyDown={handleKeyDown}
                            />


                            <button onClick={() => {
                                setTempName(playerName)
                                setIsEditing(false)
                            }}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 transition-colors font-bold"
                            >
                                X
                            </button>
                            <button onClick={handleSave}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white hover:bg-emerald-500 transition-colors">
                                ✓
                            </button>
                        </div> :
                        <button onClick={() => {
                            setTempName(playerName)
                            if (!currentScreen === "in_game") {
                                setIsEditing(true);

                            }
                        }}
                            title="Click to change your name"
                            className="group flex items-center gap-2.5 rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2.5 transition-all hover:border-slate-500 hover:bg-slate-800 duration-100"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow">
                                {playerName ? playerName.charAt(0).toUpperCase() : "?"}
                            </div>
                            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                                {playerName}
                            </span>
                            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100  hover:bg-slate-200 duration-150 hover:rounded-full hover:p-1 transition-all">
                                ✏️
                            </span>
                        </button>}
                </div>

            </div>
        </header >
    );
}