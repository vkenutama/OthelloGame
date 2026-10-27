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
  isAiGame: boolean;
  password?: string;
}

export interface JoinLobbyDto {
  lobbyId: number;
  player: HumanPlayerDto;
  password?: string;
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

export interface LeaveLobbyDto {
  lobbyId: number;
  playerUsername: string;
}

export interface ActiveLobbyInfo {
  id: number;
  name: string;
  createdBy: string;
  isPublic?: boolean;
  hasPassword?: boolean;
  playersCount: number;
  guestName?: string | null;
}

export interface OpponentDisconnectionInfo {
  playerName: string;
  timeoutSeconds: number;
  startTime: number;
}

// --- Chat Lobby Invite Payload ---

export interface LobbyInvitePayload {
  type: "lobby_invite";
  lobbyId: number;
  lobbyName: string;
  hostName: string;
  targetUser?: string | null;
  hasPassword?: boolean;
}

export const OTHELLO_INVITE_PREFIX = "[OTHELLO_INVITE]:";

export function formatLobbyInvite(
  lobbyId: number,
  lobbyName: string,
  hostName: string,
  targetUser?: string | null,
  hasPassword?: boolean
): string {
  const payload: LobbyInvitePayload = {
    type: "lobby_invite",
    lobbyId,
    lobbyName,
    hostName,
    targetUser: targetUser || null,
    hasPassword: Boolean(hasPassword),
  };
  return `${OTHELLO_INVITE_PREFIX}${JSON.stringify(payload)}`;
}

export function parseLobbyInvite(raw: string): LobbyInvitePayload | null {
  if (!raw || !raw.startsWith(OTHELLO_INVITE_PREFIX)) return null;
  try {
    const jsonStr = raw.substring(OTHELLO_INVITE_PREFIX.length);
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.type === "lobby_invite" && typeof parsed.lobbyId === "number") {
      return parsed as LobbyInvitePayload;
    }
  } catch {
    return null;
  }
  return null;
}
