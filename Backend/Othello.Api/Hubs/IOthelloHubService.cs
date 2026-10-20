using Othello.Api.Dtos;

namespace Othello.Api.Hubs;

public interface IOthelloHubService
{
    Task CreateLobby(CreateLobbyDto dto);
    Task LeaveLobby(LeaveLobbyDto dto);
    Task DeleteLobby(DeleteLobbyDto dto);
    Task JoinLobby(JoinLobbyDto dto);
}