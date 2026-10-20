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

const HUB_URL = import.meta.env.VITE_HUB_URL || "http://localhost:5057/othello/hub";

export function useOthelloSignalR() {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    // Game data from server
    const [gameState, setGameState] = useState<GameStateDto | null>(null);
    const [lastMove, setLastMove] = useState<MoveResultDto | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Build connection
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL!)
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build()

        // Register server event listener
        newConnection.on("ReceiveGameState", (state: GameStateDto) => {
            setGameState(state);
        })

        newConnection.on("MovePlayed", (move: MoveResultDto) => {
            setLastMove(move);
        });

        newConnection.on("TurnSkipped", (skippedColor: PlayerColor) => {
            setMessages((prev) => [...prev, `Turn skipped for ${skippedColor}`])
        })

        newConnection.on("GameOver", (result: string, blackScore: number, whiteScore: number) => {
            setMessages((prev) =>
                [
                    ...prev,
                    `Game Over! Winner ${result} (${blackScore}) - (${whiteScore})`
                ]
            )
        });

        newConnection.on("ErrorMessage", (error: string) => {
            setError(error)
        })

        // Start connection
        newConnection
            .start()
            .then(() => {
                console.log("Connected to SignalR Hub")
                setIsConnected(true);
            })
            .catch((err) => {
                console.error("SignalR Connection Error: ", err)
            })

            setConnection(newConnection)

        return () => {
            newConnection.stop();
        }
    }, [])

    const createLobby = async (lobbyName: string, isPublic: boolean, playerName: string) => {
        if (!connection) return;
        const dto: CreateLobbyDto = {
            player: {
                name: playerName
            },
            name: lobbyName,
            isPublic: isPublic
        };

        await connection.invoke("CreateLobby", dto);
    }

    // 2. Join a lobby
    const joinLobby = async (lobbyId: number, playerName: string) => {
        if (!connection) return;
        const dto: JoinLobbyDto = {
            lobbyId,
            player: { name: playerName },
        };
        await connection.invoke("JoinLobby", dto);
    };

    // 3. Start the game
    const startGame = async (lobbyId: number, playerName: string) => {
        if (!connection) return;
        const dto: StartGameDto = {
            lobbyId,
            playerUsername: playerName,
        };
        await connection.invoke("StartGame", dto);
    };
    
    // 4. Play a move
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

    return{
        isConnected,
        gameState,
        lastMove,
        messages,
        error,
        clearError: () => setError(null),
        createLobby,
        joinLobby,
        startGame,
        makeMove
    }
}
