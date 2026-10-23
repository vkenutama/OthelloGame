import React, { useState, useEffect } from "react";

interface CreateLobbyModalProps {
  isOpen: boolean;
  playerName: string;
  onClose: () => void;
  onCreate: (name: string, isPublic: boolean) => Promise<void>;
}

export function CreateLobbyModal({
  isOpen,
  playerName,
  onClose,
  onCreate,
}: CreateLobbyModalProps) {
  const [lobbyName, setLobbyName] = useState(`${playerName}'s Match`);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Automatically sync lobbyName and state whenever the modal opens or playerName updates
  useEffect(() => {
    if (isOpen) {
      setLobbyName(`${playerName}'s Match`);
      setErrorMsg(null);
      setIsLoading(false);
    }
  }, [isOpen, playerName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lobbyName.trim();
    if (!trimmed) {
      setErrorMsg("Please enter a lobby name.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      await onCreate(trimmed, isPublic);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create lobby";
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={isLoading ? undefined : onClose} />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 p-6 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl">
        {/* Subtle Decorative Top Glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-lg shadow">
              ⚔️
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Match Room</h3>
              <p className="text-xs text-slate-400">Set up your game lobby and invite challengers</p>
            </div>
          </div>
          <button
            disabled={isLoading}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1. Room Name Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
              placeholder="e.g. Masters Arena, Quick Match #1..."
              maxLength={30}
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm font-medium text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* 2. Host Identifier Chip */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5">
            <span className="text-xs text-slate-400">Host Player</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-white">{playerName}</span>
            </div>
          </div>

          {/* 3. Visibility / Public Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Public Room</p>
              <p className="text-xs text-slate-400">Allow players in lobby browser to see and join</p>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? "bg-emerald-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/50 transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating Room...</span>
                </span>
              ) : (
                <span>Create & Enter</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
