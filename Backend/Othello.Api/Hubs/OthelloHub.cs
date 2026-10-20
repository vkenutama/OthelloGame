using System.Collections.Concurrent;
using Microsoft.AspNetCore.Mvc.TagHelpers.Cache;
using Microsoft.AspNetCore.SignalR;
using Othello.Api.Dtos;
using Othello.Api.Services;
using Othello.Domain;

namespace Othello.Api.Hubs;

public class OthelloHub(ConcurrentDictionary<int, Lobby> gameService) : Hub<IGameClient>
{
    private readonly ConcurrentDictionary<int, Lobby> _lobbies;
}