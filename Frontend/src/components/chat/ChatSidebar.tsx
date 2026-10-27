import { useState, useEffect, useRef } from "react";
import { ViewMode } from "../../App";
import { ChatMessageItem } from "../../dtos/chat_dto";
import { parseLobbyInvite, LobbyInvitePayload } from "../../types/othello";

export type ChatChannel = "global" | "lobby";

interface ChatSidebarProps {
    playerName: string;
    currentScreen: ViewMode;
    messages: ChatMessageItem[];
    currentLobbyId?: number | null;
    isAiGame?: boolean;
    onlinePlayersCount: number
    onSendMessage?: (message: string, channel: ChatChannel) => void | Promise<void>;
    onJoinLobbyFromChat?: (lobbyId: number, password?: string) => Promise<void>;
    onChallengePlayer?: (targetUsername: string) => Promise<void>;
    isOpenControlled?: boolean;
    onToggleOpen?: (open: boolean) => void;
    getOnlinePlayersCount: () => void;
}

export function ChatSidebar({
    playerName,
    currentScreen,
    messages,
    currentLobbyId,
    isAiGame = false,
    onSendMessage,
    onJoinLobbyFromChat,
    onChallengePlayer,
    isOpenControlled,
    onToggleOpen,
    onlinePlayersCount,
    getOnlinePlayersCount
}: ChatSidebarProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
    const setIsOpen = (val: boolean | ((prev: boolean) => boolean)) => {
        const next = typeof val === "function" ? val(isOpen) : val;
        setInternalIsOpen(next);

        if (next) {
            void getOnlinePlayersCount();
        }

        onToggleOpen?.(next);
    };

    const [activeChannel, setActiveChannel] = useState<ChatChannel>("global");
    const [messageInput, setMessageInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const [isJoiningLobbyId, setIsJoiningLobbyId] = useState<number | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [passwordModalInvite, setPasswordModalInvite] = useState<LobbyInvitePayload | null>(null);
    const [passwordInput, setPasswordInput] = useState("");

    const asideRef = useRef<HTMLElement | null>(null);
    const triggerBtnRef = useRef<HTMLButtonElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const prevMessagesLengthRef = useRef(messages.length);
    const prevIsOpenRef = useRef(isOpen);

    // Determine if current screen is lobby room or in gameplay (hidden when playing vs AI)
    const isLobbyOrGameplay = (currentScreen === "lobby" || currentScreen === "in_game") && !isAiGame;

    // When chat sidebar opens: default to lobby view if player is in lobby or in game
    useEffect(() => {
        // Triggered only when transitioning from closed to open
        if (!prevIsOpenRef.current && isOpen) {
            setUnreadCount(0);
            if (isLobbyOrGameplay) {
                setActiveChannel("lobby");
            } else {
                setActiveChannel("global");
            }
            void getOnlinePlayersCount();
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, isLobbyOrGameplay, getOnlinePlayersCount]);

    // If leaving lobby/gameplay while in lobby chat, auto-fallback to global chat
    useEffect(() => {
        if (!isLobbyOrGameplay && activeChannel === "lobby") {
            setActiveChannel("global");
        }
    }, [isLobbyOrGameplay, activeChannel]);

    // Track unread messages when sidebar is closed (excluding private direct challenges)
    useEffect(() => {
        const visibleMessages = messages.filter((m) => {
            const invite = parseLobbyInvite(m.message);
            // Hide private direct challenges from unread count badge
            return !invite || !invite.targetUser;
        });

        if (isOpen) {
            setUnreadCount(0);
            prevMessagesLengthRef.current = visibleMessages.length;
            return;
        }

        if (visibleMessages.length > prevMessagesLengthRef.current) {
            const diff = visibleMessages.length - prevMessagesLengthRef.current;
            setUnreadCount((prev) => prev + diff);
        }
        prevMessagesLengthRef.current = visibleMessages.length;
    }, [messages, isOpen]);

    // Close when clicking outside of the sidebar or pressing Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                asideRef.current &&
                !asideRef.current.contains(target) &&
                triggerBtnRef.current &&
                !triggerBtnRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    // Filter messages for the currently selected channel
    const displayedMessages = messages.filter((msg) => {
        // Direct challenge privacy filter:
        // Direct challenges are delivered via notification popup to the target player,
        // so other players should NOT know or see the challenge request in chat.
        const invite = parseLobbyInvite(msg.message);
        if (invite && invite.targetUser) {
            return false;
        }

        if (activeChannel === "global") {
            return msg.lobbyId === null;
        }
        // Lobby channel
        if (currentLobbyId != null) {
            return msg.lobbyId === currentLobbyId;
        }
        return msg.lobbyId !== null;
    });

    // Auto-scroll inside the messages container only (does NOT hijack viewport scroll)
    useEffect(() => {
        if (isOpen && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [displayedMessages.length, isOpen, activeChannel]);

    const handleSend = async () => {
        const trimmed = messageInput.trim();
        if (!trimmed || isSending) return;

        setIsSending(true);
        try {
            if (onSendMessage) {
                await onSendMessage(trimmed, activeChannel);
            }
            setMessageInput("");
        } catch (err) {
            console.error("Failed to send chat:", err);
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (dateInput: Date | string) => {
        try {
            const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch {
            return "";
        }
    };

    const handleToggleOpen = () => {
        setIsOpen((prev) => !prev);
    };

    const handleJoinInvite = async (lobbyId: number, hasPassword?: boolean, inviteData?: LobbyInvitePayload) => {
        if (!onJoinLobbyFromChat) return;
        setJoinError(null);

        if (hasPassword) {
            setPasswordModalInvite(inviteData || {
                type: "lobby_invite",
                lobbyId,
                lobbyName: `Room #${lobbyId}`,
                hostName: "Host",
                hasPassword: true,
            });
            setPasswordInput("");
            return;
        }

        setIsJoiningLobbyId(lobbyId);
        try {
            await onJoinLobbyFromChat(lobbyId);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to join lobby";
            setJoinError(`Lobby #${lobbyId}: ${msg}`);
            setTimeout(() => setJoinError(null), 5000);
        } finally {
            setIsJoiningLobbyId(null);
        }
    };

    const handleConfirmPasswordJoin = async () => {
        if (!passwordModalInvite || !onJoinLobbyFromChat) return;
        const targetId = passwordModalInvite.lobbyId;
        setIsJoiningLobbyId(targetId);
        try {
            await onJoinLobbyFromChat(targetId, passwordInput);
            setPasswordModalInvite(null);
            setPasswordInput("");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Invalid password or failed to join.";
            setJoinError(msg);
            setTimeout(() => setJoinError(null), 5000);
        } finally {
            setIsJoiningLobbyId(null);
        }
    };

    return (
        <>
            {/* 1. Floating Toggle Trigger Button (Fixed on the right edge of viewport) */}
            <button
                ref={triggerBtnRef}
                type="button"
                onClick={handleToggleOpen}
                className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 rounded-l-2xl border border-r-0 border-slate-700/70 bg-slate-900/80 px-3.5 py-3 text-slate-300 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-800 hover:text-emerald-400 cursor-pointer ${isOpen
                        ? "translate-x-full pointer-events-none opacity-0"
                        : "translate-x-0 opacity-100"
                    }`}
                title={isOpen ? "Close Chat" : "Open Live Chat"}
            >
                <div className="relative flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>

                    {/* Unread badge bubble when new chats arrive (shows 9+ for 10 or more) */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-3 -right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-[10px] font-black text-white shadow-lg shadow-rose-950/60 ring-2 ring-slate-900 animate-pulse">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>
                <span className="text-xs font-bold tracking-wider uppercase select-none">
                    Chat
                </span>
            </button>

            {/* 2. Floating Translucent Partial-Height Chat Card */}
            <aside
                ref={asideRef}
                className={`fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex h-[520px] max-h-[80vh] w-[calc(100vw-1.5rem)] sm:w-96 flex-col rounded-3xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-2xl shadow-2xl shadow-black/80 transition-all duration-300 ease-out overflow-hidden ${isOpen
                        ? "translate-x-0 opacity-100 pointer-events-auto"
                        : "translate-x-[120%] opacity-0 pointer-events-none"
                    }`}
            >
                {/* Subtle Ambient Glow inside glass */}
                <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-2xl" />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-slate-700/50 bg-slate-950/40 backdrop-blur-md px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                            >
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Live Chat</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {activeChannel === "global"
                                        ? `${Math.max(1, onlinePlayersCount)} ${Math.max(1, onlinePlayersCount) === 1 ? "player" : "players"} online`
                                        : currentScreen === "in_game"
                                            ? "Match Channel"
                                            : "Lobby Channel"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Close / Hide Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-800/60 text-slate-300 hover:border-slate-500 hover:bg-slate-700/80 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                        title="Close Chat"
                        aria-label="Close Chat"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Channel Selector Bar (Global & Lobby) */}
                <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/35 px-4 py-2">
                    <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-inner">
                        {/* Global Chat Tab - Always visible */}
                        <button
                            type="button"
                            onClick={() => setActiveChannel("global")}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${activeChannel === "global"
                                    ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/50"
                                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                                }`}
                        >
                            <span className="text-xs">🌐</span>
                            <span>Global</span>
                            <span className="ml-0.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                                {Math.max(1, onlinePlayersCount)}
                            </span>
                        </button>

                        {/* Lobby Chat Tab - Only visible when current screen IS lobby or gameplay */}
                        {isLobbyOrGameplay && (
                            <button
                                type="button"
                                onClick={() => setActiveChannel("lobby")}
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${activeChannel === "lobby"
                                        ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/50"
                                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                                    }`}
                            >
                                <span className="text-xs">{currentScreen === "in_game" ? "⚔️" : "👥"}</span>
                                <span>Lobby</span>
                                <span className="ml-0.5 rounded-full bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-400">
                                    {currentScreen === "in_game" ? "Match" : "Room"}
                                </span>
                            </button>
                        )}
                    </div>

                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        {activeChannel === "global"
                            ? "All Players"
                            : currentScreen === "in_game"
                                ? "Current Match"
                                : "Waiting Room"}
                    </span>
                </div>

                {/* Join Error Toast */}
                {joinError && (
                    <div className="relative z-20 mx-4 mt-2 flex items-center justify-between gap-2 rounded-xl border border-rose-500/40 bg-rose-950/80 p-2.5 text-xs text-rose-200 shadow-md">
                        <span className="flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>{joinError}</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => setJoinError(null)}
                            className="text-xs text-rose-400 hover:text-white font-bold cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Messages Body Area */}
                <div
                    ref={messagesContainerRef}
                    className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/20 scroll-smooth"
                >
                    {displayedMessages.length === 0 ? (
                        <div className="my-auto flex flex-col items-center justify-center py-12 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/50 text-xl text-slate-400 mb-3 shadow-inner">
                                {activeChannel === "global" ? "🌐" : currentScreen === "in_game" ? "⚔️" : "👥"}
                            </div>
                            <p className="text-sm font-semibold text-slate-300">
                                {activeChannel === "global"
                                    ? "Global Chat"
                                    : currentScreen === "in_game"
                                        ? "Match Chat"
                                        : "Lobby Chat"}
                            </p>
                            <p className="text-xs text-slate-400/80 mt-1 max-w-[220px]">
                                {activeChannel === "global"
                                    ? "No messages yet. Send a greeting to everyone online!"
                                    : currentScreen === "in_game"
                                        ? "No match chat yet. Say good luck to your opponent!"
                                        : "No lobby chat yet. Plan your match strategy here!"}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {displayedMessages.map((msg) => {
                                const isSelf = msg.username.toLowerCase() === playerName.toLowerCase();
                                const invite = parseLobbyInvite(msg.message);

                                if (invite) {
                                    return (
                                        <div
                                            key={msg.id}
                                            className="w-full my-1 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/25 to-slate-900 p-3.5 shadow-xl shadow-emerald-950/20 transition-all"
                                        >
                                            {/* Invite Header */}
                                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500/20 text-xs">
                                                        ⚔️
                                                    </span>
                                                    <span className="text-[11px] font-black tracking-wide uppercase text-emerald-400">
                                                        Open Match Challenge
                                                    </span>
                                                </div>
                                                <span className="text-[9px] text-slate-500">
                                                    {formatTime(msg.postedAt)}
                                                </span>
                                            </div>

                                            {/* Invite Details */}
                                            <div className="mb-3">
                                                <p className="text-xs text-slate-200 leading-relaxed">
                                                    <span className="font-bold text-white">
                                                        {isSelf ? "You" : invite.hostName}
                                                    </span>
                                                    <span> opened an open invite to play Othello!</span>
                                                </p>

                                                <div className="mt-2 flex items-center gap-2 text-[11px]">
                                                    <span className="rounded-md bg-slate-800/90 px-2 py-0.5 border border-slate-700/80 font-mono text-xs font-bold text-emerald-300">
                                                        #{invite.lobbyId}
                                                    </span>
                                                    <span className="truncate font-semibold text-slate-300 max-w-[150px]">
                                                        {invite.lobbyName}
                                                    </span>
                                                    {invite.hasPassword && (
                                                        <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                                                            <span>🔒</span>
                                                            <span>Protected</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            {isSelf ? (
                                                <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2 text-[11px] font-semibold text-emerald-400">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    <span>Your Invite • Waiting for Challenger</span>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={isJoiningLobbyId === invite.lobbyId}
                                                    onClick={() => handleJoinInvite(invite.lobbyId, invite.hasPassword, invite)}
                                                    className="w-full flex items-center justify-center gap-2 rounded-xl py-2 px-4 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/40 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                                                >
                                                    {isJoiningLobbyId === invite.lobbyId ? (
                                                        <>
                                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            <span>Joining Lobby #{invite.lobbyId}...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>⚡ Join Match</span>
                                                            <span className="text-[10px] opacity-80">#{invite.lobbyId}</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1 px-1">
                                            <span
                                                className={`text-[10px] font-semibold ${isSelf ? "text-emerald-400" : "text-cyan-400"
                                                    }`}
                                            >
                                                {isSelf ? "You" : msg.username}
                                            </span>

                                            {/* Challenge button next to other player's username in Global Chat */}
                                            {!isSelf && activeChannel === "global" && onChallengePlayer && (
                                                <button
                                                    type="button"
                                                    onClick={() => onChallengePlayer(msg.username)}
                                                    className="flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 hover:text-white transition-all cursor-pointer"
                                                    title={`Invite ${msg.username} to play`}
                                                >
                                                    <span>⚔️</span>
                                                    <span>Challenge</span>
                                                </button>
                                            )}

                                            <span className="text-[9px] text-slate-500">
                                                {formatTime(msg.postedAt)}
                                            </span>
                                        </div>
                                        <div
                                            className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed max-w-[85%] break-words shadow-sm ${isSelf
                                                    ? "bg-emerald-600/30 border border-emerald-500/40 text-emerald-100 rounded-tr-none"
                                                    : "bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-none"
                                                }`}
                                        >
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Inline Password Unlock Modal for Protected Invites */}
                {passwordModalInvite && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
                        <div className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
                            <div className="flex items-center gap-2.5 mb-3">
                                <span className="text-2xl">🔒</span>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Private Lobby #{passwordModalInvite.lobbyId}</h4>
                                    <p className="text-[11px] text-slate-400">Enter password to accept challenge</p>
                                </div>
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); void handleConfirmPasswordJoin(); }}>
                                <input
                                    type="password"
                                    autoFocus
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Enter lobby password..."
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors mb-3"
                                />
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPasswordModalInvite(null);
                                            setPasswordInput("");
                                        }}
                                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!passwordInput.trim() || isJoiningLobbyId !== null}
                                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                                    >
                                        {isJoiningLobbyId ? "Joining..." : "Join Room"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Footer Input Area */}
                <div className="relative z-10 border-t border-slate-700/50 bg-slate-950/50 backdrop-blur-md p-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void handleSend();
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder={
                                activeChannel === "global"
                                    ? "Type a global message..."
                                    : currentScreen === "in_game"
                                        ? "Type to match opponent..."
                                        : "Type to lobby players..."
                            }
                            disabled={isSending}
                            className="flex-1 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500/60 transition-colors backdrop-blur-sm disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!messageInput.trim() || isSending}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
                            title="Send"
                        >
                            {isSending ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-3.5 w-3.5"
                                >
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            )}
                        </button>
                    </form>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400/80 px-0.5">
                        <span>
                            Channel:{" "}
                            <span className="font-semibold text-emerald-400 capitalize">
                                {activeChannel}
                            </span>
                        </span>
                        <span>
                            Chat as <span className="text-slate-300 font-medium">{playerName}</span>
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
}
