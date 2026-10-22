import { useOthelloSignalR } from "./services/signal_r"
import { GetLobbyDetailsDto } from "./dtos/lobby_dto"
import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { DisconnectedModal } from "./components/DisconnectedModal";
import { ModeSelection } from "./components/ModeSelection";
import { LobbyBrowser } from "./components/lobby/LobbyBrowser";
import { getLobby } from "./services/api"

type ViewMode = "menu" | "ai" | "online" | "in_game"

function App() {
  const { isConnected, gameState, messages, error, createLobby } = useOthelloSignalR();
  const [lobbies, setLobbies] = useState<GetLobbyDetailsDto[] | null>(null);
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem("othello_player_name") || "Guest"
  });

  const [viewMode, setViewMode] = useState<ViewMode>("menu");


  const handleNameChange = (newName: string) => {
    const trimmed = newName.trim();
    if (trimmed) {
      setPlayerName(trimmed)
      localStorage.setItem("othello_player_name", trimmed)
    }
  }

  useEffect(() => {
    getLobby().then((data) => {
      if (data) setLobbies(data);
    })
  }, [])


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      <DisconnectedModal isConnected={isConnected} />

      {/* Navbar */}
      <Navbar
        isConnected={isConnected}
        playerName={playerName}
        onPlayerNameChange={handleNameChange}
      />

      <main>
        {viewMode === "menu" && (
          <ModeSelection onSelectMode={(mode) => setViewMode(mode)} />
        )}

        {/* 2. Play Online Lobby Screen */}
        {viewMode === "online" && (
          <div className="mx-auto max-w-7xl p-6">
            <button
              onClick={() => setViewMode("menu")}
              className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Main Menu
            </button>
            {/* (Your Lobby Creator & Active Lobbies will be placed here) */}
            <LobbyBrowser lobbies={lobbies} />
          </div>
        )}

        {/* 3. AI Setup Screen */}
        {viewMode === "ai" && (
          <div className="mx-auto max-w-7xl p-6">
            <button
              onClick={() => setViewMode("menu")}
              className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Main Menu
            </button>
            <h2 className="text-xl font-bold">AI Match Setup</h2>
          </div>
        )}
      </main>

      {/* <button
        className="bg-amber-100 text-black p-2 rounded-xl text-sm"
        onClick={() => {
          createLobby(`${playerName}'s Lobby`, true, playerName)
        }}>
        Click me
      </button> */}

      {/* Main Content */}
    </div>
  );
}

export default App
