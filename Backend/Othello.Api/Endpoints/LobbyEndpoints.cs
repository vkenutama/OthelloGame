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
            var result = lobbies.Values.Where(l => l.IsPublic).Select(l => new GetLobbyDetailsDto
            {
                Id = l.Id,
                Name = l.Name,
                CreatedBy = l.CreatedBy.Name,
                PlayersCount = l.Players.Count,
            }).ToList();

            return Results.Ok(result);
        });

        group.MapGet("{id:int}", (int id, ConcurrentDictionary<int, Lobby> lobbies) =>
        {
            if (!lobbies.TryGetValue(id, out var lobby))
            {
                return Results.NotFound();
            }

            var result = new
            {
                Id = lobby.Id,
                Name = lobby.Name,
                CreatedBy = lobby.CreatedBy.Name,
                IsPublic = lobby.IsPublic,
                PlayersCount = lobby.Players.Count,
                Players = lobby.Players.Select(p => p.Name).ToList()
            };

            return Results.Ok(result);
        });
    }
}
