using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using Othello.Api.Dtos;
using Othello.Api.Services;
using Othello.Domain;
using static Othello.Api.Utils.Utility;

namespace Othello.Api.Hubs;

public class OthelloHub(ConcurrentDictionary<int, Lobby> gameService, IHubContext<OthelloHub, IGameClient> hubContext)
    : Hub<IGameClient>, IOthelloHubService, IOthelloGameplayService
{
    private readonly ConcurrentDictionary<int, Lobby> _lobbies = gameService;

    /// <summary>
    /// Key = player username, Value = connection id string
    /// </summary>
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
        if (dto.Player == null || string.IsNullOrWhiteSpace(dto.Player.Name))
        {
            await Clients.Caller.ErrorMessage("Invalid player information");
            return;
        }

        var existingLobby = _lobbies.Values.FirstOrDefault(l => l.Players.Any(p => CheckPlayerUsernameEquality(p.Name, dto.Player.Name)));
        if (existingLobby != null)
        {
            if (dto.IsAiGame || (existingLobby.Game != null && existingLobby.Game.IsGameOver()))
            {
                _lobbies.TryRemove(existingLobby.Id, out _);
            }
            else
            {
                await Clients.Caller.ErrorMessage("Cannot create lobby when the player is already in a lobby.");
                return;
            }
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

        if (dto.IsAiGame)
        {
            lobby.IsPublic = false;
            lobby.Join(new GreedyAIPlayer()
            {
                Name = "Greedy AI",
            });
        }

        PlayersConnections.AddOrUpdate(dto.Player.Name, Context.ConnectionId, (_, _) => Context.ConnectionId);

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

        // 1. If match is active in this lobby, player leaving forfeits and other player wins!
        if (lobby.Game != null && !lobby.Game.IsGameOver())
        {
            var remainingPlayer = lobby.Players.FirstOrDefault(p => !CheckPlayerUsernameEquality(p.Name, player.Name));
            if (remainingPlayer != null)
            {
                var remainingColor = remainingPlayer.Color == PieceColor.Black ? "BlackWins" : "WhiteWins";
                var score = lobby.Game.GetScore();
                var finalState = GameSessionService.ToStateDto(lobby.Id.ToString(), lobby.Game);

                var forfeitState = finalState with
                {
                    ValidMoves = [], IsGameOver = true, Winner = remainingPlayer.Name
                };

                await Clients.Group(groupId!)
                    .ReceiveBroadcast($"{player.Name} left the game. {remainingPlayer.Name} wins by forfeit!");
                await Clients.Group(groupId!).GameOver($"{remainingColor} (Forfeit)", score.Black, score.White);
                await Clients.Group(groupId!).ReceiveGameState(forfeitState);
            }

            // Disband the lobby since game is over and player left
            _lobbies.TryRemove(lobby.Id, out _);
            await Clients.Group(groupId!).LobbyDeleted($"Match disbanded because {player.Name} left.");
        }
        else
        {
            // Lobby waiting room mode
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

            if (lobby.Players.Count > 0)
            {
                await Clients.Group(groupId!).ReceiveBroadcast($"{player.Name} left the lobby");
                await Clients.Group(groupId!).ReceiveBroadcast($"Host is now {lobby.CreatedBy.Name}");
            }
        }

        PlayersConnections.Remove(player.Name, out _);
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

        var lobbyGroupId = GetGroupId(lobby.Id);

        // Check if player is already in this lobby (reconnecting / rejoining after lag or page reload)
        bool alreadyInThisLobby = lobby.Players.Any(p => CheckPlayerUsernameEquality(p.Name, dto.Player.Name));
        if (alreadyInThisLobby)
        {
            PlayersConnections.AddOrUpdate(dto.Player.Name, Context.ConnectionId, (_, _) => Context.ConnectionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, lobbyGroupId!);
            await Clients.Caller.ReceiveBroadcast($"Reconnected to lobby {lobby.Name}!");
            return;
        }

        if (lobby.IsFull())
        {
            await Clients.Caller.ErrorMessage("Lobby is already full");
            return;
        }

        bool playerAlreadyInLobby = _lobbies.Values.Any(l =>
            l.Id != lobby.Id && l.Players.Any(p => CheckPlayerUsernameEquality(p.Name, dto.Player.Name)));
        if (playerAlreadyInLobby)
        {
            await Clients.Caller.ErrorMessage("Player is already in another lobby");
            return;
        }

        bool success = lobby.Join(dto.Player);
        if (!success)
        {
            await Clients.Caller.ErrorMessage("Cannot join this lobby");
            return;
        }

        PlayersConnections.AddOrUpdate(dto.Player.Name, Context.ConnectionId, (_, _) => Context.ConnectionId);
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

        // Check if lobby exists
        if (!_lobbies.TryGetValue(dto.LobbyId, out var lobby))
        {
            await Clients.Caller.ErrorMessage("Lobby not found");
            return;
        }

        // Check if player belongs to this lobby
        if (!lobby.Players.Any(p => CheckPlayerUsernameEquality(p.Name, dto.PlayerUsername)))
        {
            await Clients.Caller.ErrorMessage($"Player {dto.PlayerUsername} does not belong to this lobby");
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
            await Clients.Caller.ErrorMessage(
                $"This is not your turn. Waiting for {activePlayer.Name} ({game.CurrentTurn}).");
            return;
        }

        // Try play move
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
        // Guard impersonation
        if (!PlayersConnections.TryGetValue(dto.PlayerUsername, out var connId) || connId != Context.ConnectionId)
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
        if (!CheckPlayerUsernameEquality(lobby.CreatedBy.Name, dto.PlayerUsername))
        {
            await Clients.Caller.ErrorMessage("Only the lobby creator can start the game");
            return;
        }

        // Lobby must have 2 players
        if (!lobby.IsFull())
        {
            await Clients.Caller.ErrorMessage("Lobby needs 2 players to start a game");
            return;
        }

        // Already started
        if (lobby.Game != null && !lobby.Game.IsGameOver())
        {
            await Clients.Caller.ErrorMessage("Game is already in progress.");
            return;
        }

        var game = lobby.StartGame(hubContext);
        var blackPlayer = game.GetPlayer(PieceColor.Black);
        var whitePlayer = game.GetPlayer(PieceColor.White);

        var groupId = GetGroupId(lobby.Id);

        await Clients.Group(groupId!).ReceiveBroadcast(
            $"Game started! {blackPlayer.Name} is Black (B), {whitePlayer.Name} is White (W). Black moves first!"
        );
    }

    #endregion

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var disconnectedPlayer = PlayersConnections.FirstOrDefault(x => x.Value == Context.ConnectionId);
        if (!string.IsNullOrEmpty(disconnectedPlayer.Key))
        {
            
            // We should check if player have relation to lobby
            HumanPlayer player = new HumanPlayer()
            {
                Name = disconnectedPlayer.Key
            };

            var lobby = _lobbies.Values.FirstOrDefault(l => l.Players.Any(p => p.Name == player.Name));

            if (lobby != null)
            {
                await LeaveLobby(new LeaveLobbyDto()
                {
                    LobbyId = lobby.Id,
                    PlayerUsername = player.Name
                });
            }
            
            PlayersConnections.TryRemove(disconnectedPlayer.Key, out _);
        }

        


        await base.OnDisconnectedAsync(exception);
    }
}
