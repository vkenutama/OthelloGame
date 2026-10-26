using Othello.Domain.Interfaces;

namespace Othello.Domain;

public class RandomAIPlayer : IAutoPlayer
{
    private readonly Random _random = new Random();
    public PieceColor Color { get; set; }
    public string Name { get; set; } = "Random AI";

    public Move ChooseMove(IReadOnlyList<Move> moves)
    {
        if (moves == null || moves.Count == 0)
        {
            throw new InvalidOperationException("No valid moves available for AI.");
        }

        int index = _random.Next(moves.Count);
        return moves[index];
    }
}
