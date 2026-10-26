export interface GetLobbyDetailsDto {
    id: number;
    name: string;
    createdBy: string;
    playersCount: number;
    maxPlayers: number;
    hasPassword?: boolean;
    isPublic?: boolean;
}
