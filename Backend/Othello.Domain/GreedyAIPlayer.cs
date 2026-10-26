using Othello.Domain.Interfaces;

namespace Othello.Domain;

// ReSharper disable once InconsistentNaming
public class GreedyAIPlayer : IAutoPlayer
{
    public PieceColor Color { get; set; }
    public string Name { get; set; } = "Greedy AI";

    public Move ChooseMove(IReadOnlyList<Move> moves)
    {
        if (moves == null || moves.Count == 0)
        {
            throw new InvalidOperationException("No valid moves available for AI.");
        }

        return moves.OrderByDescending(m => m.Flipped.Count).First();
    }
}
