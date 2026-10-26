import { useEffect, useState } from "react";

export interface LobbyAlertInfo {
    id?: number;
    title: string;
    message: string;
    type?: "error" | "warning" | "info";
}

export interface LobbyAlertPopupProps {
    alert: LobbyAlertInfo;
    onClose: () => void;
}

const DISPLAY_DURATION_MS = 6000;

export function LobbyAlertPopup({ alert, onClose }: LobbyAlertPopupProps) {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        setProgress(100);
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / DISPLAY_DURATION_MS) * 100);
            setProgress(remaining);

            if (elapsed >= DISPLAY_DURATION_MS) {
                clearInterval(interval);
                onClose();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [alert, onClose]);

    const isError = alert.type !== "info" && alert.type !== "warning";

    return (
        <aside
            role="alert"
            aria-live="assertive"
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-md rounded-2xl border p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all animate-in fade-in slide-in-from-top-6 duration-300 overflow-hidden ${
                isError
                    ? "border-rose-500/60 bg-slate-900/95 shadow-rose-950/60 ring-1 ring-rose-500/40 text-slate-100"
                    : "border-amber-500/60 bg-slate-900/95 shadow-amber-950/60 ring-1 ring-amber-500/40 text-slate-100"
            }`}
        >
            {/* Ambient background glow */}
            <div
                className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl ${
                    isError ? "bg-rose-500/20" : "bg-amber-500/20"
                }`}
            />
            <div
                className={`pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full blur-2xl ${
                    isError ? "bg-orange-500/15" : "bg-yellow-500/15"
                }`}
            />

            {/* Header & Close */}
            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg shadow-sm ${
                            isError
                                ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                                : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        }`}
                    >
                        {isError ? "⚠️" : "ℹ️"}
                    </span>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span
                                className={`h-2 w-2 rounded-full animate-pulse ${
                                    isError ? "bg-rose-400" : "bg-amber-400"
                                }`}
                            />
                            <h4
                                className={`text-xs font-black tracking-wider uppercase ${
                                    isError ? "text-rose-400" : "text-amber-400"
                                }`}
                            >
                                {alert.title}
                            </h4>
                        </div>
                        {alert.id !== undefined && (
                            <span className="font-mono text-[10px] text-slate-400 mt-0.5 inline-block">
                                Room #{alert.id}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all cursor-pointer"
                    title="Dismiss alert"
                >
                    ✕
                </button>
            </div>

            {/* Description Body */}
            <div className="relative z-10 my-3">
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {alert.message}
                </p>

                {/* Auto-refresh feedback pill */}
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-1 w-fit font-medium">
                    <span className="font-bold">↻</span>
                    <span>Lobby browser has been refreshed</span>
                </div>
            </div>

            {/* Footer Action */}
            <div className="relative z-10 flex items-center justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm cursor-pointer active:scale-95"
                >
                    Dismiss
                </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 overflow-hidden">
                <div
                    className={`h-full transition-all duration-75 ease-linear ${
                        isError
                            ? "bg-gradient-to-r from-rose-500 to-amber-500"
                            : "bg-gradient-to-r from-amber-500 to-emerald-400"
                    }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </aside>
    );
}
