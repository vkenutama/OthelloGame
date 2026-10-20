using System.Collections.Concurrent;
using Othello.Api.Dtos;
using Othello.Domain;

namespace Othello.Api.Services;

public class GameSessionService
{
    private readonly ConcurrentDictionary<string, GameManager> _activeGames = new();

    public GameManager CreateGame(string gameId, string player1Name = "Player 1", string player2Name = "Player 2")
    {
        var player1 = new HumanPlayer
        {
            Name = player1Name
        };

        var player2 = new HumanPlayer
        {
            Name = player2Name
        };

        var game = new GameManager(player1, player2);
        _activeGames[gameId] = game;

        game.Start();
        return game;
    }

    public GameManager? GetGame(string gameId)
    {
        _activeGames.TryGetValue(gameId, out GameManager? game);
        return game;
    }

    public bool RemoveGame(string gameId)
    {
        return _activeGames.TryRemove(gameId, out _);
    }

    public static GameStateDto ToStateDto(string gameId, GameManager game)
    {
        var boardArray = new string?[8][];

        for (int r = 0; r < 8; r++)
        {
            boardArray[r] = new string?[8];
            for (int c = 0; c < 8; c++)
            {
                var piece = game.Board.Cells[r, c].Piece;

                boardArray[r][c] = piece switch
                {
                    { Color: PieceColor.Black } => "B",
                    { Color: PieceColor.White } => "W",
                    _ => null
                };
            }
        }

        var validMoves = game.GetValidMoves() ?? new List<Position>();
        var validMoveDtos = validMoves
            .Select(p => new PositionDto(p.Row, p.Col))
            .ToList();

        var score = game.GetScore();
        var blackPlayer = game.GetPlayer(PieceColor.Black);
        var whitePlayer = game.GetPlayer(PieceColor.White);

        return new GameStateDto
        {
            GameId = gameId,
            Board = boardArray,
            CurrentTurn = game.CurrentTurn.ToString(),
            BlackPlayerName = blackPlayer.Name,
            WhitePlayerName = whitePlayer.Name,
            BlackScore = score.Black,
            WhiteScore = score.White,
            ValidMoves = validMoveDtos,
            IsGameOver = game.IsGameOver(),
            Winner = game.Result?.ToString()
        };
    }
}
