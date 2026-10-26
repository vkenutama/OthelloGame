import { useState } from "react";
import { ActiveLobbyInfo } from "../../types/othello";

interface LobbyRoomProps {
  lobby: ActiveLobbyInfo;
  currentPlayerName: string;
  messages: string[];
  onLeaveLobby: () => void;
  onStartGame: (lobbyId: number) => void;
  onInviteViaChat?: () => void;
}

export function LobbyRoom({
  lobby,
  currentPlayerName,
  messages,
  onLeaveLobby,
  onStartGame,
  onInviteViaChat,
}: LobbyRoomProps) {
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Check if current user is the host
  const isHost = lobby.createdBy.toLowerCase() === currentPlayerName.toLowerCase();

  // Host player is always lobby.createdBy
  const hostPlayerName = lobby.createdBy;

  // Challenger player is the guest:
  // - On Host's screen: challenger is lobby.guestName
  // - On Challenger's screen: challenger is currentPlayerName (or lobby.guestName)
  const challengerPlayerName = isHost
    ? lobby.guestName
    : (lobby.guestName || currentPlayerName);

  // The room is full only when 2 players are present AND challenger exists
  const isRoomFull = lobby.playersCount >= 2 && Boolean(challengerPlayerName);

  const handleCopyId = () => {
    navigator.clipboard.writeText(lobby.id.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    setIsStarting(true);
    onStartGame(lobby.id);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 1. Header Navigation & Info Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <button
            onClick={onLeaveLobby}
            className="group mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Leave Lobby</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              {lobby.name}
            </h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              Live Room
            </span>
            {isHost && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 flex items-center gap-1">
                <span>👑</span>
                <span>Room Host</span>
              </span>
            )}
          </div>
        </div>

        {/* Room ID Pill with 1-click Copy */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-2 text-xs font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition-all shadow-sm"
          >
            <span className="text-slate-400">Room Code:</span>
            <span className="font-bold text-white text-sm">#{lobby.id}</span>
            <span className="text-emerald-400 font-semibold ml-1">
              {copied ? "✓ Copied!" : "📋"}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Versus Arena Stage (2 Player Slots) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch relative">
        
        {/* VS Floating Center Badge (Desktop) */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 font-black text-xs text-amber-400 shadow-xl shadow-slate-950">
          VS
        </div>

        {/* Slot 1: Host */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-8 backdrop-blur-xl shadow-xl flex flex-col items-center text-center">
          {/* Subtle Ambient Corner Accent */}
          <div className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />

          {/* Floating Cyber Particles (Host Theme: Smooth & Random Glowing / Blooming) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="absolute left-[8%] bottom-0 h-3 w-3 rounded-full border border-cyan-400/60 bg-cyan-400/30 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] animate-lobby-particle-1" />
            <span className="absolute left-[22%] bottom-0 h-2.5 w-2.5 border border-blue-400/60 bg-blue-400/30 text-blue-400 rotate-45 shadow-[0_0_8px_rgba(96,165,250,0.7)] animate-lobby-particle-2" />
            <span className="absolute left-[36%] bottom-0 h-3.5 w-3.5 rounded-full border border-cyan-300/60 bg-cyan-400/30 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-lobby-particle-3" />
            <span className="absolute left-[50%] bottom-0 h-2 w-2 rounded-full bg-sky-300 text-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-lobby-particle-4" />
            <span className="absolute left-[64%] bottom-0 h-4 w-4 rounded-full border border-sky-400/50 bg-sky-400/20 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)] animate-lobby-particle-5" />
            <span className="absolute left-[78%] bottom-0 h-2.5 w-2.5 rounded-full bg-cyan-400 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-lobby-particle-6" />
            <span className="absolute left-[15%] bottom-0 h-2 w-2 border border-cyan-200/60 bg-cyan-300/30 text-cyan-200 rotate-12 shadow-[0_0_6px_rgba(165,243,252,0.7)] animate-lobby-particle-7" />
            <span className="absolute left-[88%] bottom-0 h-3 w-3 rounded-full border border-blue-300/50 bg-blue-500/25 text-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.7)] animate-lobby-particle-8" />
          </div>

          {/* Player Avatar */}
          <div className="relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-1 shadow-2xl shadow-cyan-950/50 ring-4 ring-cyan-500/30">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 border border-cyan-400/30 shadow-inner">
              <span className="text-3xl font-black text-cyan-300">
                {hostPlayerName ? hostPlayerName.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-md">
              👑
            </div>
          </div>

          <span className="relative z-10 mb-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Host
          </span>

          <h3 className="relative z-10 text-xl font-bold text-white">
            {hostPlayerName}
          </h3>

          <div className="relative z-10 mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready for match</span>
          </div>
        </div>

        {/* Slot 2: Challenger */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-8 backdrop-blur-xl shadow-xl flex flex-col items-center text-center">
          {/* Subtle Ambient Corner Accent */}
          <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />

          {isRoomFull && challengerPlayerName ? (
            <>
              {/* Floating Cyber Particles (Challenger Theme: Smooth & Random Glowing / Blooming, ONLY shown when opponent has joined) */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <span className="absolute left-[8%] bottom-0 h-3 w-3 rounded-full border border-emerald-400/60 bg-emerald-400/30 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] animate-lobby-particle-1" />
                <span className="absolute left-[22%] bottom-0 h-2.5 w-2.5 border border-teal-400/60 bg-teal-400/30 text-teal-400 rotate-45 shadow-[0_0_8px_rgba(45,212,191,0.7)] animate-lobby-particle-2" />
                <span className="absolute left-[36%] bottom-0 h-3.5 w-3.5 rounded-full border border-emerald-300/60 bg-emerald-400/30 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-lobby-particle-3" />
                <span className="absolute left-[50%] bottom-0 h-2 w-2 rounded-full bg-teal-300 text-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-lobby-particle-4" />
                <span className="absolute left-[64%] bottom-0 h-4 w-4 rounded-full border border-emerald-300/50 bg-emerald-400/20 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-lobby-particle-5" />
                <span className="absolute left-[78%] bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-400 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-lobby-particle-6" />
                <span className="absolute left-[15%] bottom-0 h-2 w-2 border border-teal-200/60 bg-teal-300/30 text-teal-200 rotate-12 shadow-[0_0_6px_rgba(153,246,228,0.7)] animate-lobby-particle-7" />
                <span className="absolute left-[88%] bottom-0 h-3 w-3 rounded-full border border-emerald-300/50 bg-emerald-500/25 text-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.7)] animate-lobby-particle-8" />
              </div>

              {/* Player Avatar */}
              <div className="relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-1 shadow-2xl shadow-emerald-950/50 ring-4 ring-emerald-500/30">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 border border-emerald-400/30 shadow-inner">
                  <span className="text-3xl font-black text-emerald-300">
                    {challengerPlayerName ? challengerPlayerName.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
              </div>

              <span className="relative z-10 mb-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Challenger
              </span>

              <h3 className="relative z-10 text-xl font-bold text-white">
                {challengerPlayerName}
              </h3>

              <div className="relative z-10 mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ready for match</span>
              </div>
            </>
          ) : (
            <div className="relative z-10 my-auto flex flex-col items-center py-4">
              {/* Radar Pulse Animation */}
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/20" />
                <span className="absolute inline-flex h-16 w-16 animate-pulse rounded-full bg-emerald-500/30" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-emerald-400/60 bg-emerald-500/10 text-2xl text-emerald-400">
                  ⚔️
                </div>
              </div>

              <h4 className="text-base font-bold text-white">Waiting for Opponent</h4>
              <p className="mt-1.5 text-xs text-slate-400 max-w-[220px]">
                Share your room code with a friend or broadcast an invite to Global Chat.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={handleCopyId}
                  className="rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition-all shadow-sm cursor-pointer"
                >
                  {copied ? "✓ Code Copied" : `Copy Room #${lobby.id}`}
                </button>

                {isHost && onInviteViaChat && (
                  <button
                    onClick={onInviteViaChat}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-400 transition-all shadow-sm shadow-emerald-950/40 cursor-pointer active:scale-95"
                  >
                    <span>📢</span>
                    <span>Invite via Chat</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Action Controls */}
      <div
        className={`mt-8 relative overflow-hidden rounded-2xl transition-all duration-500 ${
          isRoomFull
            ? "p-[2px] shadow-2xl shadow-emerald-950/60"
            : "border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6"
        }`}
      >
        {isRoomFull && (
          <>
            {/* ✨ Outer Aura Blur (Dual 180° Opposing Gold/Emerald Glows) */}
            <div className="pointer-events-none absolute -inset-2 z-0 animate-rotate-border dual-glow-emerald opacity-75 blur-xl transition-opacity duration-500" />

            {/* ⚡ Rotating Border Beam (Dual sharp 2px beams 180° opposite each other) */}
            <div className="pointer-events-none absolute -inset-[280%] z-0 animate-rotate-border dual-glow-emerald opacity-100 transition-opacity duration-500" />
          </>
        )}

        {/* Inner Card Body */}
        <div
          className={`relative z-10 w-full overflow-hidden transition-all duration-500 ${
            isRoomFull
              ? "rounded-[14px] bg-slate-900/95 backdrop-blur-xl border border-emerald-500/20 p-6"
              : ""
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${isRoomFull ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
              <div>
                <p className="text-sm font-semibold text-white">
                  {isRoomFull ? "Both Players Connected!" : "1 of 2 Players in Room"}
                </p>
                <p className="text-xs text-slate-400">
                  {isRoomFull 
                    ? (isHost ? "You are the room host. You can now launch the match!" : "Waiting for the host to launch the game...") 
                    : (isHost ? "Waiting for a challenger to join before you can start." : "Waiting for another player...")}
                </p>
              </div>
            </div>

            <div>
              {isHost ? (
                <button
                  disabled={!isRoomFull || isStarting}
                  onClick={handleStart}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-emerald-950/50 transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isStarting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Launching Game...</span>
                    </span>
                  ) : (
                    <span>🚀 Start Match</span>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-5 py-3 border border-slate-700 text-xs font-semibold text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Waiting for Host to Start...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Room Activity Feed */}
      {messages.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Room Activity</p>
          <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto">
            {messages.slice(-5).map((msg, idx) => (
              <p key={idx} className="text-xs text-slate-400 font-mono">
                • {msg}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
