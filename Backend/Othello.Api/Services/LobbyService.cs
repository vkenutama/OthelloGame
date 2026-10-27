using System.Collections.Concurrent;
using Othello.Api.Common;
using Othello.Api.Dtos;

namespace Othello.Api.Services;

public class LobbyService(ConcurrentDictionary<int, Lobby> lobbies) : ILobbyService
{
    private readonly ConcurrentDictionary<int, Lobby> _lobbies = lobbies;

    public ServiceResult<List<GetLobbyDetailsDto>> GetPublicLobbies()
    {
        var result = _lobbies.Values
            .Where(l => l.IsPublic)
            .Select(l => new GetLobbyDetailsDto
            {
                Id = l.Id,
                Name = l.Name,
                CreatedBy = l.CreatedBy.Name,
                PlayersCount = l.Players.Count,
                HasPassword = !string.IsNullOrEmpty(l.Password),
                IsPublic = l.IsPublic,
            })
            .ToList();

        return ServiceResult<List<GetLobbyDetailsDto>>.Success(result);
    }

    public ServiceResult<GetLobbyDetailsDto> GetLobbyById(int id)
    {
        if (!_lobbies.TryGetValue(id, out var lobby))
        {
            return ServiceResult<GetLobbyDetailsDto>.NotFound($"Lobby with ID {id} was not found.");
        }

        var result = new GetLobbyDetailsDto
        {
            Id = lobby.Id,
            Name = lobby.Name,
            CreatedBy = lobby.CreatedBy.Name,
            IsPublic = lobby.IsPublic,
            HasPassword = !string.IsNullOrEmpty(lobby.Password),
            PlayersCount = lobby.Players.Count,
            Players = lobby.Players.ToList()
        };

        return ServiceResult<GetLobbyDetailsDto>.Success(result);
    }

    public ServiceResult<GetLobbyDetailsDto> GetLobbyByPlayerName(string playerName)
    {
        if (string.IsNullOrWhiteSpace(playerName))
        {
            return ServiceResult<GetLobbyDetailsDto>.BadRequest("Player name cannot be empty.");
        }

        var lobby = _lobbies.Values.FirstOrDefault(l =>
            l.Players.Any(p => string.Equals(p.Name, playerName, StringComparison.OrdinalIgnoreCase)));

        if (lobby == null)
        {
            return ServiceResult<GetLobbyDetailsDto>.NotFound($"No active lobby found for player '{playerName}'.");
        }

        var result = new GetLobbyDetailsDto
        {
            Id = lobby.Id,
            Name = lobby.Name,
            CreatedBy = lobby.CreatedBy.Name,
            PlayersCount = lobby.Players.Count,
            IsPublic = lobby.IsPublic,
            HasPassword = !string.IsNullOrEmpty(lobby.Password),
            Players = lobby.Players.ToList()
        };

        return ServiceResult<GetLobbyDetailsDto>.Success(result);
    }
}
