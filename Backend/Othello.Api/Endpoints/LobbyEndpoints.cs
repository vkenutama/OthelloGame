using System.Collections.Concurrent;
using Othello.Api.Dtos;
using Othello.Api.Services;

namespace Othello.Api.Endpoints;

public static class LobbyEndpoints
{
    public static void MapLobbyEndpoint(this WebApplication app)
    {
        var group = app.MapGroup("/api/lobby/");

        group.MapGet("", (ConcurrentDictionary<int, Lobby> lobbies) =>
        {
            var result = lobbies.Values.Select(l => new GetLobbyDetailsDto
            {
                Id = l.Id,
                Name = l.Name,
                CreatedBy = l.CreatedBy.Name,
                PlayersCount = l.Players.Count,
            }).ToList();

            return Results.Ok(result);
        });
    }
}