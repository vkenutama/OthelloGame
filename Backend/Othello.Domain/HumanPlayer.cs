using Othello.Domain.Interfaces;

namespace Othello.Domain;

public class HumanPlayer : IPlayer
{
    public PieceColor Color { get; set; }
    public string Name { get; set; } = string.Empty;
}