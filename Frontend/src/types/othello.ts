export type Piece = "B" | "W" | null;
export type PlayerColor = "Black" | "White";

// --- Receive DTOs (from SignalR Server) ---

export interface PositionDto {
  row: number;
  col: number;
}

export interface GameStateDto {
  gameId: string;
  board: Piece[][]; // 8x8 matrix: board[row][col]
  currentTurn: PlayerColor;
  blackPlayerName: string;
  whitePlayerName: string;
  blackScore: number;
  whiteScore: number;
  validMoves: PositionDto[];
  isGameOver: boolean;
  winner: string | null;
}

export interface MoveResultDto {
  positionDto: PositionDto;
  color: PlayerColor;
  flippedCount: number;
}

// --- Send DTOs (to SignalR Server) ---

export interface HumanPlayerDto {
  name: string;
}

export interface CreateLobbyDto {
  player: HumanPlayerDto;
  name: string;
  isPublic: boolean;
}

export interface JoinLobbyDto {
  lobbyId: number;
  player: HumanPlayerDto;
}

export interface StartGameDto {
  lobbyId: number;
  playerUsername: string;
}

export interface MakeMoveDto {
  lobbyId: number;
  playerUsername: string;
  row: number;
  col: number;
}
