import { useState } from "react";
import { ActiveLobbyInfo } from "../../types/othello";

interface LobbyRoomProps {
  lobby: ActiveLobbyInfo;
  currentPlayerName: string;
  messages: string[];
  onLeaveLobby: () => void;
  onStartGame: (lobbyId: number) => void;
}

export function LobbyRoom({
  lobby,
  currentPlayerName,
  messages,
  onLeaveLobby,
  onStartGame,
}: LobbyRoomProps) {
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Check if current user is the host
  const isHost = lobby.createdBy.toLowerCase() === currentPlayerName.toLowerCase();

  // Host player is always lobby.createdBy (Black Piece)
  const hostPlayerName = lobby.createdBy;

  // Challenger player is the guest (White Piece):
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

        {/* Slot 1: Host (Black Piece) */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-8 backdrop-blur-xl shadow-xl flex flex-col items-center text-center">
          {/* Subtle Ambient Corner Accent */}
          <div className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />

          {/* Piece Graphic: Black Disc */}
          <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 p-1 shadow-2xl ring-4 ring-slate-800">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 border border-slate-700 shadow-inner">
              <span className="text-2xl font-black text-white/80">B</span>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-md">
              👑
            </div>
          </div>

          <span className="mb-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Host • Black Piece
          </span>

          <h3 className="text-xl font-bold text-white">
            {hostPlayerName}
          </h3>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready for match</span>
          </div>
        </div>

        {/* Slot 2: Challenger (White Piece) */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-8 backdrop-blur-xl shadow-xl flex flex-col items-center text-center">
          {/* Subtle Ambient Corner Accent */}
          <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />

          {isRoomFull && challengerPlayerName ? (
            <>
              {/* Piece Graphic: White Disc */}
              <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-300 p-1 shadow-2xl ring-4 ring-slate-400/40">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white border border-slate-200 shadow-inner">
                  <span className="text-2xl font-black text-slate-800">W</span>
                </div>
              </div>

              <span className="mb-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Challenger • White Piece
              </span>

              <h3 className="text-xl font-bold text-white">
                {challengerPlayerName}
              </h3>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ready for match</span>
              </div>
            </>
          ) : (
            <div className="my-auto flex flex-col items-center py-4">
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
                Share your room code with a friend or wait for a global player to join.
              </p>

              <button
                onClick={handleCopyId}
                className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
              >
                {copied ? "✓ Code Copied to Clipboard" : `Copy Room Code #${lobby.id}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Action Controls */}
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
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
                className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-emerald-950/50 transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
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
