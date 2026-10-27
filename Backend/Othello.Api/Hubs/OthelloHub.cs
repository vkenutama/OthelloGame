using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using Othello.Api.Dtos;
using Othello.Api.Models;
using Othello.Api.Services;
using Othello.Domain;
using Othello.Domain.Interfaces;
using static Othello.Api.Utils.Utility;

namespace Othello.Api.Hubs;

public class OthelloHub(
    ConcurrentDictionary<int, Lobby> gameService,
    IHubContext<OthelloHub, IGameClient> hubContext,
    List<IChat> chats)
    : Hub<IGameClient>, IOthelloHubService, IOthelloGameplayService
{
    private readonly ConcurrentDictionary<int, Lobby> _lobbies = gameService;

    /// <summary>
    /// Key = player username, Value = connection id string
    /// </summary>
    private static readonly ConcurrentDictionary<string, string> LobbyPlayersConnections = new();

    /// <summary>
    /// Hold the chats for the session
    /// </summary>
    private readonly List<IChat> _chats = chats;

    private static readonly ConcurrentDictionary<string, int> AllConnectedPlayers = new();

    private record DisconnectionTimeoutState(
        string DisconnectedPlayerName,
        CancellationTokenSource Cts
    );

    private static readonly ConcurrentDictionary<int, DisconnectionTimeoutState> DisconnectionTimeouts = new();

    private static int _lobbyId;

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
        if (string.IsNullOrWhiteSpace(dto.Player.Name))
        {
            await Clients.Caller.ErrorMessage("Invalid player information");
            return;
        }

        // Clean up any existing AI lobbies or completed lobbies for this player before creating a new one
        var playerLobbies = _lobbies.Values.Where(l =>
            l.Players.Any(p => CheckPlayerUsernameEquality(p.Name, dto.Player.Name))).ToList();

        foreach (var existing in playerLobbies)
        {
            bool isAi = existing.Players.Any(p => p is IAutoPlayer || p.Name == "Greedy AI");
            if (dto.IsAiGame || isAi || (existing.Game != null && existing.Game.IsGameOver()))
            {
                _lobbies.TryRemove(existing.Id, out _);
            }
            else
            {
                await JoinLobby(new JoinLobbyDto
                {
                    LobbyId = existing.Id,
                    Player = dto.Player,
                    Password = dto.Password
                });
                return;
            }
        }

        int id = Interlocked.Increment(ref _lobbyId);
        Lobby lobby = new Lobby(id, dto.Player, dto.Name, dto.IsPublic, dto.Password);

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

        LobbyPlayersConnections.AddOrUpdate(dto.Player.Name, Context.ConnectionId, (_, _) => Context.ConnectionId);

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

        if (DisconnectionTimeouts.TryRemove(lobby.Id, out var activeTimeout))
        {
            activeTimeout.Cts.Cancel();
            activeTimeout.Cts.Dispose();
        }

        var player = lobby.Players.FirstOrDefault(p => p.Name == dto.PlayerUsername);
        if (player == null)
        {
            await Clients.Caller.ErrorMessage("Player doesn't exist");
            return;
        }

        bool isAiGame = lobby.Players.Any(p => p is IAutoPlayer || p.Name == "Greedy AI");
        if (isAiGame)
        {
            _lobbies.TryRemove(lobby.Id, out _);
            LobbyPlayersConnections.Remove(player.Name, out _);
            if (groupId != null)
            {
                await Clients.Group(groupId).LobbyDeleted("AI match ended.");
            }
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

        LobbyPlayersConnections.Remove(player.Name, out _);
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

        if (DisconnectionTimeouts.TryRemove(dto.LobbyId, out var activeTimeout))
        {
            activeTimeout.Cts.Cancel();
            activeTimeout.Cts.Dispose();
        }

        bool success = _lobbies.TryRemove(dto.LobbyId, out _);
        if (!success)
        {
            await Clients.Caller.ErrorMessage("Cannot delete this lobby");
            return;
        }

        await Clients.Group(groupId!).LobbyDeleted("Lobby deleted");

        foreach (var p in lobby.Players)
        {
            var removed = LobbyPlayersConnections.TryRemove(p.Name, out var connectionId);
            if (removed)
            {
                await Groups.RemoveFromGroupAsync(connectionId!, groupId!);
            }
        }
    }

    public async Task JoinLobby(JoinLobbyDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Player.Name))
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
        if (lobbyGroupId == null)
        {
            await Clients.Caller.ErrorMessage("Internal server error occurred");
            return;
        }

        // Check if player is already in this lobby (reconnecting / rejoining after lag or page reload)
        bool alreadyInThisLobby = lobby.Players.Any(p => CheckPlayerUsernameEquality(p.Name, dto.Player.Name));
        if (alreadyInThisLobby)
        {
            // Cancel and remove disconnection timeout if active for this player
            if (DisconnectionTimeouts.TryGetValue(lobby.Id, out var timeoutState))
            {
                if (CheckPlayerUsernameEquality(timeoutState.DisconnectedPlayerName, dto.Player.Name))
                {
                    if (DisconnectionTimeouts.TryRemove(lobby.Id, out _))
                    {
                        timeoutState.Cts.Cancel();
                        timeoutState.Cts.Dispose();
                    }
                }
            }

            LobbyPlayersConnections.AddOrUpdate(dto.Player.Name, Context.ConnectionId, (_, _) => Context.ConnectionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, lobbyGroupId);
            await Clients.Caller.ReceiveBroadcast($"Reconnected to lobby {lobby.Name}!");

            if (lobby.Game != null)
            {
                var currentState = GameSessionService.ToStateDto(lobby.Id.ToString(), lobby.Game);
                await Clients.Caller.ReceiveGameState(currentState);
                await Clients.OthersInGroup(lobbyGroupId).OpponentReconnected(dto.Player.Name);
                await Clients.OthersInGroup(lobbyGroupId).ReceiveBroadcast($"Player {dto.Player.Name} reconnected! Resuming match...");
            }
            return;
        }

        if (lobby.IsFull())
        {
            await Clients.Caller.ErrorMessage("Lobby is already full");
            return;
        }

        // Verify password if lobby is protected
        if (dto.Password != null && !lobby.VerifyPassword(dto.Password))
        {
            await Clients.Caller.ErrorMessage("Incorrect lobby password");
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

        LobbyPlayersConnections.AddOrUpdate(dto.Player.Name, Context.ConnectionId, (_, _) => Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, lobbyGroupId);

        // Broadcast directly to the room
        await Clients.Group(lobbyGroupId).ReceiveBroadcast($"Player {dto.Player.Name} joined lobby {lobby.Name}!");
    }

    public async Task GetMyLobby(string username)
    {
        var lobby = _lobbies.Values.FirstOrDefault(l => l.Players.FirstOrDefault(p => p.Name == username) != null);

        if (lobby != null)
        {
            await Clients.Caller.ReceiveBroadcast(lobby.Id.ToString());
        }
    }

    public async Task PostChat(SendChatDto dto)
    {
        Chat chat = new Chat
        {
            Message = dto.Message,
            Username = dto.Username,
            PostedAt = DateTime.UtcNow,
            LobbyId = dto.LobbyId
        };

        _chats.Add(chat);

        var messageId = Guid.NewGuid().ToString();

        // Broadcast to all
        if (dto.LobbyId == null)
        {
            await Clients.All.ReceiveChat(new ReceiveChatDto
            {
                Id = messageId,
                Message = chat.Message,
                Username = chat.Username,
                PostedAt = chat.PostedAt,
                LobbyId = null
            });
        }
        // Broadcast only to lobby chat
        else
        {
            bool found = _lobbies.TryGetValue(dto.LobbyId.Value, out var lobby);
            if (!found)
                return;

            var groupId = GetGroupId(lobby!.Id);

            await Clients.Group(groupId!).ReceiveChat(new ReceiveChatDto
            {
                Id = messageId,
                Message = chat.Message,
                Username = chat.Username,
                PostedAt = chat.PostedAt,
                LobbyId = dto.LobbyId
            });
        }
    }

    public async Task GetOnlinePlayersCount()
    {
        var onlineCount = AllConnectedPlayers.Count;
        await Clients.Caller.OnlinePlayersCountChanged(onlineCount);
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
        if (!LobbyPlayersConnections.TryGetValue(dto.PlayerUsername, out var connId) || connId != Context.ConnectionId)
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
        }
    }

    public async Task StartGame(StartGameDto dto)
    {
        // Guard impersonation
        if (!LobbyPlayersConnections.TryGetValue(dto.PlayerUsername, out var connId) || connId != Context.ConnectionId)
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

        var initialState = GameSessionService.ToStateDto(lobby.Id.ToString(), game);
        await Clients.Group(groupId!).ReceiveGameState(initialState);
        await Clients.Group(groupId!).ReceiveBroadcast(
            $"Game started! {blackPlayer.Name} is Black (B), {whitePlayer.Name} is White (W). Black moves first!"
        );
    }

    #endregion

    public override async Task OnConnectedAsync()
    {
        AllConnectedPlayers.TryAdd(Context.ConnectionId, 0);
        await Clients.All.OnlinePlayersCountChanged(AllConnectedPlayers.Count);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var disconnectedPlayer = LobbyPlayersConnections.FirstOrDefault(x => x.Value == Context.ConnectionId);

        if (!string.IsNullOrEmpty(disconnectedPlayer.Key))
        {
            var playerName = disconnectedPlayer.Key;
            var lobby = _lobbies.Values.FirstOrDefault(l => l.Players.Any(p => CheckPlayerUsernameEquality(p.Name, playerName)));

            if (lobby != null)
            {
                bool isAi = lobby.Players.Any(p => p is IAutoPlayer || p.Name == "Greedy AI");
                if (isAi)
                {
                    _lobbies.TryRemove(lobby.Id, out _);
                    LobbyPlayersConnections.TryRemove(disconnectedPlayer.Key, out _);
                    return;
                }

                // If player is in active match, start 30s timeout grace period instead of immediate forfeit
                if (lobby.Game != null && !lobby.Game.IsGameOver())
                {
                    await HandleMatchPlayerDisconnectedAsync(lobby, playerName);
                }
                else
                {
                    // In waiting room mode, normal leave
                    await LeaveLobby(new LeaveLobbyDto()
                    {
                        LobbyId = lobby.Id,
                        PlayerUsername = playerName
                    });
                }
            }

            LobbyPlayersConnections.TryRemove(disconnectedPlayer.Key, out _);
        }

        AllConnectedPlayers.TryRemove(Context.ConnectionId, out _);
        await Clients.All.OnlinePlayersCountChanged(AllConnectedPlayers.Count);
        await base.OnDisconnectedAsync(exception);
    }

    private async Task HandleMatchPlayerDisconnectedAsync(Lobby lobby, string playerName)
    {
        var groupId = GetGroupId(lobby.Id);
        if (groupId == null) return;

        if (DisconnectionTimeouts.TryRemove(lobby.Id, out var existing))
        {
            existing.Cts.Cancel();
            existing.Cts.Dispose();
        }

        var cts = new CancellationTokenSource();
        var timeoutState = new DisconnectionTimeoutState(playerName, cts);
        DisconnectionTimeouts[lobby.Id] = timeoutState;

        const int timeoutSeconds = 30;

        // 1. Notify remaining player in the room about disconnection and the 30s timeout
        await hubContext.Clients.Group(groupId).OpponentDisconnected(playerName, timeoutSeconds);
        await hubContext.Clients.Group(groupId).ReceiveBroadcast(
            $"Opponent {playerName} disconnected. Waiting {timeoutSeconds}s for them to rejoin..."
        );

        // 2. Schedule 30-second timeout task
        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(timeoutSeconds), cts.Token);

                // If not cancelled, timeout elapsed! Forfeit the match!
                if (DisconnectionTimeouts.TryRemove(lobby.Id, out _))
                {
                    await ForfeitMatchAsync(lobby.Id, playerName);
                }
            }
            catch (OperationCanceledException)
            {
                // Player reconnected within 30s
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in disconnection timeout: {ex.Message}");
            }
            finally
            {
                cts.Dispose();
            }
        });
    }

    private async Task ForfeitMatchAsync(int lobbyId, string disconnectedPlayerName)
    {
        if (!_lobbies.TryGetValue(lobbyId, out var lobby)) return;
        if (lobby.Game == null || lobby.Game.IsGameOver()) return;

        var groupId = GetGroupId(lobby.Id);
        var remainingPlayer = lobby.Players.FirstOrDefault(p => !CheckPlayerUsernameEquality(p.Name, disconnectedPlayerName));
        if (remainingPlayer != null)
        {
            var remainingColor = remainingPlayer.Color == PieceColor.Black ? "BlackWins" : "WhiteWins";
            var score = lobby.Game.GetScore();
            var finalState = GameSessionService.ToStateDto(lobby.Id.ToString(), lobby.Game);

            var forfeitState = finalState with
            {
                ValidMoves = [],
                IsGameOver = true,
                Winner = remainingPlayer.Name
            };

            await hubContext.Clients.Group(groupId!)
                .ReceiveBroadcast($"{disconnectedPlayerName} did not rejoin within 30 seconds. {remainingPlayer.Name} wins by forfeit!");
            await hubContext.Clients.Group(groupId!).GameOver($"{remainingColor} (Forfeit)", score.Black, score.White);
            await hubContext.Clients.Group(groupId!).ReceiveGameState(forfeitState);
        }

        // Clean up connections and lobby
        foreach (var p in lobby.Players)
        {
            LobbyPlayersConnections.TryRemove(p.Name, out _);
        }

        _lobbies.TryRemove(lobby.Id, out _);
        await hubContext.Clients.Group(groupId!).LobbyDeleted($"Match disbanded because {disconnectedPlayerName} disconnected.");
    }
}