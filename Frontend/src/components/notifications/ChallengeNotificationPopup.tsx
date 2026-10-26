import { useState, useEffect } from "react";
import { LobbyInvitePayload } from "../../types/othello";

export interface ChallengeNotificationPopupProps {
    invite: LobbyInvitePayload;
    onAccept: (lobbyId: number, password?: string) => Promise<void>;
    onDecline: () => void;
}

const TOTAL_DURATION_SECONDS = 30;

export function ChallengeNotificationPopup({
    invite,
    onAccept,
    onDecline,
}: ChallengeNotificationPopupProps) {
    const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION_SECONDS);
    const [passwordInput, setPasswordInput] = useState("");
    const [isAccepting, setIsAccepting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Countdown timer for challenge expiry
    useEffect(() => {
        setTimeLeft(TOTAL_DURATION_SECONDS);
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onDecline();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [invite.lobbyId, onDecline]);

    const handleAcceptClick = async () => {
        if (isAccepting) return;
        if (invite.hasPassword && !passwordInput.trim()) {
            setErrorMsg("Please enter the lobby password.");
            return;
        }

        setIsAccepting(true);
        setErrorMsg(null);
        try {
            await onAccept(invite.lobbyId, invite.hasPassword ? passwordInput.trim() : undefined);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to join challenged lobby.";
            setErrorMsg(msg);
            setIsAccepting(false);
        }
    };

    const hostInitial = invite.hostName ? invite.hostName.charAt(0).toUpperCase() : "?";
    const progressPercent = (timeLeft / TOTAL_DURATION_SECONDS) * 100;

    return (
        <aside
            aria-label="Direct match challenge invitation"
            className="fixed top-5 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[420px] rounded-3xl border border-amber-500/50 bg-slate-900/95 p-4 sm:p-5 shadow-2xl shadow-black/90 backdrop-blur-2xl transition-all animate-in fade-in slide-in-from-top-6 duration-300 overflow-hidden ring-1 ring-amber-500/30"
        >
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-500/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-500/15 blur-2xl" />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-base shadow-sm">
                        ⚔️
                    </span>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            <h4 className="text-xs font-black tracking-wider uppercase text-amber-400">
                                Match Challenge Received!
                            </h4>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            Private challenge request
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-800/90 border border-slate-700/80 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                        {timeLeft}s
                    </span>
                    <button
                        type="button"
                        onClick={onDecline}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all cursor-pointer"
                        title="Decline and dismiss"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Challenger Card Details */}
            <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 mb-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-slate-900 border border-amber-500/40 text-amber-200 font-extrabold text-lg shadow-inner">
                    {hostInitial}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 leading-snug">
                        <span className="font-bold text-white text-sm">@{invite.hostName}</span>
                        {" "}has challenged you to an Othello duel!
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                        <span className="rounded-md bg-slate-800/90 px-1.5 py-0.5 font-mono font-bold text-emerald-300 border border-slate-700/80">
                            #{invite.lobbyId}
                        </span>
                        <span className="truncate text-slate-300 font-medium max-w-[170px]">
                            {invite.lobbyName}
                        </span>
                        {invite.hasPassword && (
                            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                                🔒 Protected
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Optional Password Input if Room is Protected */}
            {invite.hasPassword && (
                <div className="relative z-10 mb-3">
                    <label className="block text-[11px] font-semibold text-amber-300/90 mb-1">
                        🔒 Room Password Required:
                    </label>
                    <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter room password..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-colors"
                    />
                </div>
            )}

            {/* Error Message if Join Failed */}
            {errorMsg && (
                <div className="relative z-10 mb-3 rounded-xl border border-rose-500/40 bg-rose-950/70 p-2 text-xs text-rose-200 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span className="truncate">{errorMsg}</span>
                </div>
            )}

            {/* Action Buttons */}
            <div className="relative z-10 flex items-center gap-2">
                <button
                    type="button"
                    onClick={onDecline}
                    disabled={isAccepting}
                    className="flex-1 rounded-xl border border-slate-700/80 bg-slate-800/70 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                    ✕ Decline
                </button>

                <button
                    type="button"
                    onClick={handleAcceptClick}
                    disabled={isAccepting}
                    className="flex-[1.5] flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 py-2.5 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                    {isAccepting ? (
                        <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Joining Duel...</span>
                        </>
                    ) : (
                        <>
                            <span>⚡ Accept & Play</span>
                        </>
                    )}
                </button>
            </div>

            {/* Expiry Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </aside>
    );
}
