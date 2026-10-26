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
                HasPassword = !string.IsNullOrEmpty(l.Password),
                IsPublic = l.IsPublic,
            }).ToList();

            return Results.Ok(result);
        });

        //Get lobby by id 
        group.MapGet("{id:int}", (int id, ConcurrentDictionary<int, Lobby> lobbies) =>
        {
            if (!lobbies.TryGetValue(id, out var lobby))
            {
                return Results.NotFound();
            }

            var result = new GetLobbyDetailsDto()
            {
                Id = lobby.Id,
                Name = lobby.Name,
                CreatedBy = lobby.CreatedBy.Name,
                IsPublic = lobby.IsPublic,
                HasPassword = !string.IsNullOrEmpty(lobby.Password),
                PlayersCount = lobby.Players.Count,
                Players = lobby.Players.ToList()
            };

            return Results.Ok(result);
        });


        // Get this player lobby Id
        group.MapGet("player/{playerName}", (string playerName, ConcurrentDictionary<int, Lobby> lobbies) =>
        {
            var lobby = lobbies.Values.FirstOrDefault(l => l.Players.FirstOrDefault(p => p.Name == playerName) != null);
            
            if(lobby == null)
                return Results.NotFound();

            var result = new GetLobbyDetailsDto
            {
                Id = lobby.Id,
                Name = lobby.Name,
                CreatedBy = lobby.CreatedBy.Name,
                PlayersCount = lobby.Players.Count
            };
            
            return Results.Ok(result);
        });
    }
}