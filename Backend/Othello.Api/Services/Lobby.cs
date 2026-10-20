using Othello.Domain;
using Othello.Domain.Interfaces;

namespace Othello.Api.Services;

public class Lobby
{
    public const int MaxPlayers = 2;
    public int Id { get; private set; }
    public string Name { get; private set; }
    public bool IsPublic { get; set; }

    private List<IPlayer> _players = new List<IPlayer>();

    public IReadOnlyList<IPlayer> Players => _players;
    public IPlayer CreatedBy { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public GameManager? Game { get; private set; }
    public Action<IPlayer?>? OnPlayerJoined;
    public Action<IPlayer?>? OnPlayerLeft;

    public Lobby(int id, IPlayer player, string name, bool isPublic)
    {
        Id = id;
        Name = name;
        CreatedBy = player;

        _players.Add(player);
        CreatedAt = DateTime.UtcNow;

        IsPublic = isPublic;
    }

    public bool Join(IPlayer player)
    {
        if (_players.Count >= MaxPlayers)
        {
            return false;
        }

        _players.Add(player);
        OnPlayerJoined?.Invoke(player);
        return true;
    }

    public bool Leave(IPlayer player)
    {
        if (!_players.Contains(player))
        {
            return false;
        }

        _players.Remove(player);
        OnPlayerLeft?.Invoke(player);
        return true;
    }

    public GameManager StartGame()
    {
        // Guard 
        if (_players.Count != MaxPlayers)
        {
            return null!;
        }
        
        GameManager game = new GameManager(_players[0], _players[1]);
        game.Start();
        
        Game = game;
        return game;
    }

    public bool IsFull() => _players.Count >= 2;
}