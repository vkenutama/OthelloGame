using Othello.Domain.Interfaces;

namespace Othello.Domain;

public class Cell : ICell
{
    public Position Position { get; set; }
    public IPiece? Piece { get; set; }
}