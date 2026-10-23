using Othello.Domain;
using Othello.Domain.Interfaces;

namespace Othello.Api.Dtos;

public record CreateLobbyDto
{
    public string Name { get; init; } = string.Empty;
    public bool IsPublic { get; init; } = false;
    public HumanPlayer Player { get; init; } = null!;
    public bool IsAiGame { get; init; } = false;
}

public record LeaveLobbyDto
{
    public int LobbyId { get; set; }
    public string PlayerUsername { get; set; } = string.Empty;
}

public record DeleteLobbyDto
{
    public int LobbyId { get; set; }
    public string PlayerUsername { get; set; } = string.Empty;
}

public record JoinLobbyDto
{
    public int LobbyId { get; set; }
    public HumanPlayer Player { get; set; } = null!;
}

public record StartGameDto
{
    public int LobbyId { get; set; }
    public string PlayerUsername { get; set; } = null!;
}

public record GetLobbyDetailsDto
{
    public int Id { get; init; }
    public string Name { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public int PlayersCount { get; set; }
    public int MaxPlayers { get; private set; } = 2;
}