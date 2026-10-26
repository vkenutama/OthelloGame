import { useOthelloSignalR } from "./services/signal_r"
import { GetLobbyDetailsDto } from "./dtos/lobby_dto"
import { ActiveLobbyInfo, formatLobbyInvite, parseLobbyInvite, LobbyInvitePayload } from "./types/othello"
import { useEffect, useState, useCallback, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { DisconnectedModal } from "./components/DisconnectedModal";
import { ModeSelection } from "./components/ModeSelection";
import { LobbyBrowser } from "./components/lobby/LobbyBrowser";
import { CreateLobbyModal } from "./components/lobby/CreateLobbyModal";
import { LobbyRoom } from "./components/lobby/LobbyRoom";
import { MatchView } from "./components/game/MatchView";
import { BackgroundEffects } from "./components/BackgroundEffects";
import { getLobby, getLobbyById } from "./services/api"
import { ChatSidebar } from "./components/chat/ChatSidebar";
import { ChallengeNotificationPopup } from "./components/notifications/ChallengeNotificationPopup";
import { LobbyAlertPopup, LobbyAlertInfo } from "./components/notifications/LobbyAlertPopup";

export type ViewMode = "menu" | "ai" | "online" | "lobby" | "in_game";

function App() {
  const {
    isConnected,
    gameState,
    lastMove,
    gameOverResult,
    messages,
    chatMessages,
    createLobby,
    joinLobby,
    leaveLobby,
    startGame,
    makeMove,
    postChat
  } = useOthelloSignalR();

  const [lobbies, setLobbies] = useState<GetLobbyDetailsDto[] | null>(null);
  const [playerName, setPlayerName] = useState<string>(() => {
    // Use sessionStorage so each tab maintains an independent player identity
    const saved = sessionStorage.getItem("othello_player_name");
    if (saved) return saved;

    const randomName = `Player_${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem("othello_player_name", randomName);
    return randomName;
  });

  const [viewMode, setViewMode] = useState<ViewMode>("menu");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentLobby, setCurrentLobby] = useState<ActiveLobbyInfo | null>(null);
  const [isStartingAi, setIsStartingAi] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Lobby error/status alert popup state
  const [lobbyAlert, setLobbyAlert] = useState<LobbyAlertInfo | null>(null);

  // Direct Match Challenge notification state
  const [incomingChallenge, setIncomingChallenge] = useState<LobbyInvitePayload | null>(null);
  const [sentChallengeNotice, setSentChallengeNotice] = useState<{ targetUser: string; lobbyId: number } | null>(null);
  const lastHandledChatIdRef = useRef<string | null>(null);

  // Monitor incoming chat messages for direct challenges targeted to this player
  useEffect(() => {
    if (chatMessages.length === 0) return;
    const latest = chatMessages[chatMessages.length - 1];
    if (!latest || latest.id === lastHandledChatIdRef.current) return;
    lastHandledChatIdRef.current = latest.id;

    const invite = parseLobbyInvite(latest.message);
    if (invite && invite.targetUser) {
      const isTargetedToMe = invite.targetUser.toLowerCase() === playerName.toLowerCase();
      if (isTargetedToMe) {
        // Do not pop up challenge if already joined in this exact lobby
        if (!currentLobby || currentLobby.id !== invite.lobbyId) {
          setIncomingChallenge(invite);
        }
      }
    }
  }, [chatMessages, playerName, currentLobby]);

  // Auto-clear incoming challenge if user has joined that lobby or game started
  useEffect(() => {
    if (incomingChallenge && (currentLobby?.id === incomingChallenge.lobbyId || viewMode === "in_game")) {
      setIncomingChallenge(null);
    }
  }, [incomingChallenge, currentLobby, viewMode]);

  // Auto-clear sent challenge notice when opponent joins lobby or after timeout
  useEffect(() => {
    if (!sentChallengeNotice) return;
    if (currentLobby && currentLobby.playersCount >= 2) {
      setSentChallengeNotice(null);
      return;
    }
    const timer = setTimeout(() => {
      setSentChallengeNotice(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [sentChallengeNotice, currentLobby]);

  const handleNameChange = (newName: string) => {
    const trimmed = newName.trim();
    if (trimmed) {
      setPlayerName(trimmed);
      sessionStorage.setItem("othello_player_name", trimmed);
    }
  };

  const refreshLobbies = useCallback(async () => {
    try {
      const data = await getLobby();
      if (data !== null) {
        setLobbies(data);
      }
      return data;
    } catch (err) {
      console.warn("Failed to refresh lobbies:", err);
      return null;
    }
  }, []);

  // Fetch lobbies when viewing the online lobby browser
  useEffect(() => {
    if (viewMode === "online") {
      refreshLobbies();
    }
  }, [viewMode, refreshLobbies]);

  // If a game state arrives while in lobby waiting room or AI mode, transition automatically to in_game
  useEffect(() => {
    if (gameState && !gameState.isGameOver && (viewMode === "lobby" || viewMode === "ai")) {
      setViewMode("in_game");
    }
  }, [gameState, viewMode]);

  // Real-time synchronization when players join or leave the room
  useEffect(() => {
    if (!currentLobby || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // 1. Player joined broadcast
    // Backend format: $"Player {dto.Player.Name} joined lobby {lobby.Name}!"
    const joinMatch = lastMessage.match(/Player (.*) joined lobby/i);
    if (joinMatch) {
      const joinedName = joinMatch[1].trim();
      setCurrentLobby((prev) => {
        if (!prev) return null;
        const isCurrentPlayerHost = prev.createdBy.toLowerCase() === playerName.toLowerCase();
        return {
          ...prev,
          playersCount: 2,
          guestName: isCurrentPlayerHost ? joinedName : prev.guestName,
        };
      });
      refreshLobbies();
      return;
    }

    // 2. Player left broadcast
    // Backend format: $"{player.Name} left the lobby"
    const leaveMatch = lastMessage.match(/(.*) left the lobby/i);
    if (leaveMatch) {
      const leaverName = leaveMatch[1].trim();
      setCurrentLobby((prev) => {
        if (!prev) return null;

        // If the HOST left: Host exchange! (Handled by backend in Lobby.cs)
        // The remaining player (which is playerName) becomes the new Host!
        if (leaverName.toLowerCase() === prev.createdBy.toLowerCase()) {
          return {
            ...prev,
            createdBy: playerName, // promoted to host!
            guestName: null,      // remove guest display
            playersCount: 1,      // now only 1 player in room
          };
        }

        // If the GUEST left:
        return {
          ...prev,
          guestName: null,        // remove guest display!
          playersCount: 1,        // now only 1 player in room
        };
      });
      refreshLobbies();
      return;
    }

    // 3. Host transferred broadcast
    // Backend format: $"Host is now {lobby.CreatedBy.Name}"
    const hostMatch = lastMessage.match(/Host is now (.*)/i);
    if (hostMatch) {
      const newHost = hostMatch[1].trim();
      setCurrentLobby((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          createdBy: newHost,
          guestName: prev.guestName?.toLowerCase() === newHost.toLowerCase() ? null : prev.guestName,
          playersCount: 1,
        };
      });
      refreshLobbies();
      return;
    }

    // 4. Room deleted broadcast
    if (lastMessage.toLowerCase().includes("lobby deleted")) {
      setCurrentLobby(null);
      setViewMode("online");
      refreshLobbies();
    }
  }, [messages, playerName, currentLobby, refreshLobbies]);



  // 1. Handle Lobby Creation
  const handleCreateLobby = async (name: string, isPublic: boolean, password?: string) => {
    const result = await createLobby(name, isPublic, playerName, false, password);
    if (result) {
      setCurrentLobby({
        id: result.id,
        name: result.name,
        createdBy: playerName,
        isPublic,
        hasPassword: Boolean(password && password.trim().length > 0),
        playersCount: 1,
        guestName: null,
      });
      setIsCreateModalOpen(false);
      setViewMode("lobby");
      refreshLobbies();
    } else {
      throw new Error("Failed to create room. Please try again.");
    }
  };

  // 2. Handle Joining a Lobby
  const handleJoinLobby = async (lobby: GetLobbyDetailsDto, password?: string) => {
    try {
      // Pre-check if lobby exists and is open
      const latestLobby = await getLobbyById(lobby.id);
      if (!latestLobby) {
        throw new Error(`Lobby "${lobby.name}" (#${lobby.id}) does not exist or has already been closed.`);
      }

      if (latestLobby.playersCount >= 2) {
        throw new Error(`Lobby #${lobby.id} is already full.`);
      }

      await joinLobby(lobby.id, playerName, password);

      setCurrentLobby({
        id: lobby.id,
        name: latestLobby.name || lobby.name,
        createdBy: latestLobby.createdBy || lobby.createdBy,
        isPublic: lobby.isPublic,
        hasPassword: lobby.hasPassword,
        playersCount: latestLobby.playersCount + 1,
        guestName: playerName,
      });
      setViewMode("lobby");
      refreshLobbies();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to join lobby";
      const isNotExist =
        errorMsg.toLowerCase().includes("not found") ||
        errorMsg.toLowerCase().includes("not exist") ||
        errorMsg.toLowerCase().includes("closed") ||
        errorMsg.toLowerCase().includes("no longer active");

      setLobbyAlert({
        id: lobby.id,
        title: isNotExist ? "Lobby Does Not Exist" : "Unable to Join Room",
        message: isNotExist
          ? `Lobby "${lobby.name}" (#${lobby.id}) does not exist or has already been closed by the host.`
          : errorMsg,
        type: "error",
      });

      refreshLobbies();
      throw err;
    }
  };

  // 2b. Handle Joining by Lobby ID
  const handleJoinById = async (lobbyId: number, password?: string) => {
    try {
      const lobby = await getLobbyById(lobbyId);
      if (!lobby) {
        throw new Error(`Lobby #${lobbyId} does not exist or has already been closed.`);
      }

      if (lobby.playersCount >= lobby.maxPlayers) {
        throw new Error(`Lobby #${lobbyId} is already full.`);
      }

      await joinLobby(lobbyId, playerName, password);

      setCurrentLobby({
        id: lobby.id,
        name: lobby.name,
        createdBy: lobby.createdBy,
        isPublic: lobby.isPublic,
        hasPassword: lobby.hasPassword,
        playersCount: lobby.playersCount + 1,
        guestName: playerName,
      });
      setViewMode("lobby");
      refreshLobbies();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to join lobby";
      const isNotExist =
        errorMsg.toLowerCase().includes("not found") ||
        errorMsg.toLowerCase().includes("not exist") ||
        errorMsg.toLowerCase().includes("closed") ||
        errorMsg.toLowerCase().includes("no longer active");

      setLobbyAlert({
        id: lobbyId,
        title: isNotExist ? "Lobby Does Not Exist" : "Unable to Join Room",
        message: isNotExist
          ? `Lobby #${lobbyId} does not exist or has already been closed by the host.`
          : errorMsg,
        type: "error",
      });

      refreshLobbies();
      throw err;
    }
  };

  // 2c. Handle Joining from Chat Invite
  const handleJoinLobbyFromChat = async (lobbyId: number, password?: string) => {
    // If currently host of an empty lobby, clean up before joining the target lobby
    if (currentLobby && currentLobby.id !== lobbyId) {
      try {
        await leaveLobby(currentLobby.id, playerName);
      } catch (err) {
        console.warn("Could not leave previous lobby", err);
      }
      setCurrentLobby(null);
    }
    await handleJoinById(lobbyId, password);
  };

  // 2d. Handle Challenging a Player from Chat
  const handleChallengePlayer = async (targetUsername: string) => {
    // If already in a lobby as host, send direct challenge to target
    if (currentLobby && currentLobby.createdBy.toLowerCase() === playerName.toLowerCase()) {
      const inviteMsg = formatLobbyInvite(
        currentLobby.id,
        currentLobby.name,
        playerName,
        targetUsername,
        currentLobby.hasPassword
      );
      await postChat(playerName, inviteMsg, false, null);
      setSentChallengeNotice({ targetUser: targetUsername, lobbyId: currentLobby.id });
      return;
    }

    // If currently in another lobby, leave it first
    if (currentLobby) {
      try {
        await leaveLobby(currentLobby.id, playerName);
      } catch (err) {
        console.warn("Could not leave previous lobby", err);
      }
      setCurrentLobby(null);
    }

    // Auto-create a lobby for the challenge
    const roomName = `${playerName} vs ${targetUsername}`;
    const result = await createLobby(roomName, true, playerName, false);
    if (result) {
      setCurrentLobby({
        id: result.id,
        name: result.name,
        createdBy: playerName,
        isPublic: true,
        hasPassword: false,
        playersCount: 1,
        guestName: null,
      });
      setViewMode("lobby");
      refreshLobbies();

      const inviteMsg = formatLobbyInvite(result.id, result.name, playerName, targetUsername, false);
      await postChat(playerName, inviteMsg, false, null);
      setSentChallengeNotice({ targetUser: targetUsername, lobbyId: result.id });
    }
  };

  // 2d-2. Handle Accepting Incoming Direct Challenge
  const handleAcceptChallenge = async (lobbyId: number, password?: string) => {
    await handleJoinLobbyFromChat(lobbyId, password);
    setIncomingChallenge(null);
  };

  // 2d-3. Handle Declining Incoming Direct Challenge
  const handleDeclineChallenge = () => {
    setIncomingChallenge(null);
  };

  // 2e. Handle Broadcasting Lobby to Chat (from Lobby Room)
  const handleInviteViaChat = async () => {
    if (!currentLobby) return;
    const inviteMsg = formatLobbyInvite(
      currentLobby.id,
      currentLobby.name,
      playerName,
      null,
      currentLobby.hasPassword
    );
    await postChat(playerName, inviteMsg, false, null);
    setIsChatOpen(true);
  };

  // 3. Handle Leaving Lobby
  const handleLeaveLobby = async () => {
    if (currentLobby) {
      await leaveLobby(currentLobby.id, playerName);
      setCurrentLobby(null);
    }
    setViewMode("online");
    refreshLobbies();
  };

  // 4. Handle Starting Game
  const handleStartGame = async (lobbyId: number) => {
    await startGame(lobbyId, playerName);
  };

  // 4b. Handle Starting AI Match
  const handleStartAiGame = async () => {
    if (isStartingAi) return;
    try {
      setIsStartingAi(true);

      // Clean up previous lobby if any
      if (currentLobby) {
        try {
          await leaveLobby(currentLobby.id, playerName);
        } catch (e) {
          console.warn("Could not leave previous lobby", e);
        }
      }

      // Create AI Lobby
      const lobbyName = `vs AI (${playerName})`;
      const lobby = await createLobby(lobbyName, false, playerName, true);
      
      if (lobby && typeof lobby.id === "number") {
        setCurrentLobby({
          id: lobby.id,
          name: lobby.name,
          createdBy: playerName,
          playersCount: 2,
          isPublic: false,
          guestName: "Greedy AI",
        });

        // Start match and enter game view
        await handleStartGame(lobby.id);
        setViewMode("in_game");
      }
    } catch (err) {
      console.error("Failed to start AI game:", err);
    } finally {
      setIsStartingAi(false);
    }
  };

  // 5. Handle Playing a Move
  const handleMakeMove = async (row: number, col: number) => {
    const activeLobbyId = currentLobby?.id || (gameState ? parseInt(gameState.gameId, 10) : 0);
    await makeMove(activeLobbyId, playerName, row, col);
  };

  // 6. Handle Leaving Match
  const handleLeaveMatch = async () => {
    const isAi = currentLobby?.guestName === "Greedy AI" || gameState?.whitePlayerName === "Greedy AI" || gameState?.blackPlayerName === "Greedy AI";
    if (currentLobby) {
      await leaveLobby(currentLobby.id, playerName);
      setCurrentLobby(null);
    }
    setViewMode(isAi ? "menu" : "online");
    refreshLobbies();
  };

  // 5. Handle Mode Selection from Main Menu
  const handleSelectMode = (mode: "ai" | "online") => {
    setViewMode(mode);
    if (mode === "online") {
      refreshLobbies();
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <BackgroundEffects />

      <DisconnectedModal isConnected={isConnected} />

      {/* Navbar */}
      <Navbar
        isConnected={isConnected}
        playerName={playerName}
        onPlayerNameChange={handleNameChange}
        toHomeScreen={setViewMode}
        currentScreen={viewMode}
      />

      <main className="relative z-10">
        {/* 1. Main Menu Mode Selection */}
        {viewMode === "menu" && (
          <ModeSelection
            onSelectMode={handleSelectMode}
            onlinePlayerCount={lobbies?.reduce((acc, l) => acc + l.playersCount, 0)}
          />
        )}

        {/* 2. Play Online Lobby Browser Screen */}
        {viewMode === "online" && (
          <div className="mx-auto max-w-7xl p-6">
            <button
              onClick={() => setViewMode("menu")}
              className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Main Menu
            </button>
            <LobbyBrowser
              lobbies={lobbies}
              onCreateLobbyClick={() => setIsCreateModalOpen(true)}
              onJoinLobby={handleJoinLobby}
              onJoinById={handleJoinById}
              onRefresh={refreshLobbies}
            />
          </div>
        )}

        {/* 3. Lobby Waiting Room View */}
        {viewMode === "lobby" && currentLobby && (
          <LobbyRoom
            lobby={currentLobby}
            currentPlayerName={playerName}
            messages={messages}
            onLeaveLobby={handleLeaveLobby}
            onStartGame={handleStartGame}
            onInviteViaChat={() => void handleInviteViaChat()}
          />
        )}

        {/* 4. AI Setup Screen */}
        {viewMode === "ai" && (
          <div className="mx-auto max-w-7xl p-6">
            <button
              onClick={() => setViewMode("menu")}
              className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to Main Menu
            </button>
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center max-w-lg mx-auto shadow-2xl backdrop-blur-xl">
              {/* Subtle Ambient Background Corner Accent */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-4xl shadow-inner">
                🤖
              </div>

              <h2 className="text-2xl font-black text-white">AI Singleplayer Mode</h2>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Battle against our tactical Greedy AI engine. Colors are randomly assigned, and moves are processed instantaneously.
              </p>

              {/* Matchup Details Pill */}
              <div className="my-6 grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs">
                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-[11px] font-medium">Player</span>
                  <span className="font-bold text-white mt-0.5 truncate max-w-[120px]">{playerName}</span>
                </div>
                <div className="flex flex-col items-center border-l border-slate-800">
                  <span className="text-slate-400 text-[11px] font-medium">Opponent</span>
                  <span className="font-bold text-cyan-400 mt-0.5">Greedy AI 🤖</span>
                </div>
              </div>

              {/* Play Game Button */}
              <button
                onClick={handleStartAiGame}
                disabled={isStartingAi}
                className="group relative overflow-hidden w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3.5 font-bold text-white shadow-xl shadow-cyan-950/40 transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/25 hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {/* 🌀 Continuous Infinite Particle Stream */}
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="absolute left-6 bottom-0 h-3.5 w-3.5 rounded-full border border-cyan-200/80 bg-cyan-300/30 animate-particle-1" />
                  <svg className="absolute left-1/4 bottom-0 h-3.5 w-3.5 text-blue-200/80 fill-current animate-particle-2" viewBox="0 0 24 24">
                    <polygon points="12 2, 22 22, 2 22" />
                  </svg>
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-2.5 w-2.5 border border-white/90 bg-cyan-200/40 animate-particle-3" />
                  <svg className="absolute right-1/4 bottom-0 h-4 w-4 text-cyan-100/80 fill-none stroke-current stroke-2 animate-particle-4" viewBox="0 0 24 24">
                    <polygon points="12 2, 22 22, 2 22" />
                  </svg>
                  <span className="absolute right-6 bottom-0 h-2.5 w-2.5 rounded-full bg-blue-100/80 shadow-sm shadow-blue-200 animate-particle-5" />
                </div>

                {/* Button Text & Loading Spinner */}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isStartingAi ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Starting Match...</span>
                    </>
                  ) : (
                    <>
                      <span>Play Game!</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 5. In-Game Board Screen */}
        {viewMode === "in_game" && (
          gameState ? (
            <MatchView
              gameState={gameState}
              lobbyId={currentLobby?.id || parseInt(gameState.gameId, 10) || 0}
              currentPlayerName={playerName}
              messages={messages}
              lastMove={lastMove}
              gameOverResult={gameOverResult}
              onMakeMove={handleMakeMove}
              onLeaveMatch={handleLeaveMatch}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4" />
              <h3 className="text-lg font-bold text-white">Initializing Game Session...</h3>
              <p className="text-xs text-slate-400 mt-1">Negotiating board matrix and player pieces with server.</p>
            </div>
          )
        )}
      </main>

      {/* Direct Match Challenge Incoming Notification Popup */}
      {incomingChallenge && (
        <ChallengeNotificationPopup
          invite={incomingChallenge}
          onAccept={handleAcceptChallenge}
          onDecline={handleDeclineChallenge}
        />
      )}

      {/* Lobby Not Found / Error Alert Notification Popup */}
      {lobbyAlert && (
        <LobbyAlertPopup
          alert={lobbyAlert}
          onClose={() => setLobbyAlert(null)}
        />
      )}

      {/* Challenger Sent Notification Toast */}
      {sentChallengeNotice && (
        <aside
          aria-label="Direct challenge status notification"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/50 bg-slate-900/95 px-5 py-3 text-sm text-emerald-300 shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-emerald-500/30"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-base shadow-sm">
            ⚔️
          </span>
          <div>
            <p className="font-bold text-white text-xs">Direct Challenge Sent!</p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Waiting for <span className="font-bold text-emerald-400">@{sentChallengeNotice.targetUser}</span> to accept...
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSentChallengeNotice(null)}
            className="ml-2 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Dismiss"
          >
            ✕
          </button>
        </aside>
      )}

      {/* Create Lobby Modal Popup */}
      <CreateLobbyModal
        isOpen={isCreateModalOpen}
        playerName={playerName}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateLobby}
      />

      <ChatSidebar
        playerName={playerName}
        currentScreen={viewMode}
        messages={chatMessages}
        currentLobbyId={currentLobby?.id ?? (gameState ? parseInt(gameState.gameId, 10) || null : null)}
        isAiGame={
          currentLobby?.guestName === "Greedy AI" ||
          gameState?.whitePlayerName === "Greedy AI" ||
          gameState?.blackPlayerName === "Greedy AI" ||
          viewMode === "ai"
        }
        isOpenControlled={isChatOpen}
        onToggleOpen={setIsChatOpen}
        onJoinLobbyFromChat={handleJoinLobbyFromChat}
        onChallengePlayer={handleChallengePlayer}
        onSendMessage={async (msg, channel) => {
          const activeLobbyId = currentLobby?.id ?? (gameState ? parseInt(gameState.gameId, 10) || null : null);
          await postChat(playerName, msg, channel === "lobby", activeLobbyId);
        }}
      />
    </div>
  );
}

export default App;
