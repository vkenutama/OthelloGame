import { useEffect, useState } from "react";

interface DisconnectedModalProps {
    isConnected: boolean;
}

export function DisconnectedModal({ isConnected }: DisconnectedModalProps) {
    const [showModal, setShowModal] = useState(!isConnected);
    const [justConnected, setJustConnected] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const transitionDuration = 500;
    const closeModalDelayDuration = 1500;

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let fadeTimeoutId: ReturnType<typeof setTimeout> | undefined;;
        let modalPopupTimeout: ReturnType<typeof setTimeout> | undefined;;

        if (!isConnected) {
            modalPopupTimeout = setTimeout(() => {
                setShowModal(true);
                setJustConnected(false);
                setIsClosing(false);
            }, 2000)

        } else if (showModal) {
            // When connection is restored:
            // 1. Switch to green "Success" state
            setJustConnected(true);

            // 2. Wait 800ms so the user sees the success checkmark, then trigger fade-out
            fadeTimeoutId = setTimeout(() => {
                setIsClosing(true);

                // 3. Wait for the 500ms CSS transition to finish, then unmount
                timeoutId = setTimeout(() => {
                    setShowModal(false);
                    setIsClosing(false);
                    setJustConnected(false);
                }, transitionDuration);
            }, closeModalDelayDuration);
        }

        return () => {
            clearTimeout(timeoutId!);
            clearTimeout(fadeTimeoutId!);
            clearTimeout(modalPopupTimeout!)
        };
    }, [isConnected, showModal]);


    // Don't render anything if modal is closed
    if (!showModal) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-${transitionDuration} ${isClosing ? "opacity-0 bg-slate-950/0" : "opacity-100 bg-slate-950/20"
                }`}
        >
            <div
                className={`w-full max-w-md rounded-2xl border bg-slate-900 p-6 shadow-2xl text-center transform transition-all duration-${transitionDuration} ${isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
                    } ${justConnected ? "border-emerald-500/50" : "border-slate-800"}`}
            >
                {/* Animated Icon: Flips from Warning to Green Checkmark */}
                <div
                    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border transition-colors duration-${transitionDuration} ${justConnected
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                        }`}
                >
                    {justConnected ? (
                        <span className="text-2xl font-bold animate-bounce">✓</span>
                    ) : (
                        <span className="text-2xl animate-pulse">❌</span>
                    )}
                </div>

                {/* Modal Heading */}
                <h2 className="text-xl font-bold text-white mb-2 transition-colors duration-300">
                    {justConnected ? "Connection Restored!" : "Connecting to Server"}
                </h2>

                {/* Modal Description */}
                <p className="text-sm text-slate-400 mb-6">
                    {justConnected
                        ? "Successfully reconnected to the Othello hub. Resuming game..."
                        : "Unable to reach the game server. We are attempting to reconnect in the background..."}
                </p>

                {/* Bottom Status Pill */}
                <div
                    className={`flex items-center justify-center gap-2 text-xs font-semibold rounded-lg py-2.5 px-4 border transition-colors duration-${transitionDuration} ${justConnected
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`}
                >
                    <span
                        className={`h-2 w-2 rounded-full ${justConnected ? "bg-emerald-400" : "bg-amber-400 animate-ping"
                            }`}
                    />
                    <span>
                        {justConnected ? "Online" : "Reconnecting..."}
                    </span>
                </div>
            </div>
        </div>
    );
}