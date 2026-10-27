using Othello.Domain.Interfaces;

namespace Othello.Domain;

public class Piece : IPiece
{
    public PieceColor Color { get; set; }
}