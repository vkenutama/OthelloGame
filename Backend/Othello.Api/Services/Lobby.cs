using Microsoft.AspNetCore.SignalR;
using Othello.Api.Dtos;
using Othello.Api.Hubs;
using Othello.Domain;
using Othello.Domain.Interfaces;

namespace Othello.Api.Services;

public class Lobby
{
    private const int MaxPlayers = 2;
    public int Id { get; private set; }
    public string Name { get; private set; }
    public bool IsPublic { get; set; }
    public string? Password { get; set; }

    private readonly List<IPlayer> _players = new List<IPlayer>();

    public IReadOnlyList<IPlayer> Players
    {
        get
        {
            lock (_players)
            {
                return _players.ToList();
            }
        }
    }

    public IPlayer CreatedBy { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public GameManager? Game { get; private set; }

    public Lobby(int id, IPlayer player, string name, bool isPublic, string? password = null)
    {
        Id = id;
        Name = name;
        CreatedBy = player;

        lock (_players)
        {
            _players.Add(player);
        }
        CreatedAt = DateTime.UtcNow;
        IsPublic = isPublic;
        Password = string.IsNullOrWhiteSpace(password) ? null : password.Trim();
    }

    public bool VerifyPassword(string? inputPassword)
    {
        if (string.IsNullOrEmpty(Password)) return true;
        return string.Equals(Password, inputPassword?.Trim());
    }

    public bool Join(IPlayer player)
    {
        lock (_players)
        {
            if (_players.Count >= MaxPlayers)
            {
                return false;
            }

            _players.Add(player);
        }
        return true;
    }

    public bool Leave(IPlayer player)
    {
        lock (_players)
        {
            if (!_players.Contains(player))
            {
                return false;
            }

            // If player is host, give the room host to other player
            if (player == CreatedBy && _players.Count >= MaxPlayers)
            {
                CreatedBy = _players.FirstOrDefault(p => !p.Equals(player))!;
            }
            _players.Remove(player);
        }
        
        return true;
    }

    public GameManager StartGame(IHubContext<OthelloHub, IGameClient>? hubContext = null)
    {
        IPlayer p1, p2;
        lock (_players)
        {
            if (_players.Count != MaxPlayers)
            {
                return null!;
            }
            p1 = _players[0];
            p2 = _players[1];
        }
        

        Board board = new Board();
        Piece blackPiece = new Piece
        {
            Color = PieceColor.Black
        };
        
        Piece whitePiece = new Piece
        {
            Color = PieceColor.White
        };
        GameManager game = new GameManager(p1, p2, board, blackPiece, whitePiece);
        Game = game;

        if (hubContext != null)
        {
            WireGameEvents(game, Id, hubContext);
        }

        game.Start();
        return game;
    }

    public bool IsFull()
    {
        lock (_players)
        {
            return _players.Count >= MaxPlayers;
        }
    }

    public void WireGameEvents(GameManager game, int lobbyId, IHubContext<OthelloHub, IGameClient> hubContext)
    {
        string groupId = $"lobby_{lobbyId}";

        // 1. Move played event
        game.MovePlayed += move =>
        {
            _ = hubContext.Clients.Group(groupId).MovePlayed(new MoveResultDto
            {
                PositionDto = new PositionDto(move.Target.Row, move.Target.Col),
                Color = move.Color.ToString(),
                FlippedCount = move.Flipped.Count
            });
        };

        // 2. Turn Changed Event (send updated board, scores & next player's valid moves)
        game.TurnChanged += turn =>
        {
            var state = GameSessionService.ToStateDto(lobbyId.ToString(), game);
            _ = hubContext.Clients.Group(groupId).ReceiveGameState(state);
        };

        // 3. Turn Skipped Event
        game.TurnSkipped += skippedColor =>
        {
            _ = hubContext.Clients.Group(groupId).TurnSkipped(skippedColor.ToString());
            _ = hubContext.Clients.Group(groupId).ReceiveBroadcast(
                $"Player {skippedColor} has no valid moves! Turn skipped."
            );
        };

        // 4. Game Over Event
        game.GameOver += result =>
        {
            var finalScore = game.GetScore();
            var finalState = GameSessionService.ToStateDto(lobbyId.ToString(), game);
            _ = hubContext.Clients.Group(groupId).ReceiveGameState(finalState);
            _ = hubContext.Clients.Group(groupId).GameOver(
                result.ToString(),
                finalScore.Black,
                finalScore.White
            );
        };
    }
}
