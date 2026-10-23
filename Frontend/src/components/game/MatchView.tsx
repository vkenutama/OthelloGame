import { useState, useEffect } from "react";
import { GameStateDto, MoveResultDto, PlayerColor } from "../../types/othello";

interface MatchViewProps {
  gameState: GameStateDto;
  lobbyId: number;
  currentPlayerName: string;
  messages: string[];
  lastMove?: MoveResultDto | null;
  gameOverResult?: string | null;
  onMakeMove: (row: number, col: number) => Promise<void>;
  onLeaveMatch: () => void;
}

export function MatchView({
  gameState,
  currentPlayerName,
  messages,
  lastMove,
  gameOverResult,
  onMakeMove,
  onLeaveMatch,
}: MatchViewProps) {
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [hoveredMove, setHoveredMove] = useState<{ row: number; col: number } | null>(null);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  // Detect if game concluded due to forfeit / player leaving
  // ONLY true if explicit forfeit occurred in THIS game session
  const isForfeit = Boolean(
    (gameOverResult && gameOverResult.toLowerCase().includes("forfeit")) ||
    (messages.length > 0 && messages[messages.length - 1].toLowerCase().includes("left the game"))
  );

  // 1. Determine player colors & turn status
  const isBlackPlayer = gameState.blackPlayerName.toLowerCase() === currentPlayerName.toLowerCase();
  const isWhitePlayer = gameState.whitePlayerName.toLowerCase() === currentPlayerName.toLowerCase();
  
  const myColor: PlayerColor = isBlackPlayer ? "Black" : "White";
  const myPiece = isBlackPlayer ? "B" : "W";
  const isMyTurn = gameState.currentTurn === myColor && !gameState.isGameOver;

  const isBlackActive = gameState.currentTurn === "Black" && !gameState.isGameOver;
  const isWhiteActive = gameState.currentTurn === "White" && !gameState.isGameOver;

  const opponentName = isBlackPlayer ? gameState.whitePlayerName : gameState.blackPlayerName;
  const opponentColor: PlayerColor = isBlackPlayer ? "White" : "Black";

  // Track the last move made by the opponent and by current player
  const [lastOpponentMove, setLastOpponentMove] = useState<MoveResultDto | null>(null);
  const [lastMyMove, setLastMyMove] = useState<MoveResultDto | null>(null);

  useEffect(() => {
    if (!lastMove) return;
    const moveColor = (lastMove.color || (lastMove as any).Color) as PlayerColor;
    if (moveColor === opponentColor) {
      setLastOpponentMove(lastMove);
    } else if (moveColor === myColor) {
      setLastMyMove(lastMove);
    }
  }, [lastMove, opponentColor, myColor]);

  // Reset move state when new game session begins
  useEffect(() => {
    setLastOpponentMove(null);
    setLastMyMove(null);
  }, [gameState.gameId]);

  // Helper to extract algebraic notation and move details
  const getMoveDetails = (move: MoveResultDto | null | undefined) => {
    if (!move) return null;
    const pos = move.positionDto || (move as any).PositionDto;
    if (!pos) return null;
    const row = typeof pos.row === "number" ? pos.row : (pos as any).Row;
    const col = typeof pos.col === "number" ? pos.col : (pos as any).Col;
    if (typeof row !== "number" || typeof col !== "number") return null;
    const colLetter = String.fromCharCode(65 + col);
    const rowNumber = row + 1;
    const flipped = typeof move.flippedCount === "number" ? move.flippedCount : (move as any).FlippedCount ?? 0;
    return {
      row,
      col,
      coord: `${colLetter}${rowNumber}`,
      flipped,
    };
  };

  const opponentMoveDetails = getMoveDetails(lastOpponentMove);
  const myMoveDetails = getMoveDetails(lastMyMove);
  const latestMoveDetails = getMoveDetails(lastMove);

  // Set of valid moves for fast O(1) lookup: "row,col"
  const validMoveSet = new Set(
    gameState.validMoves.map((m) => `${m.row},${m.col}`)
  );

  const handleCellClick = async (row: number, col: number) => {
    if (!isMyTurn || isSubmittingMove || gameState.isGameOver) return;
    if (!validMoveSet.has(`${row},${col}`)) return;

    try {
      setIsSubmittingMove(true);
      await onMakeMove(row, col);
    } finally {
      setIsSubmittingMove(false);
    }
  };

  // Determine game winner status accurately across all server response formats
  const winnerStr = gameState.winner ? gameState.winner.toLowerCase() : "";

  // Did Black win? (Matches "BlackWins", "Black", player's name, or higher black score on game over)
  const blackWon = 
    winnerStr.includes("black") || 
    (Boolean(gameState.winner) && gameState.winner?.toLowerCase() === gameState.blackPlayerName.toLowerCase()) ||
    (gameState.isGameOver && gameState.blackScore > gameState.whiteScore);

  // Did White win? (Matches "WhiteWins", "White", player's name, or higher white score on game over)
  const whiteWon = 
    winnerStr.includes("white") || 
    (Boolean(gameState.winner) && gameState.winner?.toLowerCase() === gameState.whitePlayerName.toLowerCase()) ||
    (gameState.isGameOver && gameState.whiteScore > gameState.blackScore);

  // Is it a draw? (Matches "Draw", "Tie", or equal score when neither won)
  const isDraw = 
    winnerStr.includes("draw") || 
    winnerStr.includes("tie") || 
    (gameState.isGameOver && !blackWon && !whiteWon && gameState.blackScore === gameState.whiteScore);

  // Is the current player the winner?
  const isWinner = (isBlackPlayer && blackWon) || (isWhitePlayer && whiteWon);

  // Guide dots on traditional Othello boards (at rows/cols 2 and 6, zero-indexed)
  const isGuidePoint = (r: number, c: number) =>
    (r === 2 || r === 6) && (c === 2 || c === 6);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      
      {/* 1. Top HUD: Player Matchup & Live Scoreboard */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
        
        {/* Black Player Card (Left) */}
        <div 
          className={`relative overflow-hidden flex items-center gap-3.5 rounded-2xl border p-4 transition-all duration-500 ${
            isBlackActive
              ? "border-emerald-500/80 bg-gradient-to-br from-slate-950 via-black to-slate-900 text-white shadow-xl shadow-black ring-2 ring-emerald-500/40"
              : "border-slate-800/80 bg-slate-900/50 text-slate-400 opacity-75"
          }`}
        >
          {/* Flying Particles for Active Black Player */}
          {isBlackActive && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <span className="absolute left-6 bottom-0 h-3 w-3 rounded-full border border-emerald-400/60 bg-emerald-400/20 shadow-sm shadow-emerald-400/40 animate-hud-particle-1" />
              <span className="absolute left-1/4 bottom-0 h-2.5 w-2.5 border border-cyan-400/50 bg-cyan-400/20 rotate-45 animate-hud-particle-2" />
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-3.5 w-3.5 rounded-full border border-emerald-300/40 bg-emerald-500/10 animate-hud-particle-3" />
              <span className="absolute right-1/4 bottom-0 h-4 w-4 rounded-full border border-cyan-300/30 animate-hud-particle-4" />
              <span className="absolute right-8 bottom-0 h-2 w-2 rounded-full bg-emerald-400/70 shadow-sm shadow-emerald-400 animate-hud-particle-5" />
              <span className="absolute left-3/4 bottom-0 h-2.5 w-2.5 border border-emerald-400/40 bg-emerald-400/10 rotate-12 animate-hud-particle-6" />
            </div>
          )}

          {/* Player Initial Squircle Avatar */}
          <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black text-lg transition-colors duration-300 ${
            isBlackActive
              ? "bg-slate-900 border border-slate-700 text-white shadow-inner"
              : "bg-slate-800/80 border border-slate-700/60 text-slate-300"
          }`}>
            {gameState.blackPlayerName ? gameState.blackPlayerName.charAt(0).toUpperCase() : "B"}
          </div>

          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`font-extrabold text-base truncate ${
                isBlackActive ? "text-white" : "text-slate-300"
              }`}>
                {gameState.blackPlayerName}
              </span>
              {isBlackPlayer && (
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  YOU
                </span>
              )}
            </div>
            {isBlackActive ? (
              <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Turn
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                Waiting
              </span>
            )}
          </div>

          {/* Black Score Badge */}
          <div className={`relative z-10 flex flex-col items-center justify-center rounded-xl px-3.5 py-2 border transition-colors duration-300 ${
            isBlackActive
              ? "bg-slate-900/90 border-slate-700 shadow-md"
              : "bg-slate-950/70 border-slate-800"
          }`}>
            <span className="text-2xl font-black text-white">{gameState.blackScore}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Discs</span>
          </div>
        </div>

        {/* Center: Turn Status & Game Action Banner */}
        <div className="flex flex-col items-center justify-center text-center">
          {gameState.isGameOver ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Match Finished
              </span>
            </div>
          ) : isMyTurn ? (
            <div className="animate-pulse rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-2.5 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-extrabold text-emerald-300 tracking-wide uppercase">
                  Your Turn
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                {gameState.validMoves.length} legal {gameState.validMoves.length === 1 ? "move" : "moves"} available
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-2.5">
              <div className="flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-sm font-semibold text-slate-300">
                  Opponent's Turn
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Waiting for {gameState.currentTurn} to move...
              </p>
            </div>
          )}

          {/* Leave Game / Resign Button */}
          {!gameState.isGameOver && (
            <button
              onClick={() => setShowConfirmLeave(true)}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-all shadow-sm"
            >
              <span>🏳️</span>
              <span>Leave Game</span>
            </button>
          )}
        </div>

        {/* White Player Card (Right) */}
        <div 
          className={`relative overflow-hidden flex items-center gap-3.5 rounded-2xl border p-4 transition-all duration-500 ${
            isWhiteActive
              ? "border-emerald-500/80 bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-950 shadow-xl shadow-white/20 ring-2 ring-emerald-500/40"
              : "border-slate-800/80 bg-slate-900/50 text-slate-400 opacity-75"
          }`}
        >
          {/* Flying Particles for Active White Player */}
          {isWhiteActive && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <span className="absolute left-6 bottom-0 h-3 w-3 rounded-full border border-emerald-600/50 bg-emerald-500/20 shadow-sm shadow-emerald-500/40 animate-hud-particle-1" />
              <span className="absolute left-1/4 bottom-0 h-2.5 w-2.5 border border-teal-600/50 bg-teal-500/20 rotate-45 animate-hud-particle-2" />
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-3.5 w-3.5 rounded-full border border-emerald-700/30 bg-emerald-600/10 animate-hud-particle-3" />
              <span className="absolute right-1/4 bottom-0 h-4 w-4 rounded-full border border-slate-700/30 animate-hud-particle-4" />
              <span className="absolute right-8 bottom-0 h-2 w-2 rounded-full bg-emerald-600/70 shadow-sm shadow-emerald-600 animate-hud-particle-5" />
              <span className="absolute left-3/4 bottom-0 h-2.5 w-2.5 border border-emerald-600/40 bg-emerald-600/15 rotate-12 animate-hud-particle-6" />
            </div>
          )}

          {/* White Score Badge */}
          <div className={`relative z-10 flex flex-col items-center justify-center rounded-xl px-3.5 py-2 border transition-colors duration-300 ${
            isWhiteActive
              ? "bg-slate-950 text-white border-slate-800 shadow-md"
              : "bg-slate-950/70 border-slate-800 text-slate-300"
          }`}>
            <span className="text-2xl font-black text-white">{gameState.whiteScore}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Discs</span>
          </div>

          <div className="relative z-10 flex-1 min-w-0 text-right">
            <div className="flex items-center justify-end gap-1.5">
              {isWhitePlayer && (
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  isWhiteActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  YOU
                </span>
              )}
              <span className={`font-extrabold text-base truncate ${
                isWhiteActive ? "text-slate-950" : "text-slate-300"
              }`}>
                {gameState.whitePlayerName}
              </span>
            </div>
            {isWhiteActive ? (
              <span className="flex items-center justify-end gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 mt-0.5">
                Active Turn
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                Waiting
              </span>
            )}
          </div>

          {/* Player Initial Squircle Avatar */}
          <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black text-lg transition-colors duration-300 ${
            isWhiteActive
              ? "bg-slate-900 border border-slate-800 text-white shadow-md"
              : "bg-slate-800/80 border border-slate-700/60 text-slate-300"
          }`}>
            {gameState.whitePlayerName ? gameState.whitePlayerName.charAt(0).toUpperCase() : "W"}
          </div>
        </div>

      </div>

      {/* 2. The 8x8 Othello Tournament Board Arena */}
      <div className="flex flex-col items-center justify-center">
        
        {/* Column Headers (A - H) Top */}
        <div className="grid grid-cols-8 w-full max-w-[540px] px-8 mb-1.5 text-center text-xs font-extrabold tracking-widest text-slate-300">
          {["A", "B", "C", "D", "E", "F", "G", "H"].map((col) => (
            <span key={col}>{col}</span>
          ))}
        </div>

        {/* Board Container with Row Labels */}
        <div className="flex items-center gap-2">
          {/* Row Labels (1 - 8) Left */}
          <div className="grid grid-rows-8 h-[540px] py-3 text-xs font-extrabold text-slate-300 items-center">
            {["1", "2", "3", "4", "5", "6", "7", "8"].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>

          {/* The 8x8 Felt Grid */}
          <div className="relative aspect-square w-[540px] max-w-[90vw] rounded-2xl border-4 border-emerald-900/80 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 p-3.5 shadow-2xl shadow-black/80 backdrop-blur-xl">
            <div className="grid grid-cols-8 grid-rows-8 h-full w-full gap-1 rounded-xl bg-emerald-950/90 p-1 border border-emerald-800/60">
              
              {gameState.board.map((rowArr, r) =>
                rowArr.map((cellPiece, c) => {
                  const isValid = validMoveSet.has(`${r},${c}`);
                  const isHovered = hoveredMove?.row === r && hoveredMove?.col === c;
                  const hasGuide = isGuidePoint(r, c);
                  const isLastMove = latestMoveDetails?.row === r && latestMoveDetails?.col === c;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      onMouseEnter={() => isValid && isMyTurn && setHoveredMove({ row: r, col: c })}
                      onMouseLeave={() => setHoveredMove(null)}
                      className={`relative flex items-center justify-center rounded-lg transition-all duration-150 ${
                        cellPiece
                          ? isLastMove
                            ? "bg-emerald-800 ring-2 ring-amber-400 shadow-md shadow-amber-400/30"
                            : "bg-emerald-800"
                          : isValid && isMyTurn
                          ? "bg-emerald-700/80 cursor-pointer hover:bg-emerald-600/80 shadow-inner"
                          : "bg-emerald-800/85 hover:bg-emerald-800"
                      }`}
                    >
                      {/* Standard Othello Guide Star Points */}
                      {hasGuide && !cellPiece && (
                        <div className="pointer-events-none absolute h-2 w-2 rounded-full bg-emerald-950/70 shadow-sm" />
                      )}

                      {/* Last Move Indicator Badge */}
                      {isLastMove && cellPiece && (
                        <div className="pointer-events-none absolute top-1 right-1 flex h-2 w-2 z-10">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-sm shadow-amber-300" />
                        </div>
                      )}

                      {/* 3D Black Piece */}
                      {cellPiece === "B" && (
                        <div className="animate-piece-place relative flex h-4/5 w-4/5 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 via-slate-900 to-black shadow-lg shadow-black/80 ring-1 ring-slate-600/40">
                          <div className="h-full w-full rounded-full bg-slate-950/90 border border-slate-700/50 shadow-inner" />
                          <div className="absolute top-1 left-2 h-2.5 w-4 rounded-full bg-white/10 blur-[1px]" />
                        </div>
                      )}

                      {/* 3D White Piece */}
                      {cellPiece === "W" && (
                        <div className="animate-piece-place relative flex h-4/5 w-4/5 items-center justify-center rounded-full bg-gradient-to-br from-white via-slate-100 to-slate-300 shadow-lg shadow-black/40 ring-1 ring-slate-400">
                          <div className="h-full w-full rounded-full bg-slate-50 border border-slate-200 shadow-inner" />
                          <div className="absolute top-1 left-2 h-2.5 w-4 rounded-full bg-white/40 blur-[1px]" />
                        </div>
                      )}

                      {/* Valid Move Indicator (Visible only to the active player) */}
                      {!cellPiece && isValid && isMyTurn && (
                        <div className="flex items-center justify-center h-full w-full">
                          {isHovered ? (
                            /* Ghost Preview Disc on Hover */
                            <div
                              className={`h-4/5 w-4/5 rounded-full opacity-50 shadow-md ${
                                myPiece === "B"
                                  ? "bg-black ring-2 ring-emerald-400"
                                  : "bg-white ring-2 ring-emerald-400"
                              }`}
                            />
                          ) : (
                            /* Pulsing Valid Move Dot */
                            <div className="animate-valid-move h-3.5 w-3.5 rounded-full bg-emerald-300/80 shadow-md shadow-emerald-300/50" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Row Labels (1 - 8) Right */}
          <div className="grid grid-rows-8 h-[540px] py-3 text-xs font-extrabold text-slate-300 items-center">
            {["1", "2", "3", "4", "5", "6", "7", "8"].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </div>

        {/* Column Headers (A - H) Bottom */}
        <div className="grid grid-cols-8 w-full max-w-[540px] px-8 mt-1.5 text-center text-xs font-extrabold tracking-widest text-slate-300">
          {["A", "B", "C", "D", "E", "F", "G", "H"].map((col) => (
            <span key={col}>{col}</span>
          ))}
        </div>
      </div>

      {/* 3. Live Match Announcements & Broadcast Log */}
      {(() => {
        const lastRawMessage = messages.length > 0 ? messages[messages.length - 1] : "";
        const isSpecialBroadcast = 
          lastRawMessage.toLowerCase().includes("turn skipped") ||
          lastRawMessage.toLowerCase().includes("forfeit") ||
          lastRawMessage.toLowerCase().includes("game over");

        if (isSpecialBroadcast) {
          return (
            <div className="mt-6 mx-auto max-w-xl rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-center shadow-lg">
              <p className="text-xs font-semibold text-amber-300 flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>{lastRawMessage}</span>
              </p>
            </div>
          );
        }

        if (opponentMoveDetails) {
          return (
            <div className="mt-6 mx-auto max-w-xl rounded-xl border border-slate-800/80 bg-slate-900/80 p-3.5 text-center shadow-lg shadow-black/30 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                {/* Opponent Disc Indicator */}
                <span className={`inline-block h-3 w-3 rounded-full border shadow-sm ${
                  opponentColor === "Black" ? "bg-slate-900 border-slate-600 ring-1 ring-slate-700" : "bg-white border-slate-300 ring-1 ring-slate-400"
                }`} />

                <span className="text-slate-400">
                  Last move by opponent (<strong className="text-slate-200">{opponentName}</strong>):
                </span>

                <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-xs font-black text-emerald-400 tracking-wider">
                  {opponentMoveDetails.coord}
                </span>

                <span className="text-slate-500">•</span>

                <span className="text-slate-300">
                  flipped <strong className="text-emerald-400 font-bold">{opponentMoveDetails.flipped}</strong> {opponentMoveDetails.flipped === 1 ? "disc" : "discs"}
                </span>
              </div>
            </div>
          );
        }

        // If opponent hasn't moved yet, but current player has moved
        if (myMoveDetails) {
          return (
            <div className="mt-6 mx-auto max-w-xl rounded-xl border border-slate-800/80 bg-slate-900/80 p-3.5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                <span className="text-slate-400">You played</span>
                <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-xs font-black text-emerald-400 tracking-wider">
                  {myMoveDetails.coord}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  Waiting for opponent (<strong className="text-slate-200">{opponentName}</strong>) to move...
                </span>
              </div>
            </div>
          );
        }

        // Default initial message when match begins
        return (
          <div className="mt-6 mx-auto max-w-xl rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-center">
            <p className="text-xs text-slate-400 font-mono">
              {lastRawMessage || `Game started! ${gameState.blackPlayerName} moves first.`}
            </p>
          </div>
        );
      })()}

      {/* 4. Game Over Celebration Modal */}
      {gameState.isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/95 p-8 text-center shadow-2xl shadow-emerald-950/60">
            {/* Top Glow Accent */}
            <div 
              className={`absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-72 rounded-full blur-3xl ${
                isWinner ? "bg-emerald-500/30" : isDraw ? "bg-amber-500/20" : "bg-rose-500/20"
              }`} 
            />

            {/* Celebration Icon */}
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800/80 border border-slate-700 text-4xl shadow-lg">
              {isWinner ? "🏆" : isDraw ? "⚖️" : "🤝"}
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {isForfeit
                ? (isWinner ? "VICTORY BY FORFEIT! 🏆" : "MATCH FORFEITED")
                : isWinner
                ? "VICTORY!"
                : isDraw
                ? "DRAW MATCH!"
                : "DEFEAT"}
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              {isForfeit
                ? (isWinner
                    ? "The opponent left the game. You win by forfeit!"
                    : "You left the game and forfeited the match.")
                : isWinner
                ? "Outstanding strategy! You dominated the board."
                : isDraw
                ? "An evenly matched battle of wits!"
                : "Good game! Review your flips and try again."}
            </p>

            {/* Final Scores Breakdown */}
            <div className="my-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-slate-400">⚫ {gameState.blackPlayerName}</span>
                <span className="text-3xl font-black text-white mt-1">{gameState.blackScore}</span>
              </div>
              <div className="flex flex-col items-center border-l border-slate-800">
                <span className="text-xs font-semibold text-slate-400">⚪ {gameState.whitePlayerName}</span>
                <span className="text-3xl font-black text-white mt-1">{gameState.whiteScore}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={onLeaveMatch}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all"
              >
                Return to Lobby Browser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Leave Confirmation Modal */}
      {showConfirmLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-2xl text-rose-400">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-white">Leave Game?</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Leaving the game will automatically disband the match and award the victory to your opponent.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowConfirmLeave(false)}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Continue Playing
              </button>
              <button
                onClick={() => {
                  setShowConfirmLeave(false);
                  onLeaveMatch();
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-md shadow-rose-950/50 transition-colors"
              >
                Yes, Leave Game
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
