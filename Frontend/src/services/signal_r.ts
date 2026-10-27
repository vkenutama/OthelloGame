import * as signalR from '@microsoft/signalr'

import {
    GameStateDto,
    MoveResultDto,
    CreateLobbyDto,
    JoinLobbyDto,
    StartGameDto,
    MakeMoveDto,
    PlayerColor,
    OpponentDisconnectionInfo
} from "../types/othello"
import { useEffect, useState } from 'react'
import { getLobby, getLobbyByPlayerUsername } from './api'
import { SendChatDto, ReceiveChatDto, ChatMessageItem } from '../dtos/chat_dto';

const HUB_URL = import.meta.env.VITE_HUB_URL || "/othello/hub";

export function useOthelloSignalR() {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    // Game data from server
    const [gameState, setGameState] = useState<GameStateDto | null>(null);
    const [lastMove, setLastMove] = useState<MoveResultDto | null>(null);
    const [gameOverResult, setGameOverResult] = useState<string | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [onlinePlayerCount, setOnlinePlayerCount] = useState<number>(0);
    const [opponentDisconnection, setOpponentDisconnection] = useState<OpponentDisconnectionInfo | null>(null);

    useEffect(() => {
        let isMounted = true;
        let retryTimer: ReturnType<typeof setInterval> | undefined;

        // Build connection
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL!)
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build()

        // Attach lifecycle listeners to sync isConnected State
        newConnection.onreconnecting(() => {
            if (isMounted) setIsConnected(false);
        })

        newConnection.onreconnected(() => {
            if (isMounted) {
                setIsConnected(true);
                setError(null);
                newConnection.invoke("GetOnlinePlayersCount").catch(() => {});
            }
        })

        newConnection.onclose(() => {
            if (isMounted) setIsConnected(false);
        })

        // Register server event listener
        newConnection.on("ReceiveGameState", (state: GameStateDto) => {
            setGameState((prev) => {
                if (prev && prev.gameId !== state.gameId) {
                    setLastMove(null);
                    setGameOverResult(null);
                }
                return state;
            });
        })

        newConnection.on("MovePlayed", (move: MoveResultDto) => {
            setLastMove(move);
        });

        newConnection.on("TurnSkipped", (skippedColor: PlayerColor) => {
            setMessages((prev) => [...prev, `Turn skipped for ${skippedColor}`])
        })

        newConnection.on("GameOver", (result: string, blackScore: number, whiteScore: number) => {
            setGameOverResult(result);
            setOpponentDisconnection(null);
            setMessages((prev) =>
                [
                    ...prev,
                    `Game Over! Winner ${result} (${blackScore}) - (${whiteScore})`
                ]
            )
        });

        newConnection.on("ErrorMessage", (err: string) => {
            setError(err)
        })

        newConnection.on("ReceiveBroadcast", (broadcast: string) => {
            setMessages((prev) => [...prev, broadcast]);
        });

        newConnection.on("LobbyDeleted", (msg: string) => {
            setOpponentDisconnection(null);
            setMessages((prev) => [...prev, msg]);
        });

        newConnection.on("OpponentDisconnected", (playerName: string, timeoutSeconds: number) => {
            setOpponentDisconnection({
                playerName,
                timeoutSeconds: timeoutSeconds || 30,
                startTime: Date.now()
            });
        });

        newConnection.on("OpponentReconnected", (_playerName: string) => {
            setOpponentDisconnection(null);
        });

        newConnection.on("OnlinePlayersCountChanged", (onlinePlayerCount: number) => {
            setOnlinePlayerCount(onlinePlayerCount)
        })

        newConnection.on("ReceiveChat", (raw: ReceiveChatDto) => {
            if (!isMounted) return;

            const rawId = raw.id ?? raw.Id;
            const message = raw.message ?? raw.Message ?? "";
            const username = raw.username ?? raw.Username ?? "Unknown";
            const rawDate = raw.postedAt ?? raw.PostedAt;
            const postedAt = rawDate ? new Date(rawDate) : new Date();
            const lobbyId = raw.lobbyId !== undefined ? raw.lobbyId : (raw.LobbyId !== undefined ? raw.LobbyId : null);

            const messageId = rawId || `${username}_${postedAt.getTime()}_${message}`;

            setChatMessages((prev) => {
                // 1. Exact ID deduplication
                if (prev.some((m) => m.id === messageId)) {
                    return prev;
                }

                // 2. Fallback deduplication: same user, message, and channel within 2 seconds
                const isDuplicateContent = prev.some(
                    (m) =>
                        m.username.toLowerCase() === username.toLowerCase() &&
                        m.message === message &&
                        m.lobbyId === lobbyId &&
                        Math.abs(new Date(m.postedAt).getTime() - postedAt.getTime()) < 2000
                );
                if (isDuplicateContent) {
                    return prev;
                }

                const newChat: ChatMessageItem = {
                    id: messageId,
                    message,
                    username,
                    postedAt,
                    lobbyId: lobbyId ?? null,
                };

                return [...prev, newChat];
            });
        });

        const connect = async () => {
            if (newConnection.state === signalR.HubConnectionState.Disconnected) {
                try {
                    await newConnection.start();

                    if (isMounted) {
                        console.log("Connected to SignalR Hub")
                        setIsConnected(true);
                        setError(null);
                        newConnection.invoke("GetOnlinePlayersCount").catch((err) => {
                            console.warn("Could not fetch online players count", err);
                        });
                    } else {
                        void newConnection.stop();
                    }
                } catch (err) {
                    if (isMounted) {
                        setIsConnected(false)
                        console.warn("Connection attempt failed, will retry in 5s", err)
                    }
                }

            }
        }

        connect();

        retryTimer = setInterval(() => {
            if (!isMounted) return;
            if (newConnection.state === signalR.HubConnectionState.Disconnected) {
                console.log("Reconnecting to Hub...")
                connect();
            }
        }, 3000);


        setConnection(newConnection)

        return () => {
            isMounted = false;
            if (retryTimer) clearInterval(retryTimer);

            // Detach listeners to prevent stale connections from firing callbacks
            newConnection.off("ReceiveGameState");
            newConnection.off("MovePlayed");
            newConnection.off("TurnSkipped");
            newConnection.off("GameOver");
            newConnection.off("ErrorMessage");
            newConnection.off("ReceiveBroadcast");
            newConnection.off("LobbyDeleted");
            newConnection.off("OpponentDisconnected");
            newConnection.off("OpponentReconnected");
            newConnection.off("ReceiveChat");

            if (newConnection.state !== signalR.HubConnectionState.Disconnected) {
                newConnection.stop().catch(() => { });
            }
        };
    }, []);

    // 1. Create a lobby (returns { id, name } on success)
    const createLobby = async (
        lobbyName: string,
        isPublic: boolean,
        playerName: string,
        isAiGame: boolean = false,
        password?: string
    ): Promise<{ id: number; name: string } | null> => {
        if (!connection) throw new Error("Not connected to server");
        const dto: CreateLobbyDto = {
            player: {
                name: playerName
            },
            name: lobbyName,
            isPublic: isPublic,
            isAiGame: isAiGame,
            password: password ? password.trim() : undefined
        };

        return new Promise(async (resolve, reject) => {
            let handled = false;

            const broadcastHandler = (msg: string) => {
                const match = msg.match(/Lobby (.*) created with ID (\d+)/i);
                if (match) {
                    handled = true;
                    cleanup();
                    resolve({
                        id: parseInt(match[2], 10),
                        name: match[1]
                    });
                }
            };

            const errorHandler = (err: string) => {
                handled = true;
                cleanup();
                reject(new Error(err));
            };

            const cleanup = () => {
                connection.off("ReceiveBroadcast", broadcastHandler);
                connection.off("ErrorMessage", errorHandler);
            };

            connection.on("ReceiveBroadcast", broadcastHandler);
            connection.on("ErrorMessage", errorHandler);

            try {
                await connection.invoke("CreateLobby", dto);

                // Fallback timeout in case the broadcast message string differs
                setTimeout(async () => {
                    if (!handled) {
                        cleanup();
                        try {
                            const list = await getLobby();
                            const found = list?.find(l => l.createdBy === playerName);
                            if (found) {
                                resolve({ id: found.id, name: found.name });
                            } else {
                                resolve(null);
                            }
                        } catch {
                            resolve(null);
                        }
                    }
                }, 1500);
            } catch (err) {
                cleanup();
                reject(err);
            }
        });
    };

    // 2. Join a lobby
    const joinLobby = async (lobbyId: number, playerName: string, password?: string): Promise<void> => {
        if (!connection) throw new Error("Not connected to server");
        const dto: JoinLobbyDto = {
            lobbyId,
            player: { name: playerName },
            password: password ? password.trim() : undefined,
        };

        return new Promise(async (resolve, reject) => {
            let handled = false;

            const broadcastHandler = (msg: string) => {
                if (msg.includes("joined lobby") || msg.includes("Reconnected to lobby")) {
                    handled = true;
                    cleanup();
                    resolve();
                }
            };

            const errorHandler = (err: string) => {
                handled = true;
                cleanup();
                reject(new Error(err));
            };

            const cleanup = () => {
                connection.off("ReceiveBroadcast", broadcastHandler);
                connection.off("ErrorMessage", errorHandler);
            };

            connection.on("ReceiveBroadcast", broadcastHandler);
            connection.on("ErrorMessage", errorHandler);

            try {
                await connection.invoke("JoinLobby", dto);

                setTimeout(() => {
                    if (!handled) {
                        cleanup();
                        resolve();
                    }
                }, 1500);
            } catch (err) {
                handled = true;
                cleanup();
                reject(err);
            }
        });
    };

    // 3. Leave a lobby
    const leaveLobby = async (lobbyId: number, playerName: string) => {
        if (!connection) return;
        setGameState(null);
        setLastMove(null);
        setGameOverResult(null);
        setOpponentDisconnection(null);
        setMessages([]);
        await connection.invoke("LeaveLobby", {
            lobbyId,
            playerUsername: playerName
        });
    };

    // 4. Start the game
    const startGame = async (lobbyId: number, playerName: string) => {
        if (!connection) return;
        setGameState(null);
        setLastMove(null);
        setGameOverResult(null);
        setOpponentDisconnection(null);
        setMessages([]);
        const dto: StartGameDto = {
            lobbyId,
            playerUsername: playerName,
        };
        await connection.invoke("StartGame", dto);
    };

    // 5. Play a move
    const makeMove = async (lobbyId: number, playerName: string, row: number, col: number) => {
        if (!connection) return;
        const dto: MakeMoveDto = {
            lobbyId,
            playerUsername: playerName,
            row,
            col,
        };
        await connection.invoke("MakeMove", dto);
    };

    const postChat = async (
        username: string,
        message: string,
        toLobbyChat: boolean,
        explicitLobbyId?: number | null
    ) => {
        if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;

        let targetLobbyId: number | null = null;
        if (toLobbyChat) {
            if (explicitLobbyId !== undefined && explicitLobbyId !== null) {
                targetLobbyId = explicitLobbyId;
            } else {
                const lobby = await getLobbyByPlayerUsername(username);
                if (lobby === null) {
                    console.warn("Could not find lobby for player to send lobby chat");
                    return;
                }
                dto_id: targetLobbyId = lobby.id;
            }
        }

        const dto: SendChatDto = {
            LobbyId: targetLobbyId,
            Username: username,
            Message: message,
        };

        try {
            await connection.invoke("PostChat", dto);
        } catch (err) {
            console.error("Failed to post chat message:", err);
        }
    };

    const getOnlinePlayersCount = async () => {
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
            try {
                await connection.invoke("GetOnlinePlayersCount");
            } catch (err) {
                console.warn("Failed to get online players count:", err);
            }
        }
    };

    return {
        isConnected,
        gameState,
        lastMove,
        gameOverResult,
        messages,
        chatMessages,
        error,
        onlinePlayerCount,
        opponentDisconnection,
        clearError: () => setError(null),
        clearGameState: () => {
            setGameState(null);
            setLastMove(null);
            setGameOverResult(null);
            setOpponentDisconnection(null);
            setMessages([]);
        },
        createLobby,
        joinLobby,
        leaveLobby,
        startGame,
        makeMove,
        postChat,
        getOnlinePlayersCount
    }
}
