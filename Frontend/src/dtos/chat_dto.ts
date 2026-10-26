export interface SendChatDto {
    Message: string;
    Username: string;
    PostedAt?: Date | string | null;
    LobbyId: number | null;
}

export interface ReceiveChatDto {
    id?: string;
    message?: string;
    username?: string;
    postedAt?: string | Date;
    lobbyId?: number | null;

    // PascalCase compatibility
    Id?: string;
    Message?: string;
    Username?: string;
    PostedAt?: string | Date;
    LobbyId?: number | null;
}

export interface ChatMessageItem {
    id: string;
    message: string;
    username: string;
    postedAt: Date;
    lobbyId: number | null; // null for global chat, number for lobby/match chat
}
