import * as signalR from '@microsoft/signalr'

import {
    GameStateDto,
    MoveResultDto,
    CreateLobbyDto,
    JoinLobbyDto,
    StartGameDto,
    MakeMoveDto,
    PlayerColor
} from "../types/othello"
import { useEffect, useState } from 'react'
import { getLobby } from './api'

const HUB_URL = import.meta.env.VITE_HUB_URL || "/othello/hub";

export function useOthelloSignalR() {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    // Game data from server
    const [gameState, setGameState] = useState<GameStateDto | null>(null);
    const [lastMove, setLastMove] = useState<MoveResultDto | null>(null);
    const [gameOverResult, setGameOverResult] = useState<string | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

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
            setMessages((prev) => [...prev, msg]);
        });

        const connect = async () => {
            if (newConnection.state === signalR.HubConnectionState.Disconnected) {
                try {
                    await newConnection.start();

                    if (isMounted) {
                        console.log("Connected to SignalR Hub")
                        setIsConnected(true);
                        setError(null);
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
            if (newConnection.state === signalR.HubConnectionState.Disconnected) {
                console.log("Reconnecting to Hub...")
                connect();
            }
        }, 3000);


        setConnection(newConnection)

        return () => {
            isMounted = false;
            if (retryTimer) clearInterval(retryTimer); // Stop timer
            if (newConnection.state === signalR.HubConnectionState.Connected) {
                newConnection.stop();
            }
        };
    }, []);

    // 1. Create a lobby (returns { id, name } on success)
    const createLobby = async (
        lobbyName: string,
        isPublic: boolean,
        playerName: string,
        isAiGame: boolean = false
    ): Promise<{ id: number; name: string } | null> => {
        if (!connection) throw new Error("Not connected to server");
        const dto: CreateLobbyDto = {
            player: {
                name: playerName
            },
            name: lobbyName,
            isPublic: isPublic,
            isAiGame: isAiGame
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
    const joinLobby = async (lobbyId: number, playerName: string) => {
        if (!connection) return;
        const dto: JoinLobbyDto = {
            lobbyId,
            player: { name: playerName },
        };
        await connection.invoke("JoinLobby", dto);
    };

    // 3. Leave a lobby
    const leaveLobby = async (lobbyId: number, playerName: string) => {
        if (!connection) return;
        setLastMove(null);
        setGameOverResult(null);
        await connection.invoke("LeaveLobby", {
            lobbyId,
            playerUsername: playerName
        });
    };

    // 4. Start the game
    const startGame = async (lobbyId: number, playerName: string) => {
        if (!connection) return;
        setLastMove(null);
        setGameOverResult(null);
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

    return {
        isConnected,
        gameState,
        lastMove,
        gameOverResult,
        messages,
        error,
        clearError: () => setError(null),
        createLobby,
        joinLobby,
        leaveLobby,
        startGame,
        makeMove
    }
}
