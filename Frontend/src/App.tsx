import { useOthelloSignalR } from "./services/signal_r"
import { CreateLobbyDto } from "./types/othello";
import { GetLobbyDetailsDto } from "./dtos/lobby_dto"
import { useState } from "react";


function App() {
  const { isConnected, gameState, messages, error } = useOthelloSignalR();
  const { createLobby } = useOthelloSignalR();
  const [lobbies, setLobbies] = useState<GetLobbyDetailsDto[] | null>(null);

  async function handleClick() {
    const dto: CreateLobbyDto = {
      name: "My lobby",
      player: {
        name: "Joko"
      },
      isPublic: true
    }
    await createLobby(dto.name, dto.isPublic, dto.player.name)
  }

  async function getLobbies() {
    const url = "http://localhost:5057/api/lobby"

    try {
      const response = await fetch(url);
      const data: GetLobbyDetailsDto[] = await response.json();

      console.log("Lobbies: ", data)
      setLobbies(data)
    }
    catch (error: any) {
      console.error("Fetch error:", error.messages)
    }
  }

  return (
    <div className="flex flex-col">
      <h1>Othello Game</h1>
      <p>Status: {isConnected ? "🟢 Connected to Hub" : "🔴 Disconnected"}</p>
      <div className="flex flex-row">
        <button className="w-200 h-400px bg-amber-100" onClick={handleClick}>CreateLobby</button>
        <button className="w-200 h-400px bg-green-200" onClick={getLobbies}>Get all Lobby</button>
      </div>
      <p className="font-bold">Lobbies:</p>
      <ul className="list-disc pl-5">
        {lobbies && lobbies.length === 0 && <p className="text-gray-500">No active lobbies found.</p>}
        {lobbies?.map((value) => (
          <li key={value.name}>
            {value.name} (Created by: {value.createdBy} - {value.playersCount}/{value.maxPlayers})
          </li>
        ))}
      </ul>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  )
}

export default App
