using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using Othello.Api.Dtos;
using Othello.Api.Services;
using Othello.Domain;
using static Othello.Api.Utils.Utility;

namespace Othello.Api.Hubs;

public class OthelloHub(ConcurrentDictionary<int, Lobby> gameService) : Hub<IGameClient>, IOthelloHubService, IOthelloGameplayService
{
    private readonly ConcurrentDictionary<int, Lobby> _lobbies = gameService;

    private static readonly ConcurrentDictionary<string, string> PlayersConnections = new();

    private int LobbyCount() => _lobbies.Count;
    private static int _lobbyId = 0;

    #region Lobby
    private string? GetGroupId(int lobbyId)
    {
        if (!_lobbies.TryGetValue(lobbyId, out var lobby))
        {
            return null;
        }

        return $"lobby_{lobby.Id}";
    }

    public async Task CreateLobby(CreateLobbyDto dto)
    {
        bool playerAlreadyCreateLobby = _lobbies.Values.Any(l => CheckPlayerUsernameEquality(l.CreatedBy.Name, dto.Player.Name));
        if (playerAlreadyCreateLobby)
        {
            await Clients.Caller.ErrorMessage("Cannot create lobby when the player is already on the lobby.");
            return;
        }
        
        if (dto.Player == null || string.IsNullOrWhiteSpace(dto.Player.Name))
        {
            await Clients.Caller.ErrorMessage("Invalid player information");
            return;
        }

        int id = Interlocked.Increment(ref _lobbyId);
        Lobby lobby = new Lobby(id, dto.Player, dto.Name, dto.IsPublic);

        bool isCreated = _lobbies.TryAdd(id, lobby);

        if (!isCreated)
        {
            await Clients.Caller.ErrorMessage("Lobby not created");
            return;
        }

        string? lobbyGroupId = GetGroupId(id);
        if (lobbyGroupId == null)
        {
            await Clients.Caller.ErrorMessage("Internal server error occurred");
            return;
        }

        PlayersConnections.TryAdd(dto.Player.Name, Context.ConnectionId);

        await Groups.AddToGroupAsync(Context.ConnectionId, lobbyGroupId);
        await Clients.Caller.ReceiveBroadcast($"Lobby {lobby.Name} created with ID {lobby.Id}");
    }

    public async Task LeaveLobby(LeaveLobbyDto dto)
    {
        if (!_lobbies.TryGetValue(dto.LobbyId, out var lobby))
        {
            await Clients.Caller.ErrorMessage("Lobby not found");
            return;
        }

        var groupId = GetGroupId(lobby.Id);

        var player = lobby.Players.FirstOrDefault(p => p.Name == dto.PlayerUsername);
        if (player == null)
        {
            await Clients.Caller.ErrorMessage("Player doesn't exist");
            return;
        }

        bool success = lobby.Leave(player);
        if (!success)
        {
            await Clients.Caller.ErrorMessage("Cannot leave this lobby");
            return;
        }

        if (lobby.Players.Count == 0)
        {
            _lobbies.TryRemove(lobby.Id, out _);
        }

        PlayersConnections.Remove(player.Name, out _);

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId!);
        await Clients.Caller.ReceiveBroadcast("Left lobby");
        await Clients.Group(groupId!).ReceiveBroadcast($"{player.Name} left the lobby");
    }

    public async Task DeleteLobby(DeleteLobbyDto dto)
    {
        if (!_lobbies.TryGetValue(dto.LobbyId, out var lobby))
        {
            await Clients.Caller.ErrorMessage("Lobby not found");
            return;
        }

        // Check if player is host
        
        if (!CheckPlayerUsernameEquality(lobby.CreatedBy.Name, dto.PlayerUsername))
        {
            await Clients.Caller.ErrorMessage("Only the lobby creator can delete this lobby");
            return;
        }

        string? groupId = GetGroupId(lobby.Id);
        bool success = _lobbies.TryRemove(dto.LobbyId, out _);
        if (!success)
        {
            await Clients.Caller.ErrorMessage("Cannot delete this lobby");
            return;
        }

        await Clients.Group(groupId!).LobbyDeleted("Lobby deleted");

        foreach (var p in lobby.Players)
        {
            var removed = PlayersConnections.TryRemove(p.Name, out var connectionId);
            if (removed)
            {
                await Groups.RemoveFromGroupAsync(connectionId!, groupId!);
            }
        }
    }

    public async Task JoinLobby(JoinLobbyDto dto)
    {
        if (dto.Player == null || string.IsNullOrWhiteSpace(dto.Player.Name))
        {
            await Clients.Caller.ErrorMessage("Invalid player information");
            return;
        }

        if (!_lobbies.TryGetValue(dto.LobbyId, out var lobby))
        {
            await Clients.Caller.ErrorMessage("Lobby not found");
            return;
        }

        if (lobby.IsFull())
        {
            await Clients.Caller.ErrorMessage("Lobby is already full");
            return;
        }

        bool playerAlreadyExist = lobby.Players.Any(p => CheckPlayerUsernameEquality(p.Name, dto.Player.Name));
        if (playerAlreadyExist)
        {
            await Clients.Caller.ErrorMessage("Player already joined this lobby");
            return;
        }

        bool success = lobby.Join(dto.Player);
        if (!success)
        {
            await Clients.Caller.ErrorMessage("Cannot join this lobby");
            return;
        }

        var lobbyGroupId = GetGroupId(lobby.Id);

        PlayersConnections.TryAdd(dto.Player.Name, Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, lobbyGroupId!);

        // Broadcast directly to the room
        await Clients.Group(lobbyGroupId!).ReceiveBroadcast($"Player {dto.Player.Name} joined lobby {lobby.Name}!");
    }

    public async Task BroadcastMessage(int lobbyId, string message)
    {
        var groupId = GetGroupId(lobbyId);
        if (string.IsNullOrEmpty(groupId))
        {
            await Clients.Caller.ErrorMessage("Lobby with this id doesn't exist");
            return;
        }

        await Clients.Group(groupId).ReceiveBroadcast(message);
    }
    #endregion
    #region Game
    public async Task MakeMove(MakeMoveDto dto)
    {
        // Check also the connection id
        if (!PlayersConnections.TryGetValue(dto.PlayerUsername, out var connId) || connId != Context.ConnectionId)
        {
            await Clients.Caller.ErrorMessage("Unauthorized: You cannot move for another player.");
            return;
        }
        
        // Check if lobby exist
        if (!_lobbies.TryGetValue(dto.LobbyId, out var lobby))
        {
            await Clients.Caller.ErrorMessage("Lobby not found");
            return;
        }
        
        // Check if player is valid to this lobby
        if (!lobby.Players.Any(p => CheckPlayerUsernameEquality(p.Name, dto.PlayerUsername)))
        {
            await Clients.Caller.ErrorMessage($"Player {dto.PlayerUsername} is not belong to this lobby");
            return;
        }
        
        // Get the game 
        GameManager? game = lobby.Game;
        if (game == null)
        {
            await Clients.Caller.ErrorMessage("Game is not started yet, or the lobby is not started yet");
            return;
        }
        
        // Check if this player is current turn
        var activePlayer = game.GetPlayer(game.CurrentTurn);
        if (!CheckPlayerUsernameEquality(dto.PlayerUsername, activePlayer.Name))
        {
            await Clients.Caller.ErrorMessage($"This is not your turn. Waiting for {activePlayer.Name} ({game.CurrentTurn}).");
            return;
        }
        
        // Try play
        MoveResult result = game.TryPlayMove(new Position
        {
            Row = dto.Row,
            Col = dto.Col
        });

        if (!result.IsSuccess)
        {
            await Clients.Caller.ErrorMessage($"Invalid move: {result.Failure}");
            return;
        }
        
        
        
        
    }
    public async Task StartGame(StartGameDto dto)
    {
        // Guard impersonate other player
        if (PlayersConnections.TryGetValue(dto.PlayerUsername, out var connId) && connId != Context.ConnectionId)
        {
            await Clients.Caller.ErrorMessage("You cannot start a game");
            return;
        }

        if (!_lobbies.TryGetValue(dto.LobbyId, out var lobby))
        {
            await Clients.Caller.ErrorMessage("Lobby not found");
            return;
        }
        
        // Check if the player is host
        if(!CheckPlayerUsernameEquality(lobby.CreatedBy.Name, dto.PlayerUsername))
        {
            await Clients.Caller.ErrorMessage("You're not allowed to start a game");
            return;
        }

        // Lobby is not meet minimum-maximum players of 2
        if (!lobby.IsFull())
        {
            await Clients.Caller.ErrorMessage("Lobby need 2 players to start a game");
            return;
        }
        
        // Already start
        if (lobby.Game != null && !lobby.Game.IsGameOver())
        {
            await Clients.Caller.ErrorMessage("Game is already in progress.");
            return;
        }

        var game = lobby.StartGame();
        var blackPlayer = game.GetPlayer(PieceColor.Black);
        var whitePlayer = game.GetPlayer(PieceColor.White);

        var groupId = GetGroupId(lobby.Id);
        
        await Clients.Group(groupId!).ReceiveBroadcast(
            $"Game started! {blackPlayer.Name} is Black (B), {whitePlayer.Name} is White (W). Black moves first!"
        );
    }

    #endregion

    
}
