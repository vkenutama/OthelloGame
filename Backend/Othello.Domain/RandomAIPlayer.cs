using Othello.Domain.Interfaces;

namespace Othello.Domain;

// ReSharper disable once InconsistentNaming
public class RandomAIPlayer : IAutoPlayer
{
    private Random _random = new Random();
    public PieceColor Color { get; set; }
    public string Name { get; set; }
    
    public Move ChooseMove(IReadOnlyList<Move> moves)
    {
        throw new NotImplementedException();
    }
}